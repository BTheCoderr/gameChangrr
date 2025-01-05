// API Configuration
export const API_CONFIG = {
  census: {
    baseUrl: 'https://api.census.gov/data',
    token: import.meta.env.VITE_CENSUS_API_KEY
  },
  nrel: {
    baseUrl: 'https://developer.nrel.gov/api/pvwatts/v6',
    token: import.meta.env.VITE_NREL_API_KEY
  },
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    token: import.meta.env.VITE_OPENWEATHER_API_KEY
  },
  regrid: {
    baseUrl: 'https://app.regrid.com/api/v1',
    token: import.meta.env.VITE_REGRID_API_KEY
  }
};

// Cache durations in milliseconds
export const CACHE_CONFIG = {
  censusData: {
    duration: 24 * 60 * 60 * 1000 // 24 hours
  },
  weatherData: {
    duration: 30 * 60 * 1000 // 30 minutes
  },
  solarData: {
    duration: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  propertyData: {
    duration: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// API Headers
export const getHeaders = (service) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  switch (service) {
    case 'census':
      headers['X-Census-Key'] = API_CONFIG.census.token;
      break;
    case 'nrel':
      headers['X-Api-Key'] = API_CONFIG.nrel.token;
      break;
    case 'openWeather':
      headers['X-Api-Key'] = API_CONFIG.openWeather.token;
      break;
    case 'regrid':
      headers['Authorization'] = `Bearer ${API_CONFIG.regrid.token}`;
      break;
    default:
      break;
  }

  return headers;
};

// Error handling
export const handleApiError = (error, service) => {
  console.error(`${service} API Error:`, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data
  });
}; 