import { API_CONFIG, handleApiError } from '../config/api';
import axios from 'axios';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Simple in-memory cache
const cache = new Map();

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Mock solar installation data
const mockSolarData = {
  type: 'FeatureCollection',
  features: Array.from({ length: 50 }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      // Generate random coordinates in Massachusetts
      coordinates: [
        -72.5 + Math.random() * 2, // Longitude between -72.5 and -70.5
        42 + Math.random() * 1 // Latitude between 42 and 43
      ]
    },
    properties: {
      id: `PV${i + 1}`,
      systemSize: 5 + Math.random() * 10, // 5-15 kW
      cost: Math.round((15000 + Math.random() * 20000) * 100) / 100, // $15k-35k
      installationDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      annualGeneration: Math.round((6000 + Math.random() * 4000) * 100) / 100, // 6000-10000 kWh
      moduleType: Math.random() > 0.5 ? 'Standard' : 'Premium',
      arrayType: ['Fixed - Roof Mounted', 'Fixed - Ground Mounted', 'Single Axis', 'Dual Axis'][Math.floor(Math.random() * 4)],
      efficiency: Math.round((15 + Math.random() * 5) * 100) / 100 // 15-20%
    }
  }))
};

export const fetchOpenPVData = async (bounds) => {
  const cacheKey = `openpv-${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    // Try to fetch from NREL API if API key is available
    if (import.meta.env.VITE_NREL_API_KEY) {
      const response = await axios.get('https://developer.nrel.gov/api/solar/openpv/v3/installations', {
        params: {
          api_key: import.meta.env.VITE_NREL_API_KEY,
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
          format: 'json',
          limit: 100
        }
      });

      if (response.data && response.data.outputs) {
        const geojsonData = {
          type: 'FeatureCollection',
          features: response.data.outputs.map(installation => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [installation.longitude, installation.latitude]
            },
            properties: {
              id: installation.installation_id,
              systemSize: installation.size_kw,
              cost: installation.cost,
              installationDate: installation.install_date,
              annualGeneration: installation.annual_generation,
              moduleType: installation.module_type,
              arrayType: installation.array_type,
              efficiency: installation.efficiency
            }
          }))
        };

        // Update cache
        cache.set(cacheKey, {
          data: geojsonData,
          timestamp: Date.now()
        });

        return geojsonData;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch NREL OpenPV data:', error.message);
    handleApiError(error, 'NREL OpenPV');
  }

  // Fall back to mock data
  console.log('Using mock OpenPV data');
  return {
    ...mockSolarData,
    features: mockSolarData.features.filter(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return lng >= bounds.west && lng <= bounds.east && 
             lat >= bounds.south && lat <= bounds.north;
    })
  };
};

export const getSolarStats = async (bounds) => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/solar/stats`, {
      params: bounds
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching solar statistics:', error);
    handleApiError(error, 'Solar Statistics');
    
    // Return mock stats
    return {
      totalInstallations: 250,
      totalCapacity: 1875.5,
      averageSystemSize: 7.5,
      averageCost: 25000,
      monthlyInstallations: [
        { month: '2023-07', count: 18 },
        { month: '2023-08', count: 22 },
        { month: '2023-09', count: 25 },
        { month: '2023-10', count: 28 },
        { month: '2023-11', count: 30 },
        { month: '2023-12', count: 24 }
      ],
      systemTypes: {
        residential: 0.75,
        commercial: 0.20,
        utility: 0.05
      }
    };
  }
}; 