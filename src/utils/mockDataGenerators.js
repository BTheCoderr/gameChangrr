import { faker } from '@faker-js/faker';
import { validateApiRequest, ValidationError } from './validationUtils';

// Constants for realistic data ranges
const ENERGY_SCORE_RANGES = {
  Office: { min: 50, max: 95, median: 75 },
  Retail: { min: 45, max: 90, median: 70 },
  Multifamily: { min: 40, max: 85, median: 65 },
  Industrial: { min: 55, max: 95, median: 80 },
  Healthcare: { min: 60, max: 98, median: 85 }
};

const UTILITY_RATES = {
  CA: { base: 0.24, peak: 0.36, offPeak: 0.18 },
  NY: { base: 0.21, peak: 0.31, offPeak: 0.16 },
  TX: { base: 0.12, peak: 0.18, offPeak: 0.09 },
  FL: { base: 0.13, peak: 0.19, offPeak: 0.10 }
};

const ROOF_CHARACTERISTICS = {
  pitches: [0, 14, 18, 22.5, 26.5, 30, 33.7, 37.5, 45],
  orientations: ['South', 'Southwest', 'Southeast', 'East', 'West'],
  materials: ['Asphalt Shingle', 'Tile', 'Metal', 'Flat Membrane']
};

// Helper functions for realistic data generation
export const generateEnergyScore = (propertyType) => {
  try {
    const range = ENERGY_SCORE_RANGES[propertyType] || ENERGY_SCORE_RANGES.Office;
    const skew = faker.number.float({ min: -1, max: 1 });
    const baseScore = range.median + (skew * (range.max - range.median) / 2);
    return Math.min(Math.max(Math.round(baseScore), range.min), range.max);
  } catch (error) {
    throw new ValidationError('Error generating energy score', { propertyType, error });
  }
};

export const generateRoofData = () => {
  try {
    const totalArea = faker.number.int({ min: 1000, max: 10000 });
    const obstructionFactor = faker.number.float({ min: 0.1, max: 0.3 });
    const shadingFactor = faker.number.float({ min: 0, max: 0.4 });
    
    const roofData = {
      totalArea,
      usableArea: Math.round(totalArea * (1 - obstructionFactor)),
      pitch: ROOF_CHARACTERISTICS.pitches[
        faker.number.int({ min: 0, max: ROOF_CHARACTERISTICS.pitches.length - 1 })
      ],
      orientation: ROOF_CHARACTERISTICS.orientations[
        faker.number.int({ min: 0, max: ROOF_CHARACTERISTICS.orientations.length - 1 })
      ],
      material: ROOF_CHARACTERISTICS.materials[
        faker.number.int({ min: 0, max: ROOF_CHARACTERISTICS.materials.length - 1 })
      ],
      shading: {
        annual: shadingFactor,
        seasonal: {
          summer: shadingFactor * (1 - faker.number.float({ min: -0.2, max: 0.2 })),
          winter: shadingFactor * (1 + faker.number.float({ min: 0.1, max: 0.4 }))
        },
        obstructions: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
          type: ['Tree', 'Building', 'HVAC Equipment', 'Chimney'][faker.number.int({ min: 0, max: 3 })],
          impactPercent: faker.number.int({ min: 5, max: 30 })
        }))
      },
      condition: {
        age: faker.number.int({ min: 0, max: 25 }),
        remainingLife: faker.number.int({ min: 5, max: 20 }),
        structuralCapacity: faker.number.int({ min: 85, max: 100 })
      }
    };

    // Validate the generated roof data
    return validateApiRequest.roofAssessment(roofData);
  } catch (error) {
    throw new ValidationError('Error generating roof data', error.errors);
  }
};

export const generateEnergyUsage = (propertyType, squareFeet) => {
  try {
    const baseUsagePerSqFt = {
      Office: { min: 14, max: 21 },
      Retail: { min: 18, max: 25 },
      Multifamily: { min: 12, max: 18 },
      Industrial: { min: 20, max: 30 },
      Healthcare: { min: 25, max: 35 }
    }[propertyType] || { min: 15, max: 22 };

    const annualUsage = Math.round(
      squareFeet * faker.number.float({ min: baseUsagePerSqFt.min, max: baseUsagePerSqFt.max })
    );

    const energyData = {
      annual: annualUsage,
      monthly: Array.from({ length: 12 }, (_, month) => {
        const seasonalFactor = 1 + Math.sin((month / 12) * 2 * Math.PI) * 0.3;
        return Math.round(annualUsage / 12 * seasonalFactor);
      }),
      peakDemand: Math.round(annualUsage / 8760 * 2.5),
      baseload: Math.round(annualUsage / 8760 * 0.7)
    };

    // Validate the generated energy usage data
    return validateApiRequest.energyUsage(energyData);
  } catch (error) {
    throw new ValidationError('Error generating energy usage data', error.errors);
  }
};

export const generateUtilityData = (state, usage) => {
  try {
    const rates = UTILITY_RATES[state] || UTILITY_RATES.CA;
    const monthlyUsage = usage.monthly;

    const utilityData = {
      provider: {
        name: faker.company.name() + ' Energy',
        type: ['Investor Owned', 'Municipal', 'Cooperative'][faker.number.int({ min: 0, max: 2 })]
      },
      rates: {
        ...rates,
        timeOfUse: {
          peak: rates.peak,
          offPeak: rates.offPeak,
          shoulder: (rates.peak + rates.offPeak) / 2
        }
      },
      bills: monthlyUsage.map((usage, month) => {
        const baseCost = usage * rates.base;
        const fees = baseCost * 0.15;
        return {
          month: new Date(2023, month, 1).toISOString().slice(0, 7),
          usage,
          demandCharge: usage / 730 * 2.5 * 8.5,
          energyCharge: baseCost,
          fees,
          total: baseCost + fees
        };
      })
    };

    // Validate the generated utility data
    return validateApiRequest.utilityData(utilityData);
  } catch (error) {
    throw new ValidationError('Error generating utility data', error.errors);
  }
};

export const generateSolarPotential = (roofData, energyUsage, utilityData) => {
  const usableArea = roofData.usableArea;
  const orientationEfficiency = {
    South: 1,
    Southwest: 0.95,
    Southeast: 0.95,
    East: 0.85,
    West: 0.85
  }[roofData.orientation] || 0.9;

  const systemSize = Math.min(
    usableArea / 100 * 1.5, // Rough estimate: 100 sq ft per 1.5 kW
    energyUsage.annual / 1400 // Targeting 100% offset
  );

  return {
    systemSize: Math.round(systemSize * 10) / 10,
    annualProduction: Math.round(systemSize * 1400 * orientationEfficiency * (1 - roofData.shading.annual)),
    installationCost: Math.round(systemSize * 1000 * 2.85), // $2.85/W average cost
    savings: {
      first_year: Math.round(systemSize * 1400 * orientationEfficiency * utilityData.rates.base),
      twenty_five_year: Math.round(systemSize * 1400 * orientationEfficiency * utilityData.rates.base * 25 * 0.95)
    },
    environmentalImpact: {
      carbonOffset: Math.round(systemSize * 1400 * 0.92), // lbs CO2 per kWh
      treesEquivalent: Math.round(systemSize * 1400 * 0.92 / 48) // 48 lbs CO2 per tree per year
    }
  };
};

export const calculateLeadPriority = (data) => {
  // Scoring factors
  const scores = {
    energyScore: (100 - data.energyStarScore) * 0.2, // Lower score = higher potential
    billAmount: Math.min(data.utilityData.bills.reduce((sum, bill) => sum + bill.total, 0) / 12 / 500, 1) * 25,
    roofSuitability: (
      (data.roofData.usableArea / data.roofData.totalArea) * 10 +
      (1 - data.roofData.shading.annual) * 10 +
      (data.roofData.orientation === 'South' ? 5 : 0)
    ),
    financialHealth: (
      (data.financialProfile.creditScore - 600) / 200 * 15 +
      Math.min(data.financialProfile.householdIncome / 150000, 1) * 10
    ),
    savingsPotential: Math.min(data.solarPotential.savings.first_year / 5000, 1) * 20
  };

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  return {
    score: Math.round(totalScore),
    level: totalScore >= 80 ? 'High' : totalScore >= 60 ? 'Medium' : 'Low',
    factors: scores,
    nextSteps: totalScore >= 70 ? [
      'Immediate Contact',
      'Site Assessment',
      'Custom Proposal'
    ] : totalScore >= 50 ? [
      'Information Package',
      'Phone Consultation',
      'Virtual Assessment'
    ] : [
      'Educational Materials',
      'Future Follow-up'
    ]
  };
};

// Main export for generating complete mock data
export const generateComprehensiveMockData = (count = 10) => {
  try {
    return Array.from({ length: count }, () => {
      const propertyType = ['Office', 'Retail', 'Multifamily', 'Industrial', 'Healthcare'][
        faker.number.int({ min: 0, max: 4 })
      ];
      const state = ['CA', 'NY', 'TX', 'FL'][faker.number.int({ min: 0, max: 3 })];
      const squareFeet = faker.number.int({ min: 5000, max: 50000 });
      
      const roofData = generateRoofData();
      const energyUsage = generateEnergyUsage(propertyType, squareFeet);
      const utilityData = generateUtilityData(state, energyUsage);
      const solarPotential = generateSolarPotential(roofData, energyUsage, utilityData);

      const baseData = {
        id: faker.string.uuid(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state,
          zipCode: faker.location.zipCode(),
          country: 'USA'
        },
        propertyType,
        squareFeet,
        yearBuilt: faker.number.int({ min: 1960, max: 2020 }),
        energyStarScore: generateEnergyScore(propertyType),
        roofData,
        energyUsage,
        utilityData,
        solarPotential,
        financialProfile: {
          householdIncome: faker.number.int({ min: 75000, max: 250000 }),
          creditScore: faker.number.int({ min: 620, max: 850 }),
          propertyValue: faker.number.int({ min: 400000, max: 2000000 }),
          debtToIncome: faker.number.float({ min: 0.2, max: 0.5, precision: 0.01 }),
          monthlyBill: utilityData.bills[0].total
        }
      };

      // Validate the complete property data
      const validatedData = validateApiRequest.propertyAnalytics(baseData);
      return {
        ...validatedData,
        leadPriority: calculateLeadPriority(validatedData)
      };
    });
  } catch (error) {
    throw new ValidationError('Error generating mock data', error.errors);
  }
}; 