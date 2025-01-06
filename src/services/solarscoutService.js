import { API_CONFIG } from '../config/api';

export const fetchUtilityBoundaries = async ({ bounds, zoom }) => {
  try {
    const [west, south, east, north] = bounds;
    const response = await fetch(
      `${API_CONFIG.SOLARSCOUT_API}/utility-boundaries?bounds=${west},${south},${east},${north}&zoom=${zoom}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch utility boundaries');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching utility boundaries:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

export const fetchSolarInstallations = async ({ bounds, zoom, filters }) => {
  try {
    const [west, south, east, north] = bounds;
    const queryParams = new URLSearchParams({
      bounds: `${west},${south},${east},${north}`,
      zoom: zoom.toString(),
      ...filters
    });

    const response = await fetch(
      `${API_CONFIG.SOLARSCOUT_API}/solar-installations?${queryParams}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch solar installations');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching solar installations:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

export const fetchEVStations = async ({ bounds, zoom }) => {
  try {
    const [west, south, east, north] = bounds;
    const response = await fetch(
      `${API_CONFIG.SOLARSCOUT_API}/ev-stations?bounds=${west},${south},${east},${north}&zoom=${zoom}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch EV stations');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching EV stations:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

export const fetchMoveIns = async ({ bounds, zoom }) => {
  try {
    const [west, south, east, north] = bounds;
    const response = await fetch(
      `${API_CONFIG.SOLARSCOUT_API}/move-ins?bounds=${west},${south},${east},${north}&zoom=${zoom}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch move-ins');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching move-ins:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

export const fetchNeighborhoods = async ({ bounds, zoom }) => {
  try {
    const [west, south, east, north] = bounds;
    const response = await fetch(
      `${API_CONFIG.SOLARSCOUT_API}/neighborhoods?bounds=${west},${south},${east},${north}&zoom=${zoom}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch neighborhoods');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}; 