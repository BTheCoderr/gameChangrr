// API configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  nrelBaseUrl: 'https://developer.nrel.gov/api',
  energyStarBaseUrl: import.meta.env.VITE_ENERGYSTAR_API_URL || 'https://api.test.energystar.gov',
  regridBaseUrl: import.meta.env.VITE_REGRID_API_URL,
  openWeatherBaseUrl: 'https://api.openweathermap.org/data/3.0',
  GAMECHANGRR_API: import.meta.env.VITE_GAMECHANGRR_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retryAttempts: 3,
  rateLimits: {
    nrel: { requests: 1000, period: 'day' },
    energyStar: { requests: 100, period: 'hour' },
    regrid: { requests: 50, period: 'minute' },
    openWeather: { requests: 60, period: 'minute' }
  },
  endpoints: {
    MASSGIS: 'https://gis-prod.digital.mass.gov/geoserver/wfs',
    ARCGIS: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Electric_Retail_Service_Territories/FeatureServer/0/query'
  },
  cache: {
    duration: 24 * 60 * 60 * 1000, // 24 hours
    enabled: true
  }
};

// Rate limiting state
const rateLimitState = new Map();

// Validate API keys
export const validateApiKeys = () => {
  const requiredKeys = {
    NREL: import.meta.env.VITE_NREL_API_KEY,
    REGRID: import.meta.env.VITE_REGRID_API_KEY,
    OPENWEATHER: import.meta.env.VITE_OPENWEATHER_API_KEY
  };

  const missingKeys = Object.entries(requiredKeys)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.warn(`Missing API keys for: ${missingKeys.join(', ')}`);
    return false;
  }

  return true;
};

// Check rate limits
export const checkRateLimit = (service) => {
  const limit = API_CONFIG.rateLimits[service];
  if (!limit) return true;

  const now = Date.now();
  const state = rateLimitState.get(service) || { requests: [], reset: now };

  // Clean up old requests
  const periodMs = limit.period === 'minute' ? 60000 : 
                  limit.period === 'hour' ? 3600000 : 
                  86400000; // day
  state.requests = state.requests.filter(time => now - time < periodMs);

  // Check if limit exceeded
  if (state.requests.length >= limit.requests) {
    const oldestRequest = state.requests[0];
    const timeToReset = (oldestRequest + periodMs) - now;
    console.warn(`Rate limit exceeded for ${service}. Reset in ${Math.ceil(timeToReset / 1000)}s`);
    return false;
  }

  // Add new request
  state.requests.push(now);
  rateLimitState.set(service, state);
  return true;
};

// Error handling utility with retry logic
export const handleApiError = async (error, context = '', retryCount = 0) => {
  const maxRetries = API_CONFIG.retryAttempts;
  const baseDelay = 1000; // 1 second

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;

    // Handle rate limiting
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.warn(`Rate limit exceeded for ${context}. Retry after ${retryAfter}s`);
      return {
        error: true,
        message: 'Rate limit exceeded',
        status,
        retryAfter,
        context
      };
    }

    // Handle authentication errors
    if (status === 401 || status === 403) {
      console.error(`${context} Authentication Error:`, {
        status,
        message: data.message || 'Authentication failed'
      });
      return {
        error: true,
        message: 'Authentication failed',
        status,
        context
      };
    }

    // Log the error
    console.error(`${context} API Error:`, {
      status,
      data,
      headers: error.response.headers
    });

    // Retry on 5xx errors
    if (status >= 500 && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.warn(`Retrying ${context} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return handleApiError(error, context, retryCount + 1);
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`${context} Network Error:`, error.request);

    // Retry on network errors
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.warn(`Retrying ${context} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return handleApiError(error, context, retryCount + 1);
    }
  } else {
    // Something happened in setting up the request
    console.error(`${context} Request Setup Error:`, error.message);
  }

  // Return a standardized error object
  return {
    error: true,
    message: error.response?.data?.message || error.message || 'An unexpected error occurred',
    status: error.response?.status || 500,
    context,
    retryCount
  };
};

// Cache utility
export const cacheUtils = {
  store: new Map(),
  
  isValid: (entry) => {
    return entry && (Date.now() - entry.timestamp) < API_CONFIG.cache.duration;
  },
  
  get: (key) => {
    if (!API_CONFIG.cache.enabled) return null;
    const entry = cacheUtils.store.get(key);
    return cacheUtils.isValid(entry) ? entry.data : null;
  },
  
  set: (key, data) => {
    if (!API_CONFIG.cache.enabled) return;
    cacheUtils.store.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  clear: () => {
    cacheUtils.store.clear();
  }
};

// API request utility
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', params = {}, data = null, useCache = true } = options;
  
  // Generate cache key if caching is enabled
  const cacheKey = useCache ? `${endpoint}-${JSON.stringify(params)}-${JSON.stringify(data)}` : null;
  
  // Check cache first
  if (useCache) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) return cachedData;
  }
  
  try {
    const response = await axios({
      method,
      url: `${API_CONFIG.baseUrl}${endpoint}`,
      params,
      data,
      timeout: API_CONFIG.timeout
    });
    
    // Cache successful response
    if (useCache) {
      cacheUtils.set(cacheKey, response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, endpoint);
  }
}; 