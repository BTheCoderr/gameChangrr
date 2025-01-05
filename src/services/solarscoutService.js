import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
const API_KEY = import.meta.env.VITE_API_KEY;

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = {
  moveIns: new Map(),
  neighborhoods: new Map(),
  solarInstallations: new Map()
};

// Helper function to get cache key
const getCacheKey = (bounds, filters = {}) => {
  return JSON.stringify({ bounds, filters });
};

// Helper function to check if cache is valid
const isCacheValid = (timestamp) => {
  return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
};

// Helper function to transform coordinates for Mapbox
const transformCoordinates = (data) => {
  if (!data || !data.features) return data;
  
  return {
    type: 'FeatureCollection',
    features: data.features.map(feature => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: feature.geometry.coordinates // Already in [lng, lat] format
      }
    }))
  };
};

// Fetch move-ins data
export const fetchMoveIns = async (bounds, filters = {}) => {
  try {
    const cacheKey = getCacheKey(bounds, filters);
    const cached = cache.moveIns.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    // If we're in development or API is not configured, return mock data
    if (!API_KEY || !API_URL || import.meta.env.DEV) {
      const mockData = generateMockMoveIns(bounds, filters);
      cache.moveIns.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      return mockData;
    }

    const response = await axios.get(`${API_URL}/api/property/move-ins`, {
      params: {
        bounds: bounds.join(','),
        propertyType: filters.propertyType,
        minPrice: filters.priceRange?.[0],
        maxPrice: filters.priceRange?.[1],
        minYear: filters.yearBuilt?.[0],
        maxYear: filters.yearBuilt?.[1],
        startDate: filters.dateRange?.[0],
        endDate: filters.dateRange?.[1]
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const transformedData = transformCoordinates(response.data);
    cache.moveIns.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now()
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching move-ins:', error);
    return generateMockMoveIns(bounds, filters);
  }
};

// Fetch neighborhood data
export const fetchNeighborhoods = async (bounds) => {
  try {
    const cacheKey = getCacheKey(bounds);
    const cached = cache.neighborhoods.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    if (!API_KEY || !API_URL || import.meta.env.DEV) {
      const mockData = generateMockNeighborhoods(bounds);
      cache.neighborhoods.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      return mockData;
    }

    const response = await axios.get(`${API_URL}/api/neighborhoods`, {
      params: { bounds: bounds.join(',') },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const transformedData = transformCoordinates(response.data);
    cache.neighborhoods.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now()
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return generateMockNeighborhoods(bounds);
  }
};

// Fetch solar installations data
export const fetchSolarInstallations = async (bounds, filters = {}) => {
  try {
    const cacheKey = getCacheKey(bounds, filters);
    const cached = cache.solarInstallations.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    if (!API_KEY || !API_URL || import.meta.env.DEV) {
      const mockData = generateMockSolarInstallations(bounds, filters);
      cache.solarInstallations.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      return mockData;
    }

    const response = await axios.get(`${API_URL}/api/solar-installations`, {
      params: {
        bounds: bounds.join(','),
        minCapacity: filters.capacityRange?.[0],
        maxCapacity: filters.capacityRange?.[1]
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const transformedData = transformCoordinates(response.data);
    cache.solarInstallations.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now()
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching solar installations:', error);
    return generateMockSolarInstallations(bounds, filters);
  }
};

// Mock data generators
const generateMockMoveIns = (bounds, filters) => {
  // Define specific points around Ruth Elizabeth Park
  const specificPoints = [
    { lng: -72.5855, lat: 42.1035, price: 350000, yearBuilt: 1950 },
    { lng: -72.5875, lat: 42.1025, price: 425000, yearBuilt: 1945 },
    { lng: -72.5845, lat: 42.1015, price: 380000, yearBuilt: 1960 }
  ];

  const features = specificPoints
    .filter(point => {
      if (filters.propertyType && filters.propertyType !== 'all') return false;
      if (point.price < filters.priceRange?.[0] || point.price > filters.priceRange?.[1]) return false;
      if (point.yearBuilt < filters.yearBuilt?.[0] || point.yearBuilt > filters.yearBuilt?.[1]) return false;
      return true;
    })
    .map((point, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      properties: {
        id: `move-in-${i}`,
        address: `${Math.floor(1 + Math.random() * 999)} Main St`,
        price: point.price,
        yearBuilt: point.yearBuilt,
        squareFeet: Math.floor(1000 + Math.random() * 3000),
        propertyType: 'Single Family'
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  };
};

const generateMockNeighborhoods = (bounds) => {
  const [west, south, east, north] = bounds;
  const features = [];
  const numPolygons = 10;

  for (let i = 0; i < numPolygons; i++) {
    const centerLng = west + (Math.random() * (east - west));
    const centerLat = south + (Math.random() * (north - south));
    const size = 0.01 + (Math.random() * 0.02);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [centerLng - size, centerLat - size],
          [centerLng + size, centerLat - size],
          [centerLng + size, centerLat + size],
          [centerLng - size, centerLat + size],
          [centerLng - size, centerLat - size]
        ]]
      },
      properties: {
        id: `neighborhood-${i}`,
        name: `Neighborhood ${i + 1}`,
        population: Math.floor(5000 + Math.random() * 15000),
        medianIncome: Math.floor(50000 + Math.random() * 100000)
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

const generateMockSolarInstallations = (bounds, filters) => {
  // Define specific solar installation points around Ruth Elizabeth Park
  const specificPoints = [
    { lng: -72.5865, lat: 42.1045, capacity: 8.5, installDate: '2023-12-15', systemType: 'Residential' },
    { lng: -72.5885, lat: 42.1035, capacity: 12.2, installDate: '2023-11-20', systemType: 'Commercial' },
    { lng: -72.5835, lat: 42.1025, capacity: 6.8, installDate: '2024-01-05', systemType: 'Residential' }
  ];

  const features = specificPoints
    .filter(point => {
      if (filters.capacityRange) {
        const [min, max] = filters.capacityRange;
        if (point.capacity < min || point.capacity > max) return false;
      }
      return true;
    })
    .map((point, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      properties: {
        id: `solar-${i}`,
        address: `${Math.floor(1 + Math.random() * 999)} Solar St`,
        capacity: point.capacity,
        installDate: point.installDate,
        systemType: point.systemType,
        hasBattery: Math.random() > 0.7,
        installer: ['Lumio', 'Titan Solar', 'SunPower'][Math.floor(Math.random() * 3)]
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  };
}; 