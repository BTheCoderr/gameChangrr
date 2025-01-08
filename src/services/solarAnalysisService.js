import { API_CONFIG } from '../config/api';

// Fetch utility boundaries for the current map view
export const fetchUtilityBoundaries = async (bounds, zoom) => {
  const { west, south, east, north } = bounds;
  const url = 
    `${API_CONFIG.API_BASE_URL}/utility-boundaries?bounds=${west},${south},${east},${north}&zoom=${zoom}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch utility boundaries');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching utility boundaries:', error);
    throw error;
  }
};

// Fetch solar installations in the area
export const fetchSolarInstallations = async (params) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = 
    `${API_CONFIG.API_BASE_URL}/solar-installations?${queryParams}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch solar installations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching solar installations:', error);
    throw error;
  }
};

// Fetch EV charging stations
export const fetchEVStations = async (bounds, zoom) => {
  const { west, south, east, north } = bounds;
  const url = 
    `${API_CONFIG.API_BASE_URL}/ev-stations?bounds=${west},${south},${east},${north}&zoom=${zoom}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch EV stations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching EV stations:', error);
    throw error;
  }
};

// Fetch recent move-ins
export const fetchMoveIns = async (bounds, zoom) => {
  const { west, south, east, north } = bounds;
  const url = 
    `${API_CONFIG.API_BASE_URL}/move-ins?bounds=${west},${south},${east},${north}&zoom=${zoom}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch move-ins');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching move-ins:', error);
    throw error;
  }
};

// Fetch neighborhood data
export const fetchNeighborhoods = async (bounds, zoom) => {
  const { west, south, east, north } = bounds;
  const url = 
    `${API_CONFIG.API_BASE_URL}/neighborhoods?bounds=${west},${south},${east},${north}&zoom=${zoom}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch neighborhoods');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    throw error;
  }
}; 