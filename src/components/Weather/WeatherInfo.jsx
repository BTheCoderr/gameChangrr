import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { getCurrentWeather, getForecast } from '../../services/weatherService';

const WeatherInfo = ({ lat, lon }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        const [weather, forecastData] = await Promise.all([
          getCurrentWeather(lat, lon),
          getForecast(lat, lon)
        ]);

        if (weather) setCurrentWeather(weather);
        if (forecastData) setForecast(forecastData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon) {
      fetchWeatherData();
    }
  }, [lat, lon]);

  if (loading) {
    return (
      <Card>
        <CardContent style={{ textAlign: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Current Weather</Typography>
            <Typography>
              {Math.round(currentWeather.temperature)}°F - {currentWeather.description}
            </Typography>
            <Typography>
              Feels like: {Math.round(currentWeather.feelsLike)}°F
            </Typography>
            <Typography>
              Humidity: {currentWeather.humidity}%
            </Typography>
            <Typography>
              Wind Speed: {Math.round(currentWeather.windSpeed)} mph
            </Typography>
          </Grid>
          {forecast && (
            <Grid item xs={12}>
              <Typography variant="h6" style={{ marginTop: 16 }}>
                5-Day Forecast
              </Typography>
              <Grid container spacing={1}>
                {forecast.slice(0, 5).map((day, index) => (
                  <Grid item xs={12} sm={2} key={index}>
                    <Typography variant="body2">
                      {new Date(day.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Typography>
                    <Typography variant="body2">
                      {Math.round(day.temperature)}°F
                    </Typography>
                    <Typography variant="body2">
                      {day.description}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WeatherInfo; 