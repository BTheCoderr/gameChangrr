import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchEVOwners(bounds) {
  try {
    const response = await axios.get(`${API_URL}/api/ev-owners`, {
      params: {
        minLat: bounds.south,
        maxLat: bounds.north,
        minLng: bounds.west,
        maxLng: bounds.east
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching EV owners:', error);
    return [];
  }
}

export async function fetchEVStatistics(bounds) {
  try {
    const response = await axios.get(`${API_URL}/api/ev-statistics`, {
      params: {
        minLat: bounds.south,
        maxLat: bounds.north,
        minLng: bounds.west,
        maxLng: bounds.east
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching EV statistics:', error);
    return null;
  }
} 