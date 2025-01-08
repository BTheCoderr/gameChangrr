import { calculateSolarPotential } from './solarPotential';
import { getUtilityRate } from './utilityRates';

// Weights for different scoring factors
const SCORING_WEIGHTS = {
  energyStar: 0.25,
  solarPotential: 0.25,
  utilityRate: 0.2,
  propertyValue: 0.15,
  ownershipStatus: 0.15
};

// Thresholds for lead priority
export const LEAD_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Score ranges for priority levels
const PRIORITY_RANGES = {
  HIGH: { min: 80, max: 100 },
  MEDIUM: { min: 50, max: 79 },
  LOW: { min: 0, max: 49 }
};

/**
 * Calculate lead score based on various factors
 * @param {Object} property - Property data
 * @returns {Object} Score and priority level
 */
export const calculateLeadScore = async (property) => {
  try {
    // Get solar potential and utility rate
    const solarPotential = await calculateSolarPotential(property);
    const utilityRate = await getUtilityRate(property.location);

    // Calculate individual scores (0-100)
    const scores = {
      energyStar: normalizeScore(property.energyStarScore, 0, 100),
      solarPotential: normalizeScore(solarPotential, 0, 100),
      utilityRate: normalizeScore(utilityRate, 0.1, 0.5) * 100,
      propertyValue: calculatePropertyValueScore(property.value),
      ownershipStatus: property.ownerOccupied ? 100 : 50
    };

    // Calculate weighted total score
    const totalScore = Object.entries(scores).reduce((total, [factor, score]) => {
      return total + (score * SCORING_WEIGHTS[factor]);
    }, 0);

    // Determine priority level
    const priority = determinePriority(totalScore);

    return {
      score: Math.round(totalScore),
      priority,
      factors: scores,
      projectedSavings: calculateProjectedSavings(solarPotential, utilityRate)
    };
  } catch (error) {
    console.error('Error calculating lead score:', error);
    return {
      score: 0,
      priority: LEAD_PRIORITY.LOW,
      factors: {},
      projectedSavings: null
    };
  }
};

/**
 * Calculate projected savings based on solar potential and utility rate
 * @param {number} solarPotential - Solar potential in kWh/year
 * @param {number} utilityRate - Utility rate in $/kWh
 * @returns {Object} Projected savings data
 */
export const calculateProjectedSavings = (solarPotential, utilityRate) => {
  const annualProduction = solarPotential * 365; // kWh/year
  const annualSavings = annualProduction * utilityRate;
  const systemSize = solarPotential / 5; // Rough estimate: 5 kWh/kW/day
  const installationCost = systemSize * 3000; // Rough estimate: $3000/kW
  const federalIncentive = installationCost * 0.30; // 30% federal tax credit
  const netCost = installationCost - federalIncentive;
  const paybackPeriod = netCost / annualSavings;

  return {
    annualProduction,
    annualSavings,
    systemSize,
    installationCost,
    federalIncentive,
    netCost,
    paybackPeriod,
    roi: (annualSavings / netCost) * 100
  };
};

/**
 * Normalize a score to a 0-100 range
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @returns {number} Normalized score
 */
const normalizeScore = (value, min, max) => {
  if (value < min) return 0;
  if (value > max) return 100;
  return ((value - min) / (max - min)) * 100;
};

/**
 * Calculate property value score
 * @param {number} value - Property value
 * @returns {number} Score
 */
const calculatePropertyValueScore = (value) => {
  if (value < 200000) return 50;
  if (value < 500000) return 75;
  if (value < 1000000) return 90;
  return 100;
};

/**
 * Determine priority level based on total score
 * @param {number} score - Total score
 * @returns {string} Priority level
 */
const determinePriority = (score) => {
  if (score >= PRIORITY_RANGES.HIGH.min) return LEAD_PRIORITY.HIGH;
  if (score >= PRIORITY_RANGES.MEDIUM.min) return LEAD_PRIORITY.MEDIUM;
  return LEAD_PRIORITY.LOW;
};

/**
 * Get marker style based on lead priority
 * @param {string} priority - Priority level
 * @returns {Object} Marker style object
 */
export const getLeadMarkerStyle = (priority) => {
  switch (priority) {
    case LEAD_PRIORITY.HIGH:
      return {
        color: '#4CAF50',
        size: 1.2,
        border: '#388E3C'
      };
    case LEAD_PRIORITY.MEDIUM:
      return {
        color: '#FFC107',
        size: 1,
        border: '#FFA000'
      };
    case LEAD_PRIORITY.LOW:
      return {
        color: '#9E9E9E',
        size: 0.8,
        border: '#757575'
      };
    default:
      return {
        color: '#9E9E9E',
        size: 0.8,
        border: '#757575'
      };
  }
}; 