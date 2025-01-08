import { api } from '../utils/apiUtils';
import { validateApiRequest } from '../utils/validationUtils';
import { cacheManager } from '../utils/cacheUtils';

const CACHE_KEY = 'leadScores';

// Lead scoring criteria weights
const SCORING_WEIGHTS = {
  energyUsage: 0.25,
  propertyValue: 0.15,
  roofCondition: 0.20,
  shading: 0.15,
  creditScore: 0.15,
  ownershipStatus: 0.10
};

// Validation schema for lead scoring request
const leadScoringSchema = {
  type: 'object',
  required: ['energyUsage', 'propertyValue', 'roofCondition', 'shading'],
  properties: {
    energyUsage: {
      type: 'number',
      minimum: 0,
      description: 'Monthly energy usage in kWh'
    },
    propertyValue: {
      type: 'number',
      minimum: 0,
      description: 'Property value in USD'
    },
    roofCondition: {
      type: 'string',
      enum: ['excellent', 'good', 'fair', 'poor'],
      description: 'Condition of the roof'
    },
    shading: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Percentage of roof shading'
    },
    creditScore: {
      type: 'number',
      minimum: 300,
      maximum: 850,
      description: 'Credit score if available'
    },
    ownershipStatus: {
      type: 'string',
      enum: ['owned', 'mortgaged', 'rented'],
      description: 'Property ownership status'
    }
  }
};

// Quick lead scoring schema for simplified assessment
const quickLeadScoringSchema = {
  type: 'object',
  required: ['propertySize', 'income', 'monthlyBill'],
  properties: {
    propertySize: {
      type: 'number',
      minimum: 500,
      description: 'Property size in square feet'
    },
    income: {
      type: 'number',
      minimum: 10000,
      description: 'Annual household income'
    },
    monthlyBill: {
      type: 'number',
      minimum: 10,
      description: 'Monthly electricity bill'
    }
  }
};

// Calculate lead score based on provided criteria
export const calculateLeadScore = async (leadData) => {
  try {
    // Validate input data
    await validateApiRequest(leadData, leadScoringSchema);

    // Normalize and score each criterion
    const scores = {
      energyUsage: normalizeEnergyUsage(leadData.energyUsage),
      propertyValue: normalizePropertyValue(leadData.propertyValue),
      roofCondition: normalizeRoofCondition(leadData.roofCondition),
      shading: normalizeShading(leadData.shading),
      creditScore: normalizeCreditScore(leadData.creditScore),
      ownershipStatus: normalizeOwnershipStatus(leadData.ownershipStatus)
    };

    // Calculate weighted score
    const weightedScore = Object.entries(scores).reduce((total, [criterion, score]) => {
      return total + (score * SCORING_WEIGHTS[criterion]);
    }, 0);

    // Convert to 0-100 scale
    const finalScore = Math.round(weightedScore * 100);

    return {
      score: finalScore,
      category: getLeadCategory(finalScore),
      breakdown: calculateScoreBreakdown(scores),
      recommendations: generateRecommendations(scores)
    };
  } catch (error) {
    console.error('Error calculating lead score:', error);
    throw error;
  }
};

// Normalization functions (0-1 scale)
const normalizeEnergyUsage = (usage) => {
  const minUsage = 250; // kWh/month
  const optimalUsage = 1000; // kWh/month
  if (usage <= minUsage) return 0.3;
  if (usage >= optimalUsage) return 1.0;
  return 0.3 + (0.7 * (usage - minUsage) / (optimalUsage - minUsage));
};

const normalizePropertyValue = (value) => {
  const minValue = 100000;
  const optimalValue = 500000;
  if (value <= minValue) return 0.3;
  if (value >= optimalValue) return 1.0;
  return 0.3 + (0.7 * (value - minValue) / (optimalValue - minValue));
};

const normalizeRoofCondition = (condition) => {
  const scores = {
    excellent: 1.0,
    good: 0.8,
    fair: 0.5,
    poor: 0.2
  };
  return scores[condition] || 0;
};

const normalizeShading = (shading) => {
  return Math.max(0, 1 - (shading / 100));
};

const normalizeCreditScore = (score) => {
  if (!score) return 0.5; // Default if not provided
  const minScore = 580;
  const optimalScore = 720;
  if (score <= minScore) return 0.3;
  if (score >= optimalScore) return 1.0;
  return 0.3 + (0.7 * (score - minScore) / (optimalScore - minScore));
};

const normalizeOwnershipStatus = (status) => {
  const scores = {
    owned: 1.0,
    mortgaged: 0.8,
    rented: 0.2
  };
  return scores[status] || 0;
};

// Helper functions
const getLeadCategory = (score) => {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  return 'cold';
};

const calculateScoreBreakdown = (scores) => {
  return Object.entries(scores).map(([criterion, score]) => ({
    criterion,
    score: Math.round(score * 100),
    weight: SCORING_WEIGHTS[criterion],
    weightedScore: Math.round(score * SCORING_WEIGHTS[criterion] * 100)
  }));
};

const generateRecommendations = (scores) => {
  const recommendations = [];

  if (scores.energyUsage < 0.6) {
    recommendations.push({
      category: 'energyUsage',
      message: 'Energy usage is below optimal range for solar. Consider energy audit.',
      priority: 'medium'
    });
  }

  if (scores.roofCondition < 0.7) {
    recommendations.push({
      category: 'roofCondition',
      message: 'Roof may need repairs or upgrades before solar installation.',
      priority: 'high'
    });
  }

  if (scores.shading < 0.6) {
    recommendations.push({
      category: 'shading',
      message: 'High shading may impact solar production. Tree trimming recommended.',
      priority: 'high'
    });
  }

  if (scores.creditScore < 0.7) {
    recommendations.push({
      category: 'financing',
      message: 'Consider alternative financing options or credit improvement.',
      priority: 'medium'
    });
  }

  return recommendations;
};

// Batch process multiple leads
export const batchProcessLeads = async (leads) => {
  try {
    const results = await Promise.all(
      leads.map(async (lead) => {
        try {
          return await calculateLeadScore(lead);
        } catch (error) {
          return {
            error: true,
            leadId: lead.id,
            message: error.message
          };
        }
      })
    );

    return {
      successful: results.filter(result => !result.error),
      failed: results.filter(result => result.error)
    };
  } catch (error) {
    console.error('Error in batch processing leads:', error);
    throw error;
  }
};

// Quick lead scoring for initial assessment
export const quickLeadScore = async (data) => {
  try {
    // Validate input data
    await validateApiRequest(data, quickLeadScoringSchema);

    // Calculate base score
    const propertySizeScore = Math.min(100, (data.propertySize / 50));
    const incomeScore = Math.min(100, (data.income / 1000));
    const billScore = Math.min(100, (data.monthlyBill / 2));

    // Weighted calculation
    const leadScore = Math.round(
      (propertySizeScore * 0.3) +
      (incomeScore * 0.4) +
      (billScore * 0.3)
    );

    // Get priority level
    const priority = getLeadCategory(leadScore);

    // Check cache for similar leads
    const cacheKey = `${data.propertySize}-${data.income}-${data.monthlyBill}`;
    const cachedResult = cacheManager.get('leadScores', cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = {
      leadScore,
      priority,
      estimatedSavings: calculateEstimatedSavings(data.monthlyBill),
      potentialSystemSize: calculatePotentialSystemSize(data.propertySize),
      nextSteps: generateQuickRecommendations(leadScore, data)
    };

    // Cache the result
    cacheManager.set('leadScores', cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in quick lead scoring:', error);
    throw error;
  }
};

// Helper functions for quick scoring
const calculateEstimatedSavings = (monthlyBill) => {
  // Assume 60% savings on average
  const annualBill = monthlyBill * 12;
  return Math.round(annualBill * 0.6);
};

const calculatePotentialSystemSize = (propertySize) => {
  // Rough estimate: 1kW per 100 sq ft of usable roof space
  // Assume 30% of property size is usable roof space
  const usableRoofSpace = propertySize * 0.3;
  return Number((usableRoofSpace / 100).toFixed(1));
};

const generateQuickRecommendations = (score, data) => {
  const recommendations = [];

  if (score >= 80) {
    recommendations.push({
      type: 'action',
      message: 'Schedule immediate consultation',
      priority: 'high'
    });
  }

  if (data.monthlyBill > 150) {
    recommendations.push({
      type: 'savings',
      message: 'High utility bills indicate strong solar potential',
      priority: 'high'
    });
  }

  if (data.propertySize > 2000) {
    recommendations.push({
      type: 'system',
      message: 'Large property suitable for optimal system size',
      priority: 'medium'
    });
  }

  return recommendations;
}; 