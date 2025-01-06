import axios from 'axios';
import { API_CONFIG, handleApiError } from '../config/api';

export async function fetchEVStations(bounds) {
  try {
    console.log('[Debug] Fetching EV stations from NREL');
    
    // Fetch from NREL Alternative Fuel Stations API
    const response = await axios.get(
      'https://developer.nrel.gov/api/alt-fuel-stations/v1.json',
      {
        params: {
          api_key: API_CONFIG.nrel.token,
          fuel_type: 'ELEC',
          status: 'E',  // E for existing
          access: 'public',
          latitude: (bounds.north + bounds.south) / 2,
          longitude: (bounds.east + bounds.west) / 2,
          radius: 50,  // 50 mile radius
          limit: 100
        }
      }
    );

    // Transform to GeoJSON
    const features = response.data.fuel_stations.map(station => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [station.longitude, station.latitude]
      },
      properties: {
        id: station.id,
        name: station.station_name,
        status: station.status_code,
        address: station.street_address,
        city: station.city,
        state: station.state,
        zip: station.zip,
        numChargers: station.ev_dc_fast_num || station.ev_level2_evse_num || 1,
        connectorTypes: [
          ...(station.ev_dc_fast_num ? ['DC Fast'] : []),
          ...(station.ev_level2_evse_num ? ['Level 2'] : []),
          ...(station.ev_level1_evse_num ? ['Level 1'] : [])
        ],
        network: station.ev_network || 'Unknown',
        openTime: station.access_days_time,
        phone: station.station_phone,
        pricing: station.ev_pricing
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    handleApiError(error, 'EV Stations');
    console.error('Error fetching EV stations:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}

export async function fetchEVStatistics(bounds) {
  try {
    // Fetch from Census API for EV registration data
    const response = await axios.get(
      `${API_CONFIG.census.baseUrl}/2021/acs/acs5`,
      {
        params: {
          get: 'B25044_003E,B25044_004E', // Variables for vehicle availability
          for: 'tract:*',
          in: `state:25 county:013`, // Hampden County, MA
          key: API_CONFIG.census.token
        }
      }
    );

    const [headers, ...data] = response.data;
    
    return {
      totalEVs: data.reduce((sum, row) => sum + (parseInt(row[0]) || 0) + (parseInt(row[1]) || 0), 0),
      byTract: data.map(row => ({
        tract: row[headers.indexOf('tract')],
        evCount: (parseInt(row[0]) || 0) + (parseInt(row[1]) || 0)
      }))
    };
  } catch (error) {
    handleApiError(error, 'EV Statistics');
    console.error('Error fetching EV statistics:', error);
    return null;
  }
}

// Helper function to get EV station style based on properties
export const getEVStationStyle = (feature) => {
  const defaultStyle = {
    radius: 8,
    fillColor: '#4CAF50',
    color: '#388E3C',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.7
  };

  // Adjust style based on number of chargers
  const numChargers = feature.properties.numChargers;
  if (numChargers > 8) {
    return { ...defaultStyle, radius: 12, fillColor: '#2E7D32' };
  } else if (numChargers > 4) {
    return { ...defaultStyle, radius: 10, fillColor: '#4CAF50' };
  }

  return defaultStyle;
}; 