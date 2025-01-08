import { API_CONFIG, handleApiError, checkRateLimit } from '../config/api';
import axios from 'axios';

// Cache duration in milliseconds (1 hour for weather data)
const CACHE_DURATION = 60 * 60 * 1000;

// Simple in-memory cache
const cache = new Map();

const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Convert weather data to solar impact score (0-100)
const calculateSolarImpact = (weather) => {
  // Base score from cloud coverage (0-100)
  const cloudScore = 100 - weather.clouds.all;
  
  // Adjust for precipitation
  const precipPenalty = weather.rain ? 
    Math.min(30, weather.rain['1h'] * 10) : 
    weather.snow ? 
      Math.min(50, weather.snow['1h'] * 15) : 
      0;
  
  // Adjust for visibility
  const visibilityScore = (weather.visibility / 10000) * 100;
  
  // Combine scores with weights
  const score = (
    (cloudScore * 0.5) + 
    (visibilityScore * 0.3) - 
    (precipPenalty * 0.2)
  );
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const fetchWeatherData = async (bounds) => {
  const center = {
    lat: (bounds.north + bounds.south) / 2,
    lon: (bounds.east + bounds.west) / 2
  };
  
  const cacheKey = `weather-${center.lat.toFixed(2)}-${center.lon.toFixed(2)}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    // Check rate limits before making the request
    if (!checkRateLimit('openWeather')) {
      throw new Error('Rate limit exceeded for OpenWeatherMap API');
    }

    if (import.meta.env.VITE_OPENWEATHER_API_KEY) {
      const response = await axios.get(`${API_CONFIG.openWeatherBaseUrl}/weather`, {
        params: {
          lat: center.lat,
          lon: center.lon,
          appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
          units: 'metric'
        }
      });

      if (response.data) {
        const weatherData = {
          current: {
            ...response.data,
            solarImpact: calculateSolarImpact(response.data)
          }
        };

        // Update cache
        cache.set(cacheKey, {
          data: weatherData,
          timestamp: Date.now()
        });

        return weatherData;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch weather data from OpenWeatherMap API, falling back to mock data:', error);
    await handleApiError(error, 'Weather Data');
  }

  // Generate mock weather data
  const mockData = {
    current: {
      weather: [{
        main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
        description: 'Mock weather data'
      }],
      clouds: {
        all: Math.floor(Math.random() * 100)
      },
      visibility: Math.floor(7000 + Math.random() * 3000),
      rain: Math.random() > 0.7 ? { '1h': Math.random() * 5 } : undefined,
      snow: Math.random() > 0.9 ? { '1h': Math.random() * 2 } : undefined,
      temp: 15 + Math.random() * 15,
      feels_like: 14 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      wind_speed: Math.random() * 10,
      dt: Date.now() / 1000
    }
  };

  // Calculate solar impact for mock data
  mockData.current.solarImpact = calculateSolarImpact(mockData.current);

  // Cache mock data too
  cache.set(cacheKey, {
    data: mockData,
    timestamp: Date.now()
  });

  return mockData;
};

export const fetchForecast = async (bounds) => {
  const center = {
    lat: (bounds.north + bounds.south) / 2,
    lon: (bounds.east + bounds.west) / 2
  };
  
  const cacheKey = `forecast-${center.lat.toFixed(2)}-${center.lon.toFixed(2)}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (isCacheValid(cachedData)) {
    return cachedData.data;
  }

  try {
    // Check rate limits before making the request
    if (!checkRateLimit('openWeather')) {
      throw new Error('Rate limit exceeded for OpenWeatherMap API');
    }

    if (import.meta.env.VITE_OPENWEATHER_API_KEY) {
      const response = await axios.get(`${API_CONFIG.openWeatherBaseUrl}/forecast`, {
        params: {
          lat: center.lat,
          lon: center.lon,
          appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
          units: 'metric'
        }
      });

      if (response.data && response.data.list) {
        const forecastData = {
          ...response.data,
          list: response.data.list.map(item => ({
            ...item,
            solarImpact: calculateSolarImpact(item)
          }))
        };

        // Update cache
        cache.set(cacheKey, {
          data: forecastData,
          timestamp: Date.now()
        });

        return forecastData;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch forecast data from OpenWeatherMap API, falling back to mock data:', error);
    await handleApiError(error, 'Weather Forecast');
  }

  // Generate mock forecast data
  const mockForecast = {
    list: Array.from({ length: 40 }, (_, i) => {
      const hour = i * 3; // 3-hour intervals
      const mockWeather = {
        dt: Math.floor(Date.now() / 1000) + (hour * 3600),
        weather: [{
          main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
          description: 'Mock forecast data'
        }],
        clouds: {
          all: Math.floor(Math.random() * 100)
        },
        visibility: Math.floor(7000 + Math.random() * 3000),
        rain: Math.random() > 0.7 ? { '3h': Math.random() * 15 } : undefined,
        snow: Math.random() > 0.9 ? { '3h': Math.random() * 6 } : undefined,
        main: {
          temp: 15 + Math.random() * 15,
          feels_like: 14 + Math.random() * 15,
          humidity: 40 + Math.random() * 40
        },
        wind: {
          speed: Math.random() * 10
        }
      };

      return {
        ...mockWeather,
        solarImpact: calculateSolarImpact(mockWeather)
      };
    })
  };

  // Cache mock data too
  cache.set(cacheKey, {
    data: mockForecast,
    timestamp: Date.now()
  });

  return mockForecast;
}; 