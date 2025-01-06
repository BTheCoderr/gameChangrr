import axios from 'axios';
import { API_CONFIG, getHeaders, handleApiError } from '../config/api';

// Springfield, MA area bounding box
const DEFAULT_BOUNDS = {
  north: 42.1418,
  south: 42.0824,
  east: -72.4771,
  west: -72.6242
};

export const fetchSolarInstallations = async (bounds = DEFAULT_BOUNDS) => {
  try {
    console.log('[Debug] Fetching solar installations from NREL');
    
    // First try to get data from NREL
    const nrelResponse = await axios.get(
      `https://developer.nrel.gov/api/solar/solar_installations/v1.json`,
      {
        params: {
          api_key: API_CONFIG.nrel.token,
          bounds: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
          limit: 100
        }
      }
    );

    // Then try to get additional data from Mass Data API
    let massDataResponse = { data: { result: [] } };
    if (API_CONFIG.gamechangrr.token) {
      try {
        massDataResponse = await axios.get(
          `${API_CONFIG.gamechangrr.baseUrl}/solar/installations`,
          {
            params: {
              bounds: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
              limit: 100
            },
            headers: getHeaders('gamechangrr')
          }
        );
      } catch (massError) {
        console.warn('Could not fetch Mass solar data:', massError);
      }
    }

    // Combine and transform the data
    const nrelFeatures = (nrelResponse.data.outputs || []).map(installation => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [installation.longitude, installation.latitude]
      },
      properties: {
        id: installation.id || `nrel-${Math.random().toString(36).substr(2, 9)}`,
        capacity: installation.size_kw,
        date_installed: installation.date_installed,
        system_type: installation.system_type,
        address: installation.address,
        source: 'NREL',
        status: 'completed',
        installer: installation.installer_name,
        cost: installation.cost,
        incentives: installation.incentives
      }
    }));

    const massFeatures = (massDataResponse.data.result || []).map(installation => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [installation.longitude, installation.latitude]
      },
      properties: {
        id: installation.id,
        capacity: installation.system_size,
        date_installed: installation.install_date,
        system_type: installation.system_type,
        address: installation.address,
        source: 'MassData',
        status: installation.status,
        installer: installation.installer,
        cost: installation.total_cost,
        incentives: installation.incentives
      }
    }));

    // Combine both datasets
    return {
      type: 'FeatureCollection',
      features: [...nrelFeatures, ...massFeatures]
    };
  } catch (error) {
    handleApiError(error, 'Solar Installations');
    console.error('Error fetching solar installations:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

export const getSolarInstallationStyle = (feature) => {
  const defaultStyle = {
    radius: 8,
    fillColor: '#FFD700',
    color: '#FF8C00',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.7
  };

  // Adjust style based on installation size
  if (feature.properties.capacity) {
    const size = parseFloat(feature.properties.capacity);
    if (size > 20) {
      return { ...defaultStyle, radius: 12, fillColor: '#FFA500' };
    } else if (size > 10) {
      return { ...defaultStyle, radius: 10, fillColor: '#FFD700' };
    }
  }

  return defaultStyle;
}; 