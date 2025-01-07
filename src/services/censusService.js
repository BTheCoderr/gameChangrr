import { API_CONFIG, handleApiError } from '../config/api';
import axios from 'axios';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Simple in-memory cache
const cache = new Map();

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Mock demographic data for fallback
const mockDemographicData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.5898, 42.1015],
          [-72.5878, 42.1015],
          [-72.5878, 42.1035],
          [-72.5898, 42.1035],
          [-72.5898, 42.1015]
        ]]
      },
      properties: {
        tract: '8011.01',
        medianIncome: 75000,
        totalPopulation: 4500,
        medianAge: 35,
        educationBachelorsOrHigher: 1800
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.5878, 42.1015],
          [-72.5858, 42.1015],
          [-72.5858, 42.1035],
          [-72.5878, 42.1035],
          [-72.5878, 42.1015]
        ]]
      },
      properties: {
        tract: '8011.02',
        medianIncome: 85000,
        totalPopulation: 5200,
        medianAge: 38,
        educationBachelorsOrHigher: 2300
      }
    }
  ]
};

export const fetchDemographicData = async (bounds) => {
  const cacheKey = `demographics-${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/demographics`, {
      params: {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west
      }
    });

    if (response.data) {
      // Update cache
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      return response.data;
    }
  } catch (error) {
    console.warn('Failed to fetch demographic data from API, falling back to mock data:', error);
    handleApiError(error, 'Demographics');
  }

  // Fall back to mock data
  return mockDemographicData;
};

export const getDemographicStats = async (bounds) => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/demographics/stats`, {
      params: bounds
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching demographic statistics:', error);
    handleApiError(error, 'Demographic Statistics');
    
    // Return mock stats
    return {
      totalPopulation: 125000,
      medianIncome: 82500,
      medianAge: 36,
      educationStats: {
        highSchool: 0.92,
        bachelors: 0.45,
        graduate: 0.18
      },
      incomeDistribution: [
        { range: '0-25k', percentage: 0.12 },
        { range: '25k-50k', percentage: 0.23 },
        { range: '50k-75k', percentage: 0.28 },
        { range: '75k-100k', percentage: 0.20 },
        { range: '100k+', percentage: 0.17 }
      ]
    };
  }
}; 