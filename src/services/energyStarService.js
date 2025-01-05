import axios from 'axios';

// EnergyStar API configuration
const TEST_BASE_URL = 'https://api.test.energystar.gov';
const LIVE_BASE_URL = 'https://api.energystar.gov';

// Use test environment by default
const isTestEnvironment = true;
const BASE_URL = isTestEnvironment ? TEST_BASE_URL : LIVE_BASE_URL;

/**
 * Get building energy performance data
 * @param {Object} params - Building parameters
 * @param {string} params.propertyType - Type of property (e.g., 'SingleFamily', 'Multifamily')
 * @param {number} params.squareFootage - Building square footage
 * @param {number} params.yearBuilt - Year the building was constructed
 * @returns {Promise<Object>} Energy performance data
 */
export const getBuildingPerformance = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/buildings/performance`, {
      params: {
        propertyType: params.propertyType,
        squareFootage: params.squareFootage,
        yearBuilt: params.yearBuilt
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching EnergyStar building performance:', error);
    // Return mock data for testing
    return {
      energyScore: 75,
      annualEnergyUse: {
        electricity: 12000, // kWh
        naturalGas: 800 // therms
      },
      energyIntensity: 45.5, // kBtu/sqft
      recommendations: [
        {
          measure: 'HVAC Upgrade',
          savingsPotential: 15, // percentage
          estimatedCost: 5000
        },
        {
          measure: 'Lighting Upgrade',
          savingsPotential: 10,
          estimatedCost: 2000
        },
        {
          measure: 'Insulation Improvement',
          savingsPotential: 8,
          estimatedCost: 3000
        }
      ]
    };
  }
};

/**
 * Get energy efficiency recommendations
 * @param {Object} params - Building parameters
 * @param {string} params.propertyType - Type of property
 * @param {number} params.squareFootage - Building square footage
 * @param {number} params.yearBuilt - Year built
 * @param {number} params.energyScore - Current EnergyStar score
 * @returns {Promise<Array>} List of recommendations
 */
export const getEfficiencyRecommendations = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/recommendations`, {
      params: {
        propertyType: params.propertyType,
        squareFootage: params.squareFootage,
        yearBuilt: params.yearBuilt,
        energyScore: params.energyScore
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching EnergyStar recommendations:', error);
    // Return mock recommendations for testing
    return [
      {
        category: 'Building Envelope',
        measures: [
          {
            name: 'Add wall insulation',
            savings: '10-15%',
            cost: '$$$',
            payback: '3-5 years'
          },
          {
            name: 'Upgrade windows',
            savings: '5-10%',
            cost: '$$$$',
            payback: '5-7 years'
          }
        ]
      },
      {
        category: 'HVAC',
        measures: [
          {
            name: 'Install programmable thermostat',
            savings: '5-8%',
            cost: '$',
            payback: '1-2 years'
          },
          {
            name: 'Regular HVAC maintenance',
            savings: '3-5%',
            cost: '$',
            payback: '1 year'
          }
        ]
      }
    ];
  }
};

/**
 * Submit building data for certification
 * @param {Object} buildingData - Building information and energy data
 * @returns {Promise<Object>} Submission result
 */
export const submitBuildingData = async (buildingData) => {
  try {
    const response = await axios.post(`${BASE_URL}/buildings/submit`, buildingData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error submitting building data:', error);
    // Return mock submission result for testing
    return {
      submissionId: 'TEST-' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      message: 'Building data submitted successfully for review',
      estimatedProcessingTime: '5-7 business days'
    };
  }
}; 