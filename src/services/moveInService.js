import axios from 'axios';

// Use import.meta.env for Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';
const API_KEY = import.meta.env.VITE_API_KEY;

let moveInsCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FETCH_INTERVAL = 30 * 1000; // 30 seconds

// Fallback data for development
const FALLBACK_DATA = [
  {
    id: 1,
    position: [42.1015, -72.5898],
    properties: {
      address: '123 Main St, Springfield, MA',
      zipCode: '01103',
      propertyType: 'Single Family',
      ownerInfo: 'John Doe',
      equity: '$250,000',
      income: '$75,000',
      squareFeet: '2,000',
      purchaseDate: '2023-12-01',
      yearBuilt: '1985',
      previousAddress: '456 Oak St, Boston, MA',
      owners: ['John Doe', 'Jane Doe']
    }
  },
  // Add more fallback data points as needed
];

// Update feature coordinates for Mapbox
const transformFeature = (feature) => ({
  ...feature,
  geometry: {
    ...feature.geometry,
    coordinates: feature.geometry.coordinates // Mapbox uses [lng, lat]
  }
});

export const fetchMoveIns = async (bounds) => {
  try {
    // Check cache first
    if (moveInsCache && cacheExpiry && Date.now() < cacheExpiry) {
      console.log('Returning cached move-ins data...');
      return moveInsCache;
    }

    // If we're in development or API is not configured, return fallback data
    if (!API_KEY || !API_URL || import.meta.env.DEV) {
      console.log('Using fallback move-ins data');
      moveInsCache = FALLBACK_DATA;
      cacheExpiry = Date.now() + CACHE_DURATION;
      return FALLBACK_DATA;
    }

    // Fetch from the actual API
    const response = await axios.get(`${API_URL}/move-ins`, {
      params: {
        bounds,
        city: 'Springfield',
        state: 'MA',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      headers: API_KEY ? {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      } : undefined
    });

    if (!response.data || !response.data.features) {
      console.warn('Invalid response format from API, using fallback data');
      return FALLBACK_DATA;
    }

    // Transform data to match expected format
    const moveIns = response.data.features.map(feature => ({
      id: feature.id,
      position: feature.geometry.coordinates.reverse(), // Leaflet uses [lat, lng]
      properties: {
        address: feature.properties.address,
        zipCode: feature.properties.zipCode,
        propertyType: feature.properties.propertyType,
        ownerInfo: feature.properties.ownerInfo,
        equity: feature.properties.equity,
        income: feature.properties.income,
        squareFeet: feature.properties.squareFeet,
        purchaseDate: feature.properties.purchaseDate,
        yearBuilt: feature.properties.yearBuilt,
        previousAddress: feature.properties.previousAddress,
        owners: feature.properties.owners
      }
    }));

    // Update cache
    moveInsCache = moveIns;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return moveIns;
  } catch (error) {
    console.error('Error fetching move-ins:', error);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    console.log('Falling back to mock data due to error');
    return FALLBACK_DATA;
  }
};

export const startPeriodicFetch = (onUpdate) => {
  if (typeof onUpdate !== 'function') {
    console.error('onUpdate must be a function');
    return () => {}; // Return empty cleanup function
  }

  let intervalId;

  const fetchAndUpdate = async () => {
    try {
      console.log('Fetching move-ins data...');
      const bounds = '42.0751,-72.6245,42.1418,-72.4887'; // Springfield bounds
      const data = await fetchMoveIns(bounds);
      if (data && Array.isArray(data)) {
        onUpdate(data);
      } else {
        console.warn('Invalid data format received:', data);
      }
    } catch (error) {
      console.error('Error in periodic fetch:', error);
    }
  };

  // Fetch immediately and then start interval
  fetchAndUpdate();
  intervalId = setInterval(fetchAndUpdate, FETCH_INTERVAL);

  // Return cleanup function
  return () => {
    console.log('Cleaning up periodic fetch');
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

export const clearMoveInsCache = () => {
  moveInsCache = null;
  cacheExpiry = null;
}; 