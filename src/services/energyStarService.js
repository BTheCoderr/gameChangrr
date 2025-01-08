import axios from 'axios';
import { withRetry } from '../utils/retryUtils';

const ENERGY_STAR_API = {
  baseURL: process.env.VITE_ENERGYSTAR_API_URL || 'https://portfoliomanager.energystar.gov/ws',
  username: process.env.VITE_ENERGYSTAR_USERNAME,
  password: process.env.VITE_ENERGYSTAR_PASSWORD,
  accountId: process.env.VITE_ENERGYSTAR_ACCOUNT_ID
};

// Create axios instance with authentication
const energyStarClient = axios.create({
  baseURL: ENERGY_STAR_API.baseURL,
  auth: {
    username: ENERGY_STAR_API.username,
    password: ENERGY_STAR_API.password
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Rate limiting middleware
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

energyStarClient.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return config;
});

// API Endpoints
export const getPropertyAnalytics = async () => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/account/${ENERGY_STAR_API.accountId}/property/list`)
    );

    return response.data.map(property => ({
      id: property.id,
      address: property.address,
      propertyType: property.primaryFunction,
      energyStarScore: property.energyStarScore,
      currentEnergyUsage: property.siteEnergyUseKBtu,
      potentialSavings: property.energySavingsPotential,
      roi: property.roi,
      lat: property.latitude,
      lng: property.longitude,
      solarCompatible: property.solarCompatible
    }));
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    throw error;
  }
};

export const getEfficiencyRecommendations = async ({ 
  propertyId, 
  energyScore,
  includeSolar = true,
  filters = {}
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/property/${propertyId}/recommendations`, {
        params: {
          energyScore,
          includeSolar,
          ...filters
        }
      })
    );

    return {
      recommendations: response.data.recommendations,
      prioritizedMeasures: response.data.prioritizedMeasures,
      potentialImpact: {
        totalCostSavings: response.data.totalCostSavings,
        totalEnergySavings: response.data.totalEnergySavings,
        carbonReduction: response.data.carbonReduction,
        averagePayback: response.data.averagePayback
      },
      solarIntegration: response.data.solarIntegration
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

export const getUtilityRates = async ({ zipCode }) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/utility/rates/${zipCode}`)
    );

    return {
      rate: response.data.rate,
      provider: response.data.provider,
      rateType: response.data.rateType,
      lastUpdated: response.data.lastUpdated
    };
  } catch (error) {
    console.error('Error fetching utility rates:', error);
    throw error;
  }
};

export const submitBuildingData = async ({ propertyId, data }) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.post(`/property/${propertyId}/metrics`, data)
    );

    return {
      success: true,
      submissionId: response.data.submissionId,
      status: response.data.status
    };
  } catch (error) {
    console.error('Error submitting building data:', error);
    throw error;
  }
};

// New API Endpoints

/**
 * Calculate property suitability score for solar installation
 */
export const getPropertySuitability = async ({
  propertyId,
  address,
  roofData = {},
  utilityData = {}
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.post(`/property/${propertyId}/suitability`, {
        address,
        roofData: {
          totalArea: roofData.totalArea,
          usableArea: roofData.usableArea,
          orientation: roofData.orientation,
          tilt: roofData.tilt,
          shading: roofData.shading
        },
        utilityData: {
          provider: utilityData.provider,
          rate: utilityData.rate,
          averageUsage: utilityData.averageUsage,
          peakDemand: utilityData.peakDemand
        }
      })
    );

    return {
      suitabilityScore: response.data.score,
      recommendations: {
        systemSize: response.data.recommendedSystemSize,
        panelCount: response.data.recommendedPanelCount,
        orientation: response.data.optimalOrientation,
        expectedProduction: response.data.expectedProduction
      },
      financials: {
        estimatedCost: response.data.estimatedCost,
        annualSavings: response.data.annualSavings,
        paybackPeriod: response.data.paybackPeriod,
        roi: response.data.roi,
        npv: response.data.npv
      },
      environmental: {
        carbonOffset: response.data.carbonOffset,
        treesEquivalent: response.data.treesEquivalent,
        environmentalImpact: response.data.environmentalImpact
      }
    };
  } catch (error) {
    console.error('Error calculating property suitability:', error);
    throw error;
  }
};

/**
 * Get historical energy consumption patterns
 */
export const getEnergyConsumptionHistory = async ({
  propertyId,
  startDate,
  endDate,
  interval = 'monthly'
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/property/${propertyId}/consumption-history`, {
        params: {
          startDate,
          endDate,
          interval
        }
      })
    );

    return {
      consumptionData: response.data.consumption,
      patterns: {
        peakUsageTimes: response.data.peakUsageTimes,
        seasonalTrends: response.data.seasonalTrends,
        baseloadUsage: response.data.baseloadUsage
      },
      analysis: {
        averageDaily: response.data.averageDaily,
        averageMonthly: response.data.averageMonthly,
        yearOverYearChange: response.data.yearOverYearChange
      }
    };
  } catch (error) {
    console.error('Error fetching energy consumption history:', error);
    throw error;
  }
};

/**
 * Get nearby comparable properties for benchmarking
 */
export const getPropertyBenchmarks = async ({
  propertyId,
  radius = 5, // miles
  propertyType,
  minSize,
  maxSize
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/property/${propertyId}/benchmarks`, {
      params: {
          radius,
          propertyType,
          minSize,
          maxSize
        }
      })
    );

    return {
      comparableProperties: response.data.properties,
      statistics: {
        averageScore: response.data.averageScore,
        medianUsage: response.data.medianUsage,
        percentile: response.data.percentile
      },
      recommendations: response.data.recommendations
    };
  } catch (error) {
    console.error('Error fetching property benchmarks:', error);
    throw error;
  }
};

/**
 * Get detailed solar potential analysis
 */
export const getSolarPotentialAnalysis = async ({
  propertyId,
  roofId,
  analysisType = 'comprehensive'
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/property/${propertyId}/solar-potential/${roofId}`, {
        params: { analysisType }
      })
    );

    return {
      roofAnalysis: {
        usableArea: response.data.usableArea,
        shadingAnalysis: response.data.shadingAnalysis,
        structuralIntegrity: response.data.structuralIntegrity
      },
      solarProduction: {
        annualProduction: response.data.annualProduction,
        monthlyEstimates: response.data.monthlyEstimates,
        peakProduction: response.data.peakProduction
      },
      systemRecommendations: {
        optimalSize: response.data.optimalSize,
        panelConfiguration: response.data.panelConfiguration,
        inverterRecommendations: response.data.inverterRecommendations
      },
      financialAnalysis: {
        installationCost: response.data.installationCost,
        incentives: response.data.incentives,
        paybackPeriod: response.data.paybackPeriod,
        roi: response.data.roi,
        monthlyPayments: response.data.monthlyPayments
      }
    };
  } catch (error) {
    console.error('Error fetching solar potential analysis:', error);
    throw error;
  }
};

/**
 * Submit and track solar installation project
 */
export const submitSolarProject = async ({
  propertyId,
  projectDetails,
  installationData
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.post(`/property/${propertyId}/solar-project`, {
        projectDetails,
        installationData
      })
    );

    return {
      projectId: response.data.projectId,
      status: response.data.status,
      timeline: response.data.timeline,
      nextSteps: response.data.nextSteps,
      documents: response.data.documents
    };
  } catch (error) {
    console.error('Error submitting solar project:', error);
    throw error;
  }
};

/**
 * Get detailed energy usage trends and analysis
 */
export const getEnergyUsageTrends = async ({
  propertyId,
  utilityProvider,
  startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Default to last 12 months
  endDate = new Date(),
  granularity = 'monthly'
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get(`/property/${propertyId}/energy-trends`, {
        params: {
          utilityProvider,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          granularity
        }
      })
    );

    return {
      usage: {
        monthly: response.data.monthlyUsage,
        hourly: response.data.hourlyPatterns,
        seasonal: response.data.seasonalPatterns,
        peakDemand: response.data.peakDemandData
      },
      costs: {
        monthly: response.data.monthlyCosts,
        averageRate: response.data.averageRate,
        rateVariation: response.data.rateVariation,
        projectedCosts: response.data.projectedCosts
      },
      analysis: {
        trends: {
          shortTerm: response.data.shortTermTrend,
          longTerm: response.data.longTermTrend,
          yearOverYear: response.data.yearOverYearComparison
        },
        anomalies: response.data.anomalies,
        efficiencyMetrics: {
          baseloadEfficiency: response.data.baseloadEfficiency,
          peakLoadEfficiency: response.data.peakLoadEfficiency,
          weatherNormalizedUsage: response.data.weatherNormalizedUsage
        },
        recommendations: {
          behavioral: response.data.behavioralRecommendations,
          operational: response.data.operationalRecommendations,
          equipment: response.data.equipmentRecommendations
        }
      },
      weather: {
        impact: response.data.weatherImpact,
        degreeData: response.data.degreeData,
        correlations: response.data.weatherCorrelations
      },
      benchmarks: {
        similarProperties: response.data.similarPropertiesComparison,
        industryStandards: response.data.industryStandards,
        percentile: response.data.efficiencyPercentile
      }
    };
  } catch (error) {
    console.error('Error fetching energy usage trends:', error);
    throw error;
  }
};

/**
 * Calculate lead score and priority ranking
 */
export const getLeadScore = async ({
  propertyId,
  leadDetails = {},
  energyData = {},
  financialData = {}
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.post(`/property/${propertyId}/lead-score`, {
        propertyDetails: {
          size: leadDetails.propertySize,
          type: leadDetails.propertyType,
          yearBuilt: leadDetails.yearBuilt,
          ownership: leadDetails.ownership,
          occupancy: leadDetails.occupancyStatus
        },
        energyProfile: {
          currentUsage: energyData.currentUsage,
          peakDemand: energyData.peakDemand,
          utilityProvider: energyData.utilityProvider,
          currentBill: energyData.monthlyBill,
          rateStructure: energyData.rateStructure
        },
        financialProfile: {
          income: financialData.householdIncome,
          creditScore: financialData.creditScore,
          propertyValue: financialData.propertyValue,
          existingLoans: financialData.existingLoans,
          taxBracket: financialData.taxBracket
        },
        locationData: {
          solarIncentives: leadDetails.localIncentives,
          utilityRates: leadDetails.utilityRates,
          netMetering: leadDetails.netMeteringPolicy,
          solarIrradiance: leadDetails.solarIrradiance
        }
      })
    );

    return {
      overallScore: response.data.overallScore,
      categoryScores: {
        propertyFit: response.data.propertyScore,
        energyProfile: response.data.energyScore,
        financialHealth: response.data.financialScore,
        locationBenefits: response.data.locationScore
      },
      priorityRanking: {
        level: response.data.priorityLevel,
        rank: response.data.priorityRank,
        percentile: response.data.leadPercentile
      },
      qualificationMetrics: {
        estimatedSavings: response.data.potentialSavings,
        systemSize: response.data.recommendedSystemSize,
        paybackPeriod: response.data.estimatedPayback,
        financingOptions: response.data.availableFinancing
      },
      recommendations: {
        nextSteps: response.data.recommendedActions,
        timeline: response.data.suggestedTimeline,
        customization: response.data.customApproach
      },
      marketingInsights: {
        keyMessages: response.data.targetedMessages,
        painPoints: response.data.identifiedPainPoints,
        valueProposition: response.data.uniqueValue
      }
    };
  } catch (error) {
    console.error('Error calculating lead score:', error);
    throw error;
  }
};

/**
 * Get available solar incentives by location
 */
export const getSolarIncentives = async ({
  zipCode,
  state,
  propertyType = 'residential',
  projectSize,
  propertyValue,
  taxStatus = {}
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get('/incentives', {
      params: {
          zipCode,
          state,
          propertyType,
          projectSize,
          propertyValue,
          taxFilingStatus: taxStatus.filingStatus,
          taxableIncome: taxStatus.taxableIncome,
          taxBracket: taxStatus.bracket
        }
      })
    );

    return {
      federal: {
        taxCredits: response.data.federalIncentives.taxCredits.map(credit => ({
          id: credit.id,
          name: credit.name,
          description: credit.description,
          eligibility: credit.eligibilityRequirements,
          creditAmount: credit.amount,
          creditType: credit.type, // percentage or fixed
          maxAmount: credit.maximumAmount,
          applicablePeriod: credit.applicablePeriod,
          requirements: credit.technicalRequirements,
          forms: credit.requiredForms,
          expirationDate: credit.expirationDate
        })),
        grants: response.data.federalIncentives.grants,
        acceleratedDepreciation: response.data.federalIncentives.depreciation
      },
      state: {
        taxIncentives: response.data.stateIncentives.taxIncentives.map(incentive => ({
          id: incentive.id,
          program: incentive.programName,
          type: incentive.type,
          amount: incentive.amount,
          maxBenefit: incentive.maximumBenefit,
          eligibility: incentive.eligibilityCriteria,
          restrictions: incentive.restrictions,
          applicationProcess: incentive.applicationProcess,
          deadlines: incentive.deadlines
        })),
        rebates: response.data.stateIncentives.rebates.map(rebate => ({
          id: rebate.id,
          program: rebate.programName,
          provider: rebate.provider,
          amount: rebate.amount,
          calculationType: rebate.calculationType,
          requirements: rebate.requirements,
          timeline: rebate.processingTimeline,
          status: rebate.programStatus
        })),
        loans: response.data.stateIncentives.loans
      },
      utility: {
        rebates: response.data.utilityIncentives.rebates,
        netMetering: response.data.utilityIncentives.netMetering,
        interconnection: response.data.utilityIncentives.interconnection
      },
      local: {
        propertyTax: response.data.localIncentives.propertyTaxIncentives,
        permits: response.data.localIncentives.permitIncentives,
        specialPrograms: response.data.localIncentives.specialPrograms
      },
      analysis: {
        totalValue: response.data.analysis.totalIncentiveValue,
        estimatedTimeline: response.data.analysis.incentiveTimeline,
        stackability: response.data.analysis.stackablePrograms,
        recommendations: response.data.analysis.recommendedCombination
      }
    };
  } catch (error) {
    console.error('Error fetching solar incentives:', error);
    throw error;
  }
};

/**
 * Get detailed utility rate information
 */
export const getDetailedUtilityRates = async ({
  utilityProvider,
  zipCode,
  rateClass = 'residential',
  meterType = 'smart',
  includeHistory = true
}) => {
  try {
    const response = await withRetry(() => 
      energyStarClient.get('/utility-rates/detailed', {
        params: {
          provider: utilityProvider,
          zipCode,
          rateClass,
          meterType,
          includeHistory
        }
      })
    );

    return {
      provider: {
        name: response.data.providerName,
        serviceArea: response.data.serviceArea,
        contactInfo: response.data.contactInformation
      },
      baseRates: {
        standard: response.data.standardRate,
        renewable: response.data.renewableEnergyRate,
        minimumCharge: response.data.minimumMonthlyCharge,
        customerCharge: response.data.monthlyCustomerCharge
      },
      timeOfUse: {
        periods: response.data.timeOfUsePeriods.map(period => ({
          name: period.name,
          rate: period.rate,
          hours: period.applicableHours,
          days: period.applicableDays,
          seasons: period.applicableSeasons
        })),
        peakHours: {
          summer: response.data.summerPeakHours,
          winter: response.data.winterPeakHours
        },
        holidaySchedule: response.data.holidaySchedule
      },
      demandCharges: {
        threshold: response.data.demandThreshold,
        rate: response.data.demandRate,
        calculation: response.data.demandCalculationMethod
      },
      seasonalRates: {
        summer: response.data.summerRates,
        winter: response.data.winterRates,
        shoulder: response.data.shoulderSeasonRates
      },
      netMetering: {
        available: response.data.netMeteringAvailable,
        buybackRate: response.data.excessGenerationRate,
        annualSettlement: response.data.annualSettlement,
        capacity: response.data.systemCapacityLimit
      },
      specialPrograms: {
        evCharging: response.data.evChargingProgram,
        solarIncentives: response.data.solarIncentivePrograms,
        energyEfficiency: response.data.efficiencyPrograms
      },
      rateHistory: response.data.rateHistory && {
        monthly: response.data.rateHistory.monthlyAverages,
        annual: response.data.rateHistory.yearlyTrends,
        projections: response.data.rateHistory.futureProjections
      },
      analysis: {
        averageResidentialBill: response.data.averageResidentialBill,
        rateVolatility: response.data.rateVolatility,
        comparisonToStateAverage: response.data.stateComparison
      }
    };
  } catch (error) {
    console.error('Error fetching detailed utility rates:', error);
    throw error;
  }
};

// Enhanced mock data generator
export const generateMockData = (count = 10) => {
  const generateMonthlyData = (months = 12, baseValue = 1000, variation = 0.2) => {
    return Array.from({ length: months }, (_, index) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (months - index - 1));
      
      // Add seasonal variation
      const seasonalFactor = 1 + Math.sin((index / 12) * 2 * Math.PI) * 0.3;
      const randomVariation = 1 + (Math.random() * 2 - 1) * variation;
      
      return {
        date: month.toISOString().slice(0, 7),
        usage: Math.round(baseValue * seasonalFactor * randomVariation),
        cost: Math.round(baseValue * seasonalFactor * randomVariation * 0.15),
        peakDemand: Math.round(baseValue * seasonalFactor * randomVariation * 0.2),
        degreeData: {
          cooling: Math.round(Math.max(0, (Math.random() * 300 - 50))),
          heating: Math.round(Math.max(0, (Math.random() * 300 - 50)))
        }
      };
    });
  };

  const generateLeadScore = () => {
    const baseScore = Math.random() * 100;
    
    return {
      overallScore: Math.round(baseScore),
      categoryScores: {
        propertyFit: Math.round(60 + Math.random() * 40),
        energyProfile: Math.round(50 + Math.random() * 50),
        financialHealth: Math.round(70 + Math.random() * 30),
        locationBenefits: Math.round(40 + Math.random() * 60)
      },
      priorityRanking: {
        level: baseScore > 80 ? 'High' : baseScore > 60 ? 'Medium' : 'Low',
        rank: Math.floor(Math.random() * 100) + 1,
        percentile: Math.round(baseScore)
      },
      qualificationMetrics: {
        estimatedSavings: Math.round(5000 + Math.random() * 15000),
        systemSize: (4 + Math.random() * 8).toFixed(1),
        paybackPeriod: (5 + Math.random() * 7).toFixed(1),
        financingOptions: [
          'Solar Loan',
          'PACE Financing',
          'Solar Lease',
          'Power Purchase Agreement'
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      },
      marketingInsights: {
        keyMessages: [
          'Significant Energy Cost Savings',
          'Environmental Impact',
          'Energy Independence',
          'Increased Property Value'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        painPoints: [
          'High Energy Bills',
          'Environmental Concerns',
          'Grid Reliability',
          'Future Rate Increases'
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      }
    };
  };

  const generateIncentiveData = (state = 'CA') => {
    const federalTaxCredit = {
      id: 'FTC2023',
      name: 'Federal Solar Tax Credit',
      description: 'Investment Tax Credit (ITC) for solar energy systems',
      creditAmount: 0.30,
      maxAmount: null,
      expirationDate: '2032-12-31'
    };

    const stateIncentives = {
      CA: {
        taxCredit: {
          amount: 0.10,
          maxBenefit: 5000,
          program: 'California Solar Initiative'
        },
        rebates: [
          {
            program: 'SGIP',
            amount: 2000,
            type: 'storage'
          },
          {
            program: 'New Solar Homes',
            amount: 3000,
            type: 'newConstruction'
          }
        ]
      },
      NY: {
        taxCredit: {
          amount: 0.25,
          maxBenefit: 5000,
          program: 'NY-Sun Initiative'
        },
        rebates: [
          {
            program: 'NY-Sun Megawatt Block',
            amount: 2500,
            type: 'installation'
          }
        ]
      }
    }[state];

    const utilityIncentives = {
      netMetering: {
        rate: 0.95,
        type: 'retail',
        annualSettlement: true
      },
      rebates: [
        {
          provider: 'Local Utility',
          amount: Math.floor(1000 + Math.random() * 2000),
          type: 'performance'
        }
      ]
    };

    return {
      federal: {
        taxCredits: [federalTaxCredit],
        grants: [],
        acceleratedDepreciation: {
          type: 'MACRS',
          period: '5-year',
          bonus: '100%'
        }
      },
      state: {
        taxIncentives: [stateIncentives.taxCredit],
        rebates: stateIncentives.rebates
      },
      utility: utilityIncentives,
      analysis: {
        totalValue: Math.floor(10000 + Math.random() * 15000),
        estimatedTimeline: {
          taxCredit: 'Next tax filing',
          rebates: '4-6 weeks',
          utility: '2-3 billing cycles'
        }
      }
    };
  };

  const generateUtilityRateData = (provider = 'Local Power & Light') => {
    const baseRate = 0.12 + Math.random() * 0.08; // $0.12-0.20 per kWh
    
    return {
      provider: {
        name: provider,
        serviceArea: ['Northern Region', 'Southern District', 'Metro Area'][Math.floor(Math.random() * 3)],
        contactInfo: {
          phone: '1-800-555-0000',
          email: 'support@localpower.com',
          website: 'www.localpower.com'
        }
      },
      baseRates: {
        standard: baseRate,
        renewable: baseRate * 1.1,
        minimumCharge: 10,
        customerCharge: 15
      },
      timeOfUse: {
        periods: [
          {
            name: 'Off-Peak',
            rate: baseRate * 0.8,
            hours: '21:00-09:00',
            days: 'All',
            seasons: 'All'
          },
          {
            name: 'Mid-Peak',
            rate: baseRate,
            hours: '09:00-16:00',
            days: 'Weekdays',
            seasons: 'All'
          },
          {
            name: 'Peak',
            rate: baseRate * 1.5,
            hours: '16:00-21:00',
            days: 'Weekdays',
            seasons: 'Summer'
          }
        ],
        peakHours: {
          summer: {
            start: '16:00',
            end: '21:00'
          },
          winter: {
            start: '17:00',
            end: '20:00'
          }
        },
        holidaySchedule: ['New Year\'s Day', 'Independence Day', 'Labor Day', 'Thanksgiving', 'Christmas']
      },
      demandCharges: {
        threshold: 10, // kW
        rate: 8.50, // per kW
        calculation: 'Highest 15-minute average during peak hours'
      },
      seasonalRates: {
        summer: {
          months: ['06', '07', '08', '09'],
          rate: baseRate * 1.2
        },
        winter: {
          months: ['12', '01', '02'],
          rate: baseRate * 0.9
        },
        shoulder: {
          months: ['03', '04', '05', '10', '11'],
          rate: baseRate
        }
      },
      netMetering: {
        available: true,
        buybackRate: baseRate * 0.85,
        annualSettlement: true,
        capacity: 25 // kW
      },
      specialPrograms: {
        evCharging: {
          available: true,
          rate: baseRate * 0.7,
          hours: '23:00-05:00'
        },
        solarIncentives: [
          {
            name: 'Solar Rewards',
            type: 'Performance',
            rate: 0.02 // per kWh generated
          }
        ],
        energyEfficiency: [
          'Smart Thermostat Rebate',
          'Home Energy Audit',
          'Appliance Recycling'
        ]
      },
      rateHistory: {
        monthly: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2023, i, 1).toISOString().slice(0, 7),
          rate: baseRate * (1 + (Math.random() * 0.1 - 0.05))
        })),
        annual: Array.from({ length: 5 }, (_, i) => ({
          year: 2019 + i,
          averageRate: baseRate * (0.9 + i * 0.05)
        })),
        projections: Array.from({ length: 3 }, (_, i) => ({
          year: 2024 + i,
          projectedRate: baseRate * (1.1 + i * 0.03)
        }))
      },
      analysis: {
        averageResidentialBill: 125 + Math.random() * 50,
        rateVolatility: Math.random() * 0.15,
        comparisonToStateAverage: (Math.random() * 0.4 - 0.2).toFixed(2) // -20% to +20%
      }
    };
  };

  return Array.from({ length: count }, (_, index) => ({
    id: `PROP${index + 1}`,
    address: `${1000 + index} Market Street, San Francisco, CA 94103`,
    propertyType: ['Office', 'Retail', 'Multifamily'][index % 3],
    energyStarScore: Math.floor(Math.random() * 100),
    currentEnergyUsage: Math.floor(10000 + Math.random() * 50000),
    potentialSavings: Math.floor(1000 + Math.random() * 5000),
    roi: Math.floor(10 + Math.random() * 20),
    lat: 37.7749 + (Math.random() - 0.5) * 0.02,
    lng: -122.4194 + (Math.random() - 0.5) * 0.02,
    solarCompatible: Math.random() > 0.3,
    // New mock data fields
    roofData: {
      totalArea: Math.floor(1000 + Math.random() * 4000),
      usableArea: Math.floor(800 + Math.random() * 3000),
      orientation: ['South', 'Southwest', 'Southeast'][Math.floor(Math.random() * 3)],
      tilt: Math.floor(15 + Math.random() * 20),
      shading: Math.random()
    },
    suitabilityScore: Math.floor(Math.random() * 100),
    consumption: {
      peakUsage: Math.floor(500 + Math.random() * 1500),
      baseload: Math.floor(200 + Math.random() * 500),
      averageMonthly: Math.floor(800 + Math.random() * 2000)
    },
    energyTrends: {
      usage: {
        monthly: generateMonthlyData(12, 10000),
        hourly: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          averageUsage: 300 + Math.sin(hour / 24 * Math.PI * 2) * 200 + Math.random() * 50,
          peakUsage: 500 + Math.sin(hour / 24 * Math.PI * 2) * 300 + Math.random() * 100
        })),
        seasonal: {
          summer: Math.floor(12000 + Math.random() * 3000),
          winter: Math.floor(8000 + Math.random() * 2000),
          shoulder: Math.floor(6000 + Math.random() * 1500)
        }
      },
      analysis: {
        trends: {
          shortTerm: (Math.random() * 0.1 - 0.05).toFixed(3), // -5% to +5%
          longTerm: (Math.random() * 0.2 - 0.1).toFixed(3),   // -10% to +10%
          yearOverYear: (Math.random() * 0.15 - 0.05).toFixed(3) // -5% to +10%
        },
        efficiencyMetrics: {
          baseloadEfficiency: Math.floor(70 + Math.random() * 30),
          peakLoadEfficiency: Math.floor(60 + Math.random() * 40),
          weatherNormalizedUsage: Math.floor(9000 + Math.random() * 3000)
        }
      },
      benchmarks: {
        percentile: Math.floor(Math.random() * 100),
        comparisonMetrics: {
          usagePerSqFt: (Math.random() * 10 + 5).toFixed(2),
          costPerSqFt: (Math.random() * 2 + 1).toFixed(2),
          emissionsPerSqFt: (Math.random() * 5 + 2).toFixed(2)
        }
      },
      anomalies: Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        type: ['spike', 'drop', 'pattern_change'][Math.floor(Math.random() * 3)],
        magnitude: Math.floor(Math.random() * 50 + 20),
        description: 'Unusual energy consumption pattern detected'
      }))
    },
    leadScoring: generateLeadScore(),
    financialProfile: {
      householdIncome: Math.floor(75000 + Math.random() * 150000),
      creditScore: Math.floor(650 + Math.random() * 200),
      propertyValue: Math.floor(400000 + Math.random() * 1000000),
      debtToIncome: (Math.random() * 0.3 + 0.2).toFixed(2),
      monthlyBill: Math.floor(150 + Math.random() * 450)
    },
    qualificationStatus: {
      preQualified: Math.random() > 0.3,
      recommendedProducts: [
        'Premium Solar Package',
        'Standard Solar System',
        'Solar + Storage Bundle'
      ].slice(0, Math.floor(Math.random() * 2) + 1),
      nextSteps: [
        'Site Assessment',
        'Financial Verification',
        'Proposal Review',
        'Contract Signing'
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    },
    incentives: generateIncentiveData(
      ['CA', 'NY', 'TX', 'FL'][Math.floor(Math.random() * 4)]
    ),
    utilityRates: generateUtilityRateData(
      ['Pacific Gas & Electric', 'Southern California Edison', 'ConEdison', 'Duke Energy'][
        Math.floor(Math.random() * 4)
      ]
    )
  }));
}; 