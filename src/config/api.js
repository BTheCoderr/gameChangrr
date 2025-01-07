// API configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retryAttempts: 3
};

// Error handling utility
export const handleApiError = (error, context = '') => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`${context} API Error:`, {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`${context} Network Error:`, error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`${context} Request Setup Error:`, error.message);
  }

  // Return a standardized error object
  return {
    error: true,
    message: error.response?.data?.message || error.message || 'An unexpected error occurred',
    status: error.response?.status || 500,
    context
  };
}; 