import { API_CONFIG, handleApiError, checkRateLimit } from '../config/api';
import axios from 'axios';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Simple in-memory cache
const cache = new Map();

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Generate realistic mock data based on location
const generateMockProperties = (bounds, count = 20) => {
  const { north, south, east, west } = bounds;
  const latRange = north - south;
  const lngRange = east - west;

  // Property type distributions
  const propertyTypes = {
    'Single Family': 0.65,
    'Multi Family': 0.25,
    'Commercial': 0.10
  };

  // Realistic price ranges by property type
  const priceRanges = {
    'Single Family': { min: 300000, max: 800000 },
    'Multi Family': { min: 500000, max: 1200000 },
    'Commercial': { min: 800000, max: 2500000 }
  };

  // Realistic square footage ranges by property type
  const sqftRanges = {
    'Single Family': { min: 1200, max: 3500 },
    'Multi Family': { min: 2500, max: 6000 },
    'Commercial': { min: 5000, max: 15000 }
  };

  return Array.from({ length: count }, (_, i) => {
    // Generate property type based on distribution
    const rand = Math.random();
    let propertyType;
    let cumulative = 0;
    for (const [type, prob] of Object.entries(propertyTypes)) {
      cumulative += prob;
      if (rand <= cumulative) {
        propertyType = type;
        break;
      }
    }

    // Generate realistic values based on property type
    const priceRange = priceRanges[propertyType];
    const sqftRange = sqftRanges[propertyType];

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [west + Math.random() * lngRange, south + Math.random() * latRange],
          [west + Math.random() * lngRange, south + Math.random() * latRange],
          [west + Math.random() * lngRange, south + Math.random() * latRange],
          [west + Math.random() * lngRange, south + Math.random() * latRange],
          [west + Math.random() * lngRange, south + Math.random() * latRange]
        ]]
      },
      properties: {
        id: `PARCEL${i + 1}`,
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} ${['St', 'Ave', 'Rd', 'Dr'][Math.floor(Math.random() * 4)]}`,
        price: Math.floor(priceRange.min + Math.random() * (priceRange.max - priceRange.min)),
        yearBuilt: 1950 + Math.floor(Math.random() * 70),
        propertyType,
        sqft: Math.floor(sqftRange.min + Math.random() * (sqftRange.max - sqftRange.min)),
        lotSize: Math.round((0.1 + Math.random() * 0.9) * 100) / 100,
        roofType: ['Gable', 'Hip', 'Flat', 'Mansard'][Math.floor(Math.random() * 4)],
        stories: propertyType === 'Commercial' ? 
          Math.floor(2 + Math.random() * 4) : 
          Math.floor(1 + Math.random() * 2),
        solarPotential: {
          score: Math.round(Math.random() * 100),
          annualGeneration: Math.round(6000 + Math.random() * 4000),
          roofArea: Math.round(sqftRange.min * 0.7)
        }
      }
    };
  });
};

export const fetchProperties = async (bounds) => {
  const cacheKey = `properties-${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    // Check rate limits before making the request
    if (!checkRateLimit('regrid')) {
      throw new Error('Rate limit exceeded for Regrid API');
    }

    // Try Regrid API first
    if (API_CONFIG.regridBaseUrl && import.meta.env.VITE_REGRID_API_KEY) {
      const response = await axios.get(`${API_CONFIG.regridBaseUrl}/parcels`, {
        params: {
          token: import.meta.env.VITE_REGRID_API_KEY,
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
          limit: 100
        }
      });

      if (response.data && response.data.features) {
        // Transform Regrid data to our format
        const transformedData = {
          type: 'FeatureCollection',
          features: response.data.features.map(feature => ({
            ...feature,
            properties: {
              id: feature.properties.parcel_id,
              address: feature.properties.address,
              price: feature.properties.total_value,
              yearBuilt: feature.properties.year_built,
              propertyType: feature.properties.property_type,
              sqft: feature.properties.building_area,
              lotSize: feature.properties.land_area,
              roofType: feature.properties.roof_type,
              stories: feature.properties.stories,
              solarPotential: {
                score: feature.properties.solar_score,
                annualGeneration: feature.properties.solar_generation,
                roofArea: feature.properties.roof_area
              }
            }
          }))
        };

        // Update cache
        cache.set(cacheKey, {
          data: transformedData,
          timestamp: Date.now()
        });

        return transformedData;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch property data from Regrid API, falling back to mock data:', error);
    await handleApiError(error, 'Regrid Properties');
  }

  // Fall back to mock data
  const mockData = {
    type: 'FeatureCollection',
    features: generateMockProperties(bounds)
  };

  // Cache mock data too
  cache.set(cacheKey, {
    data: mockData,
    timestamp: Date.now()
  });

  return mockData;
};

export const getPropertyDetails = async (propertyId) => {
  try {
    if (!checkRateLimit('regrid')) {
      throw new Error('Rate limit exceeded for Regrid API');
    }

    if (API_CONFIG.regridBaseUrl && import.meta.env.VITE_REGRID_API_KEY) {
      const response = await axios.get(`${API_CONFIG.regridBaseUrl}/parcels/${propertyId}`, {
        params: {
          token: import.meta.env.VITE_REGRID_API_KEY
        }
      });

      if (response.data) {
        return response.data;
      }
    }
  } catch (error) {
    console.error('Error fetching property details:', error);
    await handleApiError(error, 'Property Details');
  }

  // Return mock details if API fails
  return {
    id: propertyId,
    details: {
      zoning: 'Residential',
      taxAssessment: Math.floor(200000 + Math.random() * 300000),
      lastSale: {
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        price: Math.floor(300000 + Math.random() * 500000)
      },
      utilities: {
        electric: 'National Grid',
        gas: 'Eversource',
        water: 'Municipal'
      },
      permits: Array.from({ length: Math.floor(Math.random() * 5) }, () => ({
        type: ['Building', 'Electrical', 'Plumbing', 'HVAC'][Math.floor(Math.random() * 4)],
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['Active', 'Completed', 'Expired'][Math.floor(Math.random() * 3)],
        description: 'Permit description here'
      }))
    }
  };
}; 