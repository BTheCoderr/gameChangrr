import { API_CONFIG, handleApiError } from '../config/api';
import axios from 'axios';

// Mock data for different permit types
const mockPermits = {
  roof: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5898, 42.1015]
      },
      properties: {
        id: 'R001',
        type: 'roof',
        status: 'active',
        issueDate: '2023-12-01',
        address: '123 Main St, Springfield, MA',
        contractor: 'ABC Roofing',
        value: 15000,
        notes: 'Complete roof replacement'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5878, 42.1025]
      },
      properties: {
        id: 'R002',
        type: 'roof',
        status: 'pending',
        issueDate: '2023-12-05',
        address: '456 Oak St, Springfield, MA',
        contractor: 'XYZ Construction',
        value: 12000,
        notes: 'Partial repair and ventilation upgrade'
      }
    }
  ],
  hvac: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5868, 42.1035]
      },
      properties: {
        id: 'H001',
        type: 'hvac',
        status: 'active',
        issueDate: '2023-12-02',
        address: '789 Elm St, Springfield, MA',
        contractor: 'Cool Air Systems',
        systemType: 'Heat Pump',
        value: 8000,
        notes: 'New heat pump installation'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5848, 42.1045]
      },
      properties: {
        id: 'H002',
        type: 'hvac',
        status: 'completed',
        issueDate: '2023-12-03',
        address: '321 Pine St, Springfield, MA',
        contractor: 'Comfort HVAC',
        systemType: 'Central AC',
        value: 6500,
        notes: 'AC replacement and duct cleaning'
      }
    }
  ],
  pool: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5838, 42.1055]
      },
      properties: {
        id: 'P001',
        type: 'pool',
        status: 'active',
        issueDate: '2023-12-04',
        address: '654 Maple St, Springfield, MA',
        contractor: 'Blue Waters Pools',
        poolType: 'In-ground',
        size: 450,
        value: 35000,
        notes: 'New in-ground pool installation'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5818, 42.1065]
      },
      properties: {
        id: 'P002',
        type: 'pool',
        status: 'pending',
        issueDate: '2023-12-06',
        address: '987 Cedar St, Springfield, MA',
        contractor: 'Splash Pools',
        poolType: 'Above-ground',
        size: 300,
        value: 15000,
        notes: 'Above-ground pool with deck'
      }
    }
  ]
};

// Helper function to generate random permits within bounds
const generateRandomPermits = (type, bounds, count = 10) => {
  const permits = [];
  const { north, south, east, west } = bounds;

  for (let i = 0; i < count; i++) {
    const lat = south + Math.random() * (north - south);
    const lng = west + Math.random() * (east - west);
    const template = mockPermits[type][Math.floor(Math.random() * mockPermits[type].length)];

    permits.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        ...template.properties,
        id: `${template.properties.id}-${i}`,
        issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });
  }

  return permits;
};

export const fetchPermits = async (type, bounds) => {
  try {
    // Try to fetch from API first
    const response = await axios.get(`${API_CONFIG.baseUrl}/permits/${type}`, {
      params: {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west
      }
    });

    if (response.data && response.data.features) {
      return response.data;
    }
  } catch (error) {
    console.warn(`Failed to fetch ${type} permits from API, falling back to mock data:`, error);
    handleApiError(error, `${type} Permits`);
  }

  // Fall back to mock data
  const mockData = {
    type: 'FeatureCollection',
    features: generateRandomPermits(type, bounds)
  };

  return mockData;
};

export const getPermitDetails = async (permitId) => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/permits/${permitId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permit details:', error);
    handleApiError(error, 'Permit Details');
    return null;
  }
};

export const getPermitStats = async (type, bounds) => {
  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}/permits/${type}/stats`, {
      params: bounds
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching permit statistics:', error);
    handleApiError(error, 'Permit Statistics');
    
    // Return mock stats
    return {
      total: 150,
      active: 45,
      pending: 30,
      completed: 75,
      averageValue: 12500,
      monthlyTrend: [
        { month: '2023-07', count: 12 },
        { month: '2023-08', count: 15 },
        { month: '2023-09', count: 18 },
        { month: '2023-10', count: 22 },
        { month: '2023-11', count: 25 },
        { month: '2023-12', count: 20 }
      ]
    };
  }
}; 