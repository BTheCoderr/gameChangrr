import { API_CONFIG, handleApiError } from '../config/api';
import axios from 'axios';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Simple in-memory cache
const cache = new Map();

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to handle API requests with caching
const fetchWithCache = async (endpoint, params, mockData, cacheKey) => {
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}${endpoint}`, { params });

    if (response.data) {
      // Update cache
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      return response.data;
    }
  } catch (error) {
    console.warn(`Failed to fetch data from ${endpoint}, falling back to mock data:`, error);
    handleApiError(error, endpoint);
  }

  // Fall back to mock data
  return mockData;
};

// Mock data for utility boundaries
const mockUtilityData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.6, 42.0],
          [-72.6, 42.2],
          [-72.4, 42.2],
          [-72.4, 42.0],
          [-72.6, 42.0]
        ]]
      },
      properties: {
        utilityId: 'MECO',
        utilityName: 'Massachusetts Electric Co',
        serviceArea: 'Western Massachusetts',
        solarRate: 0.12,
        netMeteringCap: 0.8,
        solarInstallations: 1250
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-71.2, 42.2],
          [-71.2, 42.4],
          [-71.0, 42.4],
          [-71.0, 42.2],
          [-71.2, 42.2]
        ]]
      },
      properties: {
        utilityId: 'NSTAR',
        utilityName: 'NSTAR Electric Company',
        serviceArea: 'Eastern Massachusetts',
        solarRate: 0.11,
        netMeteringCap: 0.9,
        solarInstallations: 2800
      }
    }
  ]
};

// Export unified data fetching functions
export const fetchMapData = {
  // Fetch utility boundaries
  utilityBoundaries: async (bounds) => {
    const cacheKey = `utility-boundaries-${JSON.stringify(bounds)}`;
    return fetchWithCache(
      '/utilities/boundaries',
      bounds,
      {
        ...mockUtilityData,
        features: mockUtilityData.features.filter(feature => {
          const coords = feature.geometry.coordinates[0];
          return coords.some(([lng, lat]) => 
            lng >= bounds.west && lng <= bounds.east &&
            lat >= bounds.south && lat <= bounds.north
          );
        })
      },
      cacheKey
    );
  },

  // Fetch utility statistics
  utilityStats: async (utilityId) => {
    const cacheKey = `utility-stats-${utilityId}`;
    return fetchWithCache(
      `/utilities/${utilityId}/stats`,
      {},
      {
        totalCustomers: 125000,
        solarCustomers: 3500,
        averageSolarRate: 0.115,
        totalSolarCapacity: 45.5,
        monthlyInstallations: [
          { month: '2023-07', count: 85 },
          { month: '2023-08', count: 92 },
          { month: '2023-09', count: 78 },
          { month: '2023-10', count: 65 },
          { month: '2023-11', count: 55 },
          { month: '2023-12', count: 48 }
        ]
      },
      cacheKey
    );
  },

  // Re-export property functions with consistent interface
  properties: {
    boundaries: fetchPropertyBoundaries,
    details: getPropertyDetails,
    stats: getPropertyStats
  },

  // Re-export solar permit functions
  solarPermits: {
    fetch: fetchSolarPermits,
    stats: getSolarStats
  },

  // Re-export solar potential functions
  solarPotential: {
    fetch: fetchSolarPotential,
    stats: getSolarPotentialStats
  }
};

// Helper function to format GeoJSON response
export const formatGeoJSON = (data, type) => {
  if (!data || !data.features) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return {
    type: 'FeatureCollection',
    features: data.features.map(feature => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        ...feature.properties,
        layerType: type // Add layer type for consistent styling
      }
    }))
  };
};

// Helper function to validate bounds
export const validateBounds = (bounds) => {
  const defaultBounds = {
    north: 42.5,
    south: 41.5,
    east: -70.5,
    west: -73.5
  };

  if (!bounds) return defaultBounds;

  return {
    north: bounds.north || bounds._ne?.lat || defaultBounds.north,
    south: bounds.south || bounds._sw?.lat || defaultBounds.south,
    east: bounds.east || bounds._ne?.lng || defaultBounds.east,
    west: bounds.west || bounds._sw?.lng || defaultBounds.west
  };
}; 