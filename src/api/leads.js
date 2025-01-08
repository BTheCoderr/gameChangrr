import express from 'express';
import { calculateLeadScore, calculateProjectedSavings } from '../services/leadScoring';
import { getUtilityRate } from '../services/utilityRates';
import { calculateSolarPotential } from '../services/solarPotential';

const router = express.Router();

/**
 * Calculate lead score and analysis
 * POST /api/leads/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { property } = req.body;
    const analysis = await calculateLeadScore(property);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing lead:', error);
    res.status(500).json({ error: 'Failed to analyze lead' });
  }
});

/**
 * Calculate savings projection
 * POST /api/leads/savings-projection
 */
router.post('/savings-projection', async (req, res) => {
  try {
    const { property, systemSize, incentives = {} } = req.body;

    // Get utility rate and solar potential
    const [utilityRate, solarPotential] = await Promise.all([
      getUtilityRate(property.location),
      systemSize ? Promise.resolve(systemSize * 5) : calculateSolarPotential(property)
    ]);

    // Calculate savings projection
    const projection = calculateProjectedSavings(solarPotential, utilityRate);

    // Apply additional incentives
    const totalIncentives = Object.values(incentives).reduce((sum, value) => sum + value, 0);
    const netCost = projection.netCost - totalIncentives;
    const paybackPeriod = netCost / projection.annualSavings;
    const roi = (projection.annualSavings / netCost) * 100;

    res.json({
      ...projection,
      additionalIncentives: totalIncentives,
      netCost,
      paybackPeriod,
      roi
    });
  } catch (error) {
    console.error('Error calculating savings projection:', error);
    res.status(500).json({ error: 'Failed to calculate savings projection' });
  }
});

/**
 * Get high-priority leads in an area
 * GET /api/leads/high-priority
 */
router.get('/high-priority', async (req, res) => {
  try {
    const { bounds } = req.query;
    const { north, south, east, west } = JSON.parse(bounds);

    // Get properties in the area
    const properties = await getPropertiesInBounds(north, south, east, west);

    // Calculate scores for all properties
    const leads = await Promise.all(
      properties.map(async (property) => {
        const analysis = await calculateLeadScore(property);
        return {
          ...property,
          ...analysis
        };
      })
    );

    // Filter and sort high-priority leads
    const highPriorityLeads = leads
      .filter(lead => lead.priority === 'high')
      .sort((a, b) => b.score - a.score);

    res.json(highPriorityLeads);
  } catch (error) {
    console.error('Error getting high-priority leads:', error);
    res.status(500).json({ error: 'Failed to get high-priority leads' });
  }
});

/**
 * Generate lead report
 * POST /api/leads/report
 */
router.post('/report', async (req, res) => {
  try {
    const { property } = req.body;
    
    // Get all necessary data
    const [analysis, utilityData, solarData] = await Promise.all([
      calculateLeadScore(property),
      getUtilityData(property.location),
      getSolarData(property)
    ]);

    // Generate report
    const report = {
      property,
      analysis,
      utilityData,
      solarData,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(analysis, utilityData, solarData)
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating lead report:', error);
    res.status(500).json({ error: 'Failed to generate lead report' });
  }
});

// Helper functions
const getPropertiesInBounds = async (north, south, east, west) => {
  // Implementation depends on your data source
  // This is a placeholder
  return [];
};

const getUtilityData = async (location) => {
  // Implementation depends on your data source
  // This is a placeholder
  return {};
};

const getSolarData = async (property) => {
  // Implementation depends on your data source
  // This is a placeholder
  return {};
};

const generateRecommendations = (analysis, utilityData, solarData) => {
  const recommendations = [];

  // Add recommendations based on analysis
  if (analysis.score >= 80) {
    recommendations.push({
      type: 'high_priority',
      message: 'High-priority lead - immediate follow-up recommended',
      action: 'schedule_call'
    });
  }

  // Add recommendations based on utility data
  if (utilityData.rate > 0.15) {
    recommendations.push({
      type: 'high_utility',
      message: 'High utility rates - emphasize cost savings',
      action: 'show_savings'
    });
  }

  // Add recommendations based on solar data
  if (solarData.roofSpace > 1000) {
    recommendations.push({
      type: 'large_system',
      message: 'Large roof space available - consider commercial system',
      action: 'commercial_proposal'
    });
  }

  return recommendations;
};

export default router; 