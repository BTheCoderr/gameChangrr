import axios from 'axios';
import { ValidationError } from './validationUtils';

// API configuration from environment variables
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Retry configuration from environment variables
const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.REACT_APP_API_MAX_RETRIES) || 3,
  initialDelay: parseInt(process.env.REACT_APP_API_INITIAL_DELAY) || 1000,
  maxDelay: parseInt(process.env.REACT_APP_API_MAX_DELAY) || 10000,
  factor: parseFloat(process.env.REACT_APP_API_BACKOFF_FACTOR) || 2,
  statusCodes: [408, 429, 500, 502, 503, 504]
};

// Create axios instance
export const api = axios.create(API_CONFIG);

// Error types
export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Retry logic with exponential backoff
const retryRequest = async (fn, retries = RETRY_CONFIG.maxRetries) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0 || !shouldRetry(error)) {
      throw error;
    }

    const delay = calculateDelay(RETRY_CONFIG.maxRetries - retries);
    await sleep(delay);

    return retryRequest(fn, retries - 1);
  }
};

// Helper functions
const shouldRetry = (error) => {
  if (!error.response) {
    // Network errors should be retried
    return true;
  }

  return RETRY_CONFIG.statusCodes.includes(error.response.status);
};

const calculateDelay = (attempt) => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.factor, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 400:
          throw new ValidationError('Invalid request data', error.response.data.errors);
        case 401:
          // Handle token refresh or logout
          await handleUnauthorized();
          break;
        case 403:
          throw new ApiError('Access denied', 403, 'FORBIDDEN');
        case 404:
          throw new ApiError('Resource not found', 404, 'NOT_FOUND');
        case 422:
          throw new ValidationError('Validation failed', error.response.data.errors);
        default:
          throw new ApiError(
            error.response.data.message || 'An error occurred',
            error.response.status,
            error.response.data.code
          );
      }
    }

    // Network errors
    throw new ApiError('Network error', 0, 'NETWORK_ERROR');
  }
);

// API wrapper with retry logic
export const apiWrapper = {
  async get(url, config = {}) {
    return retryRequest(() => api.get(url, config));
  },

  async post(url, data, config = {}) {
    return retryRequest(() => api.post(url, data, config));
  },

  async put(url, data, config = {}) {
    return retryRequest(() => api.put(url, data, config));
  },

  async delete(url, config = {}) {
    return retryRequest(() => api.delete(url, config));
  },

  async patch(url, data, config = {}) {
    return retryRequest(() => api.patch(url, data, config));
  }
};

// Authentication handlers
const handleUnauthorized = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    // No refresh token available, force logout
    handleLogout();
    return;
  }

  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, newRefreshToken } = response.data;

    // Update tokens
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    // Return success to allow retry of original request
    return true;
  } catch (error) {
    // Refresh failed, force logout
    handleLogout();
    return false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

// Utility functions for common API operations
export const apiUtils = {
  // Batch requests with concurrency control
  async batchRequests(requests, concurrency = 3) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(async (request) => {
        try {
          const response = await apiWrapper[request.method.toLowerCase()](
            request.url,
            request.data,
            request.config
          );
          results.push({ success: true, data: response.data });
        } catch (error) {
          errors.push({
            success: false,
            error: error.message,
            request
          });
        }
      });

      await Promise.all(batchPromises);
    }

    return { results, errors };
  },

  // Upload file with progress tracking
  async uploadFile(url, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return apiWrapper.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      }
    });
  },

  // Download file
  async downloadFile(url, filename) {
    const response = await apiWrapper.get(url, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}; 