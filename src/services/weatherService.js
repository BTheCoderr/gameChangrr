import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache for weather data
const weatherCache = new Map();
const CACHE_DURATION = 1800000; // 30 minutes in milliseconds

/**
 * Get current weather data for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Units of measurement ('metric' or 'imperial')
 * @returns {Promise<Object>} Weather data
 */
export const getCurrentWeather = async (lat, lon, units = 'imperial') => {
  const cacheKey = `weather_${lat}_${lon}_${units}`;
  const cachedData = weatherCache.get(cacheKey);
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        units,
        appid: OPENWEATHER_API_KEY
      }
    });

    const weatherData = {
      temperature: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon
    };

    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

/**
 * Get 5-day weather forecast for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Units of measurement ('metric' or 'imperial')
 * @returns {Promise<Array>} Forecast data
 */
export const getForecast = async (lat, lon, units = 'imperial') => {
  const cacheKey = `forecast_${lat}_${lon}_${units}`;
  const cachedData = weatherCache.get(cacheKey);
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        units,
        appid: OPENWEATHER_API_KEY
      }
    });

    const forecastData = response.data.list.map(item => ({
      timestamp: item.dt * 1000,
      temperature: item.main.temp,
      feelsLike: item.main.feels_like,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }));

    weatherCache.set(cacheKey, {
      data: forecastData,
      timestamp: Date.now()
    });

    return forecastData;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    return null;
  }
};

/**
 * Get weather alerts for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Array>} Weather alerts
 */
export const getWeatherAlerts = async (lat, lon) => {
  const cacheKey = `alerts_${lat}_${lon}`;
  const cachedData = weatherCache.get(cacheKey);
  
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const response = await axios.get(`${BASE_URL}/onecall`, {
      params: {
        lat,
        lon,
        exclude: 'current,minutely,hourly,daily',
        appid: OPENWEATHER_API_KEY
      }
    });

    const alertsData = response.data.alerts || [];

    weatherCache.set(cacheKey, {
      data: alertsData,
      timestamp: Date.now()
    });

    return alertsData;
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    return null;
  }
}; 