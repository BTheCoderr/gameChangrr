import axios from 'axios';

const NREL_API_KEY = import.meta.env.VITE_NREL_API_KEY;

// Springfield, MA bounding box
const BOUNDS = {
  north: 42.1418,
  south: 42.0824,
  east: -72.4771,
  west: -72.6242
};

export const fetchSolarInstallations = async () => {
  try {
    const response = await axios.get(
      `https://developer.nrel.gov/api/solar/solar_installations/v1.json?api_key=${NREL_API_KEY}&bounds=${BOUNDS.south},${BOUNDS.west},${BOUNDS.north},${BOUNDS.east}`
    );

    // Transform the data into GeoJSON format
    const features = response.data.outputs.map(installation => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [installation.longitude, installation.latitude]
      },
      properties: {
        capacity: installation.capacity_kw,
        date_installed: installation.date_installed,
        system_type: installation.system_type,
        address: installation.address
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error fetching solar installations:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

export const getSolarInstallationStyle = () => ({
  radius: 8,
  fillColor: '#FFD700',
  color: '#FF8C00',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.7
}); 