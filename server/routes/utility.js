import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { mockUtilityBoundaries } from '../data/mockUtilityData.js';

dotenv.config();

const router = express.Router();

// Utility company API configuration
const UTILITY_API_KEY = process.env.UTILITY_API_KEY;
const UTILITY_API_URL = process.env.UTILITY_API_URL;

// Helper function to check if a point is within bounds
const isWithinBounds = (point, bounds) => {
  const [lng, lat] = point;
  const [west, south, east, north] = bounds.split(',').map(Number);
  return lng >= west && lng <= east && lat >= south && lat <= north;
};

// Get utility boundaries within a bounding box
router.get('/boundaries', async (req, res) => {
  try {
    const { bounds, zoom } = req.query;

    if (!bounds) {
      return res.status(400).json({ error: 'Bounds parameter is required' });
    }

    // If we have a valid API key and URL, try to fetch real data
    if (UTILITY_API_KEY && UTILITY_API_KEY !== 'your_utility_api_key_here' && UTILITY_API_URL) {
      try {
        const response = await axios.get(`${UTILITY_API_URL}/utility-service-territories`, {
          params: {
            api_key: UTILITY_API_KEY,
            bounds,
            zoom
          }
        });

        return res.json(response.data);
      } catch (apiError) {
        console.warn('Failed to fetch from API, falling back to mock data:', apiError.message);
      }
    }

    // Filter mock data based on bounds
    const [west, south, east, north] = bounds.split(',').map(Number);
    const filteredFeatures = mockUtilityBoundaries.features.filter(feature => {
      // Check if any point of the polygon is within bounds
      return feature.geometry.coordinates[0].some(point => 
        isWithinBounds(point, bounds)
      );
    });

    res.json({
      type: 'FeatureCollection',
      features: filteredFeatures
    });
  } catch (error) {
    console.error('Error in utility boundaries endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch utility boundaries',
      details: error.message 
    });
  }
});

// Get utility rates for a specific area
router.get('/rates', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Find the utility that contains this point
    const utility = mockUtilityBoundaries.features.find(feature => {
      // Simple point-in-polygon check (this is a simplified version)
      const bounds = feature.geometry.coordinates[0];
      const [minLng, minLat] = bounds.reduce((min, point) => [
        Math.min(min[0], point[0]),
        Math.min(min[1], point[1])
      ]);
      const [maxLng, maxLat] = bounds.reduce((max, point) => [
        Math.max(max[0], point[0]),
        Math.max(max[1], point[1])
      ]);

      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    });

    if (!utility) {
      return res.status(404).json({ error: 'No utility found for this location' });
    }

    res.json({
      utilityName: utility.properties.utilityName,
      rateType: utility.properties.rateType,
      solarRate: utility.properties.solarRate,
      avgBill: utility.properties.avgBill
    });
  } catch (error) {
    console.error('Error fetching utility rates:', error);
    res.status(500).json({ error: 'Failed to fetch utility rates' });
  }
});

// Get solar programs for a utility
router.get('/solar-programs', async (req, res) => {
  try {
    const { utilityName } = req.query;

    if (!utilityName) {
      return res.status(400).json({ error: 'Utility name is required' });
    }

    const utility = mockUtilityBoundaries.features.find(
      feature => feature.properties.utilityName === utilityName
    );

    if (!utility) {
      return res.status(404).json({ error: 'Utility not found' });
    }

    res.json({
      utilityName: utility.properties.utilityName,
      hasSolarProgram: utility.properties.hasSolarProgram,
      solarRate: utility.properties.solarRate,
      solarAdoption: utility.properties.solarAdoption
    });
  } catch (error) {
    console.error('Error fetching solar programs:', error);
    res.status(500).json({ error: 'Failed to fetch solar programs' });
  }
});

export const utilityRouter = router; 