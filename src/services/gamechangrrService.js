import { API_CONFIG } from '../config/api';
import { cacheData, getCachedData, getCacheDuration } from '../utils/cacheUtils';
import { mockUtilityBoundaries } from '../data/mockUtilityData';
import { mockSolarPermits } from '../data/mockSolarData';
import { mockMoveIns } from '../data/mockMoveIns';

export const fetchUtilityBoundaries = async (bounds) => {
  try {
    // Convert bounds object to array format [west, south, east, north]
    const boundsArray = bounds ? [bounds.west, bounds.south, bounds.east, bounds.north] : null;
    
    // Check cache first
    const cached = getCachedData('utility-boundaries', boundsArray);
    if (cached) return cached;

    // For now, return mock data
    const data = mockUtilityBoundaries;
    
    // Cache the data
    cacheData('utility-boundaries', boundsArray, {}, data, getCacheDuration('utility-boundaries'));
    
    return data;
  } catch (error) {
    console.error('Error fetching utility boundaries:', error);
    throw error;
  }
};

export const fetchSolarInstallations = async (bounds, filters = {}) => {
  try {
    // Convert bounds object to array format [west, south, east, north]
    const boundsArray = bounds ? [bounds.west, bounds.south, bounds.east, bounds.north] : null;
    
    // Check cache first
    const cached = getCachedData('solar-permits', boundsArray, filters);
    if (cached) return cached;

    // For now, return mock data
    const data = mockSolarPermits;
    
    // Cache the data
    cacheData('solar-permits', boundsArray, filters, data, getCacheDuration('solar-permits'));
    
    return data;
  } catch (error) {
    console.error('Error fetching solar installations:', error);
    throw error;
  }
};

export const fetchMoveIns = async (bounds, filters = {}) => {
  try {
    // Convert bounds object to array format [west, south, east, north]
    const boundsArray = bounds ? [bounds.west, bounds.south, bounds.east, bounds.north] : null;
    
    // Check cache first
    const cached = getCachedData('move-ins', boundsArray, filters);
    if (cached) return cached;

    // For now, return mock data
    const data = mockMoveIns;
    
    // Cache the data
    cacheData('move-ins', boundsArray, filters, data, getCacheDuration('move-ins'));
    
    return data;
  } catch (error) {
    console.error('Error fetching move-ins:', error);
    throw error;
  }
};

export const fetchEVStations = async (bounds, filters = {}) => {
  try {
    // Convert bounds object to array format [west, south, east, north]
    const boundsArray = bounds ? [bounds.west, bounds.south, bounds.east, bounds.north] : null;
    
    // Check cache first
    const cached = getCachedData('ev-stations', boundsArray, filters);
    if (cached) return cached;

    const response = await fetch(
      `${API_CONFIG.nrelBaseUrl}/alt-fuel-stations/v1.json?` +
      `api_key=${import.meta.env.VITE_NREL_API_KEY}&` +
      `bounds=${boundsArray?.join(',')}&` +
      `status=E&fuel_type=ELEC&access=public`
    );

    if (!response.ok) {
      throw new Error(`NREL API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform to GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: data.fuel_stations.map(station => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [station.longitude, station.latitude]
        },
        properties: {
          id: station.id,
          name: station.station_name,
          status: station.status_code,
          numChargers: station.ev_connector_types?.length || 0,
          network: station.ev_network,
          connectorTypes: station.ev_connector_types,
          address: station.street_address,
          city: station.city,
          state: station.state,
          zip: station.zip
        }
      }))
    };

    // Cache the transformed data
    cacheData('ev-stations', boundsArray, filters, geojson, getCacheDuration('ev-stations'));
    
    return geojson;
  } catch (error) {
    console.error('Error fetching EV stations:', error);
    throw error;
  }
};

export const fetchNeighborhoods = async (bounds) => {
  try {
    // Check cache first
    const cached = getCachedData('neighborhoods', bounds);
    if (cached) return cached;

    const response = await fetch(
      `${API_CONFIG.baseUrl}/neighborhoods?bounds=${bounds.join(',')}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch neighborhoods');
    }

    const data = await response.json();
    
    // Cache the data
    cacheData('neighborhoods', bounds, {}, data, getCacheDuration('neighborhoods'));
    
    return data;
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    throw error;
  }
}; 