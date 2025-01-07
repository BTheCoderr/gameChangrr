import { API_CONFIG, handleApiError } from '../config/api';
import axios from 'axios';

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Simple in-memory cache
const cache = new Map();

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Mock property boundary data
const mockBoundaryData = {
  type: 'FeatureCollection',
  features: Array.from({ length: 20 }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-72.5 - 0.01 + Math.random() * 0.02, 42 - 0.01 + Math.random() * 0.02],
        [-72.5 - 0.01 + Math.random() * 0.02, 42 + 0.01 + Math.random() * 0.02],
        [-72.5 + 0.01 + Math.random() * 0.02, 42 + 0.01 + Math.random() * 0.02],
        [-72.5 + 0.01 + Math.random() * 0.02, 42 - 0.01 + Math.random() * 0.02],
        [-72.5 - 0.01 + Math.random() * 0.02, 42 - 0.01 + Math.random() * 0.02]
      ]]
    },
    properties: {
      id: `PARCEL${i + 1}`,
      address: `${Math.floor(Math.random() * 999) + 1} Main St`,
      price: Math.floor(200000 + Math.random() * 300000),
      yearBuilt: 1950 + Math.floor(Math.random() * 70),
      propertyType: ['Single Family', 'Multi Family', 'Commercial'][Math.floor(Math.random() * 3)],
      sqft: Math.floor(1500 + Math.random() * 3500)
    }
  }))
};

// Mock property data
const mockPropertyData = {
  type: 'FeatureCollection',
  features: Array.from({ length: 30 }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [
        -72.5 + Math.random() * 2, // Longitude between -72.5 and -70.5
        42 + Math.random() * 1 // Latitude between 42 and 43
      ]
    },
    properties: {
      id: `PROP${i + 1}`,
      address: `${Math.floor(Math.random() * 999) + 1} Main St`,
      city: 'Springfield',
      state: 'MA',
      zipCode: '01103',
      propertyType: ['Single Family', 'Multi Family', 'Commercial'][Math.floor(Math.random() * 3)],
      yearBuilt: 1950 + Math.floor(Math.random() * 70),
      squareFootage: Math.floor(1500 + Math.random() * 3500),
      roofArea: Math.floor(800 + Math.random() * 2000),
      roofType: ['Flat', 'Gabled', 'Hip'][Math.floor(Math.random() * 3)],
      roofMaterial: ['Asphalt Shingle', 'Metal', 'Slate'][Math.floor(Math.random() * 3)],
      roofAge: Math.floor(Math.random() * 20),
      solarPotential: {
        score: Math.random(),
        annualGeneration: Math.floor(6000 + Math.random() * 4000),
        systemSize: Math.floor(5 + Math.random() * 10),
        roofArea: Math.floor(800 + Math.random() * 2000)
      }
    }
  }))
};

export const fetchPropertyBoundaries = async (boundingBox, filters = {}) => {
  const cacheKey = `boundaries-${JSON.stringify(boundingBox)}-${JSON.stringify(filters)}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/properties/boundaries`, {
      params: {
        north: boundingBox.north || boundingBox._ne?.lat,
        south: boundingBox.south || boundingBox._sw?.lat,
        east: boundingBox.east || boundingBox._ne?.lng,
        west: boundingBox.west || boundingBox._sw?.lng,
        minPrice: filters.priceRange?.[0],
        maxPrice: filters.priceRange?.[1],
        minYear: filters.yearBuilt?.[0],
        maxYear: filters.yearBuilt?.[1],
        propertyType: filters.propertyType !== 'all' ? filters.propertyType : undefined
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
    console.warn('Failed to fetch property boundaries from API, falling back to mock data:', error);
    handleApiError(error, 'Property Boundaries');
  }

  // Fall back to mock data
  return {
    ...mockBoundaryData,
    features: mockBoundaryData.features.filter(feature => {
      const [lng, lat] = feature.geometry.coordinates[0][0];
      return lng >= (boundingBox.west || boundingBox._sw?.lng) && 
             lng <= (boundingBox.east || boundingBox._ne?.lng) && 
             lat >= (boundingBox.south || boundingBox._sw?.lat) && 
             lat <= (boundingBox.north || boundingBox._ne?.lat);
    })
  };
};

export const fetchProperties = async (bounds) => {
  const cacheKey = `properties-${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/properties`, {
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
    console.warn('Failed to fetch property data from API, falling back to mock data:', error);
    handleApiError(error, 'Properties');
  }

  // Fall back to mock data
  return {
    ...mockPropertyData,
    features: mockPropertyData.features.filter(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return lng >= bounds.west && lng <= bounds.east && 
             lat >= bounds.south && lat <= bounds.north;
    })
  };
};

export const getPropertyDetails = async (propertyId) => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/properties/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching property details:', error);
    handleApiError(error, 'Property Details');
    return null;
  }
};

export const getPropertyStats = async (bounds) => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/properties/stats`, {
      params: bounds
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching property statistics:', error);
    handleApiError(error, 'Property Statistics');
    
    // Return mock stats
    return {
      totalProperties: 350,
      averageSquareFootage: 2250,
      averageYearBuilt: 1985,
      propertyTypes: {
        singleFamily: 0.65,
        multiFamily: 0.25,
        commercial: 0.10
      },
      roofTypes: {
        flat: 0.20,
        gabled: 0.60,
        hip: 0.20
      },
      solarPotential: {
        high: 0.35,
        medium: 0.45,
        low: 0.20
      }
    };
  }
}; 