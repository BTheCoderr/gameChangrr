import { api } from '../utils/apiUtils';
import { validateApiRequest } from '../utils/validationUtils';
import { cacheManager } from '../utils/cacheUtils';

const CACHE_KEY = 'utilityRates';

// Fetch utility rate data with caching
export const getUtilityRates = async ({ zipCode, provider, rateClass = 'residential' }) => {
  try {
    // Check cache first
    const cacheKey = `${CACHE_KEY}:${zipCode}:${provider}:${rateClass}`;
    const cachedData = cacheManager.get('utilityData', { cacheKey });
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API
    const response = await api.get('/api/utility-rates', {
      params: { zipCode, provider, rateClass }
    });

    // Cache the response
    cacheManager.set('utilityData', { cacheKey }, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching utility rates:', error);
    throw error;
  }
};

// Generate realistic mock utility rate data
export const generateMockUtilityRates = (params = {}) => {
  const {
    state = 'CA',
    rateClass = 'residential',
    season = getCurrentSeason(),
    peakHours = true
  } = params;

  // Base rates by state ($/kWh)
  const baseRates = {
    CA: { base: 0.24, peak: 0.36, offPeak: 0.18 },
    NY: { base: 0.21, peak: 0.31, offPeak: 0.16 },
    TX: { base: 0.12, peak: 0.18, offPeak: 0.09 },
    FL: { base: 0.13, peak: 0.19, offPeak: 0.10 }
  };

  // Seasonal adjustments
  const seasonalFactors = {
    summer: 1.2,
    winter: 0.9,
    spring: 1.0,
    fall: 1.0
  };

  // Rate class adjustments
  const rateClassFactors = {
    residential: 1.0,
    commercial: 0.9,
    industrial: 0.8
  };

  const stateRates = baseRates[state] || baseRates.CA;
  const seasonalFactor = seasonalFactors[season];
  const rateClassFactor = rateClassFactors[rateClass];

  // Calculate adjusted rates
  const adjustedRates = {
    base: stateRates.base * seasonalFactor * rateClassFactor,
    peak: stateRates.peak * seasonalFactor * rateClassFactor,
    offPeak: stateRates.offPeak * seasonalFactor * rateClassFactor
  };

  // Generate time-of-use periods
  const timeOfUsePeriods = peakHours ? generateTimeOfUsePeriods(season) : null;

  // Generate rate history
  const rateHistory = generateRateHistory(adjustedRates.base);

  return {
    provider: generateProviderInfo(state),
    rates: adjustedRates,
    timeOfUse: timeOfUsePeriods,
    rateHistory,
    demandCharges: generateDemandCharges(rateClass),
    fees: generateUtilityFees(),
    programDetails: generateProgramDetails()
  };
};

// Helper functions for mock data generation
const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) return 'summer';
  if (month >= 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  return 'fall';
};

const generateTimeOfUsePeriods = (season) => {
  const summerPeak = { start: '16:00', end: '21:00' };
  const winterPeak = { start: '17:00', end: '20:00' };

  return {
    peak: season === 'summer' ? summerPeak : winterPeak,
    partialPeak: {
      morning: { start: '10:00', end: '16:00' },
      evening: { start: '21:00', end: '23:00' }
    },
    offPeak: { start: '23:00', end: '10:00' },
    holidays: [
      'New Year\'s Day',
      'Memorial Day',
      'Independence Day',
      'Labor Day',
      'Thanksgiving',
      'Christmas'
    ]
  };
};

const generateRateHistory = (baseRate) => {
  const months = 24;
  const volatility = 0.02; // 2% monthly variation

  return Array.from({ length: months }, (_, index) => {
    const monthsAgo = months - index;
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);

    // Add some realistic variation and trend
    const trend = 1 + (monthsAgo * 0.001); // Slight upward trend
    const variation = 1 + (Math.random() * 2 - 1) * volatility;
    const rate = baseRate * trend * variation;

    return {
      date: date.toISOString().slice(0, 7),
      rate: Number(rate.toFixed(4)),
      change: Number(((rate / baseRate - 1) * 100).toFixed(2))
    };
  });
};

const generateProviderInfo = (state) => {
  const providers = {
    CA: ['Pacific Gas & Electric', 'Southern California Edison', 'San Diego Gas & Electric'],
    NY: ['Con Edison', 'National Grid', 'PSEG Long Island'],
    TX: ['Oncor', 'CenterPoint Energy', 'AEP Texas'],
    FL: ['Florida Power & Light', 'Duke Energy Florida', 'Tampa Electric']
  };

  const stateProviders = providers[state] || providers.CA;
  const selectedProvider = stateProviders[Math.floor(Math.random() * stateProviders.length)];

  return {
    name: selectedProvider,
    state,
    website: `https://www.${selectedProvider.toLowerCase().replace(/\s+/g, '')}.com`,
    phone: `1-800-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    serviceArea: `${state} Service Territory`
  };
};

const generateDemandCharges = (rateClass) => {
  const baseCharge = rateClass === 'residential' ? 0 : 8.50;
  
  return {
    applicable: rateClass !== 'residential',
    rate: baseCharge,
    threshold: 20,
    measurement: '15-minute intervals',
    billingDemand: 'Highest monthly peak',
    exemptions: ['Holidays', 'Weekends']
  };
};

const generateUtilityFees = () => {
  return {
    basic: {
      name: 'Basic Service Fee',
      amount: 10,
      frequency: 'monthly'
    },
    regulatory: {
      name: 'Regulatory Cost Charge',
      amount: 0.00145,
      unit: 'per kWh'
    },
    distribution: {
      name: 'Distribution Charge',
      amount: 0.05,
      unit: 'per kWh'
    },
    transmission: {
      name: 'Transmission Charge',
      amount: 0.03,
      unit: 'per kWh'
    }
  };
};

const generateProgramDetails = () => {
  return {
    netMetering: {
      available: true,
      compensationRate: 0.85, // 85% of retail rate
      annualSettlement: true,
      capacityLimit: 1000, // kW
      aggregationAllowed: true
    },
    demandResponse: {
      available: true,
      incentiveRate: 0.50, // $ per kWh reduced
      minimumReduction: 1, // kW
      notificationTime: '24 hours'
    },
    specialPrograms: [
      {
        name: 'EV Charging Rate',
        description: 'Special rate for electric vehicle charging',
        rate: 0.12,
        hours: '23:00-06:00'
      },
      {
        name: 'Solar Battery Storage',
        description: 'Incentives for battery storage systems',
        incentive: 200, // $ per kWh of storage
        maxCapacity: 13 // kWh
      }
    ]
  };
};

// Quick utility rate lookup schema
const quickRateLookupSchema = {
  type: 'object',
  required: ['utilityProvider'],
  properties: {
    utilityProvider: {
      type: 'string',
      minLength: 3,
      description: 'Name of the utility provider'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    }
  }
};

// Quick utility rate lookup
export const quickUtilityRateLookup = async ({ utilityProvider, state }) => {
  try {
    // Validate input
    await validateApiRequest({ utilityProvider, state }, quickRateLookupSchema);

    // Check cache first
    const cacheKey = `${utilityProvider}-${state || 'ANY'}`;
    const cachedData = cacheManager.get('utilityData', cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Generate or fetch rate data
    const mockData = generateMockUtilityRates({ state });
    const simplifiedData = {
      ratePerKWh: mockData.rates.base,
      peakHours: mockData.timeOfUse?.peak 
        ? `${mockData.timeOfUse.peak.start} - ${mockData.timeOfUse.peak.end}`
        : 'Not Available',
      provider: mockData.provider.name,
      state: mockData.provider.state,
      additionalInfo: {
        netMetering: mockData.programDetails.netMetering.available,
        demandResponse: mockData.programDetails.demandResponse.available,
        specialPrograms: mockData.programDetails.specialPrograms.map(program => ({
          name: program.name,
          rate: program.rate
        }))
      }
    };

    // Cache the result
    cacheManager.set('utilityData', cacheKey, simplifiedData);
    return simplifiedData;
  } catch (error) {
    console.error('Error in quick utility rate lookup:', error);
    throw error;
  }
}; 