import axios from 'axios'

const NREL_API_KEY = import.meta.env.VITE_NREL_API_KEY;
const BASE_URL = 'https://developer.nrel.gov/api/pvwatts/v6';

// Cache for solar data
const solarCache = new Map();
const CACHE_DURATION = 86400000; // 24 hours in milliseconds

// Mock data for testing
const MOCK_SOLAR_DATA = {
  annualOutput: 6000,
  monthlyOutput: [
    400, 450, 500, 550, 600, 650,
    650, 600, 550, 500, 450, 400
  ],
  capacityFactor: 0.15,
  performanceRatio: 0.75,
  solradAnnual: 5.2,
  solradMonthly: [
    3.8, 4.2, 4.8, 5.2, 5.6, 5.8,
    5.8, 5.6, 5.2, 4.8, 4.2, 3.8
  ]
};

/**
 * Get solar potential data for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} systemCapacity - System capacity in kW
 * @param {string} moduleType - Module type (0=Standard, 1=Premium, 2=Thin film)
 * @param {number} arrayType - Array type (0=Fixed open rack, 1=Fixed roof mount, 2=1-axis tracking, 3=1-axis backtracking, 4=2-axis tracking)
 * @param {number} tilt - Array tilt angle in degrees
 * @param {number} azimuth - Array azimuth angle in degrees (180=south)
 * @param {boolean} useTestData - Whether to use test data instead of making API calls
 * @returns {Promise<Object>} Solar potential data
 */
export const getSolarPotential = async (
  lat,
  lon,
  systemCapacity = 4,
  moduleType = 0,
  arrayType = 1,
  tilt = 20,
  azimuth = 180,
  useTestData = true // Default to test data until live access is granted
) => {
  // Return mock data if in test mode
  if (useTestData) {
    // Scale mock data based on system capacity
    const scaleFactor = systemCapacity / 4; // Base mock data is for 4kW system
    return {
      ...MOCK_SOLAR_DATA,
      annualOutput: MOCK_SOLAR_DATA.annualOutput * scaleFactor,
      monthlyOutput: MOCK_SOLAR_DATA.monthlyOutput.map(output => output * scaleFactor)
    };
  }

  const cacheKey = `solar_${lat}_${lon}_${systemCapacity}_${moduleType}_${arrayType}_${tilt}_${azimuth}`;
  const cachedData = solarCache.get(cacheKey);
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: NREL_API_KEY,
        lat,
        lon,
        system_capacity: systemCapacity,
        module_type: moduleType,
        array_type: arrayType,
        tilt,
        azimuth,
        dataset: 'tmy3',
        timeframe: 'monthly'
      }
    });

    const solarData = {
      annualOutput: response.data.outputs.ac_annual,
      monthlyOutput: response.data.outputs.ac_monthly,
      capacityFactor: response.data.outputs.capacity_factor,
      performanceRatio: response.data.outputs.performance_ratio,
      solradAnnual: response.data.outputs.solrad_annual,
      solradMonthly: response.data.outputs.solrad_monthly
    };

    solarCache.set(cacheKey, {
      data: solarData,
      timestamp: Date.now()
    });

    return solarData;
  } catch (error) {
    console.error('Error fetching solar potential data:', error);
    // Fall back to mock data if API call fails
    return MOCK_SOLAR_DATA;
  }
};

/**
 * Get system size recommendation based on roof area
 * @param {number} roofArea - Available roof area in square feet
 * @param {number} efficiency - Module efficiency (default: 0.2 or 20%)
 * @returns {Object} Recommended system size and estimated production
 */
export const getSystemSizeRecommendation = (roofArea, efficiency = 0.2) => {
  // Typical solar panel is about 17.5 square feet
  const panelArea = 17.5;
  const numberOfPanels = Math.floor(roofArea / panelArea);
  
  // Typical panel produces about 300W at STC
  const wattsPerPanel = 300;
  const systemSizeKW = (numberOfPanels * wattsPerPanel) / 1000;
  
  return {
    recommendedSize: systemSizeKW,
    numberOfPanels,
    estimatedArea: numberOfPanels * panelArea,
    estimatedAnnualProduction: systemSizeKW * 1200 // Rough estimate: 1,200 kWh per kW of installed capacity
  };
};

/**
 * Calculate potential savings from solar installation
 * @param {number} annualProduction - Annual energy production in kWh
 * @param {number} electricityRate - Electricity rate in $/kWh
 * @param {number} systemCost - Total system cost in dollars
 * @param {number} incentiveRate - Federal and state incentive rate as decimal (e.g., 0.3 for 30%)
 * @returns {Object} Financial metrics including payback period and ROI
 */
export const calculateSolarSavings = (
  annualProduction,
  electricityRate = 0.13,
  systemCost = 20000,
  incentiveRate = 0.3
) => {
  const annualSavings = annualProduction * electricityRate;
  const incentives = systemCost * incentiveRate;
  const netCost = systemCost - incentives;
  const paybackPeriod = netCost / annualSavings;
  const roi = (annualSavings * 25 - netCost) / netCost * 100; // 25-year ROI

  return {
    annualSavings,
    totalIncentives: incentives,
    netSystemCost: netCost,
    paybackPeriod,
    roi,
    lifetimeSavings: annualSavings * 25 // Assuming 25-year system life
  };
}; 