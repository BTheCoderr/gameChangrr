import axios from 'axios'
import { API_CONFIG, handleApiError } from '../config/api'

// API endpoints
const ENDPOINTS = {
  MASSGIS: 'https://gis-prod.digital.mass.gov/geoserver/wfs',
  ARCGIS: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Electric_Retail_Service_Territories/FeatureServer/0/query'
};

// Utility boundary coordinates for Massachusetts
const UTILITY_BOUNDARIES = {
  WESTERN_MASS_ELECTRIC: [
    [-73.5080, 42.7420], // Northwest corner
    [-72.5840, 42.7420], // Northeast corner
    [-72.5840, 42.0070], // Southeast corner
    [-73.5080, 42.0070]  // Southwest corner
  ],
  MASS_ELECTRIC: [
    [-72.5840, 42.7420],
    [-71.7980, 42.7420],
    [-71.7980, 42.0070],
    [-72.5840, 42.0070]
  ],
  NSTAR: [
    [-71.7980, 42.7420],
    [-70.8150, 42.7420],
    [-70.8150, 41.9180],
    [-71.7980, 41.9180]
  ],
  CHICOPEE: [
    [-72.6240, 42.2080],
    [-72.5520, 42.2080],
    [-72.5520, 42.1420],
    [-72.6240, 42.1420]
  ],
  FARMINGTON_RIVER: [
    [-73.2580, 42.0070],
    [-72.9240, 42.0070],
    [-72.9240, 41.8890],
    [-73.2580, 41.8890]
  ],
  CONNECTICUT_LIGHT: [
    [-72.9240, 42.0070],
    [-72.3620, 42.0070],
    [-72.3620, 41.8890],
    [-72.9240, 41.8890]
  ]
};

// Create GeoJSON polygons from coordinates
const createPolygon = (coordinates) => ({
  type: 'Polygon',
  coordinates: [
    [...coordinates, coordinates[0]] // Close the polygon by repeating first point
  ]
});

// Massachusetts utility companies with extended data
const MA_UTILITIES = {
  'WESTERN_MASS_ELECTRIC': {
    name: 'Western Massachusetts Electric Company',
    color: '#FFA000',
    borderColor: '#FF6F00',
    opacity: 0.4,
    serviceArea: 'Western Massachusetts',
    geometry: createPolygon(UTILITY_BOUNDARIES.WESTERN_MASS_ELECTRIC),
    rates: {
      residential: {
        base: 0.22,
        peak: 0.28,
        offPeak: 0.18
      },
      commercial: {
        base: 0.19,
        peak: 0.25,
        offPeak: 0.15
      }
    },
    programs: {
      solar: {
        name: 'Connected Solutions Program',
        incentiveRate: 0.05,
        maxCapacity: 10,
        requirements: ['Residential property', 'South-facing roof', 'No shade']
      },
      storage: {
        available: true,
        incentive: '$50/kW-year'
      }
    }
  },
  'MASS_ELECTRIC': {
    name: 'Massachusetts Electric Co',
    color: '#F57C00',
    borderColor: '#E65100',
    opacity: 0.4,
    serviceArea: 'Central Massachusetts',
    rates: {
      residential: {
        base: 0.24,
        peak: 0.30,
        offPeak: 0.19
      },
      commercial: {
        base: 0.21,
        peak: 0.27,
        offPeak: 0.16
      }
    },
    programs: {
      solar: {
        name: 'Solar Rewards Program',
        incentiveRate: 0.06,
        maxCapacity: 12,
        requirements: ['Smart inverter', 'Internet connection']
      },
      storage: {
        available: true,
        incentive: '$45/kW-year'
      }
    }
  },
  'NSTAR': {
    name: 'NSTAR Electric Company',
    color: '#FB8C00',
    borderColor: '#EF6C00',
    opacity: 0.4,
    serviceArea: 'Eastern Massachusetts',
    rates: {
      residential: {
        base: 0.23,
        peak: 0.29,
        offPeak: 0.18
      },
      commercial: {
        base: 0.20,
        peak: 0.26,
        offPeak: 0.15
      }
    },
    programs: {
      solar: {
        name: 'Solar Massachusetts Renewable Target',
        incentiveRate: 0.055,
        maxCapacity: 15,
        requirements: ['Massachusetts residence', 'Approved installer']
      },
      storage: {
        available: true,
        incentive: '$55/kW-year'
      }
    }
  },
  'CHICOPEE': {
    name: 'City of Chicopee (MA)',
    color: '#FF5252',
    borderColor: '#D32F2F',
    opacity: 0.4,
    serviceArea: 'Chicopee Metropolitan Area',
    rates: {
      residential: {
        base: 0.21,
        peak: 0.26,
        offPeak: 0.17
      },
      commercial: {
        base: 0.18,
        peak: 0.23,
        offPeak: 0.14
      }
    },
    programs: {
      solar: {
        name: 'Municipal Solar Initiative',
        incentiveRate: 0.045,
        maxCapacity: 8,
        requirements: ['Chicopee residence', 'Property owner']
      },
      storage: {
        available: false
      }
    }
  },
  'FARMINGTON_RIVER': {
    name: 'Farmington River Power Company',
    color: '#9E9E9E',
    borderColor: '#616161',
    opacity: 0.4,
    serviceArea: 'Farmington River Valley',
    rates: {
      residential: {
        base: 0.20,
        peak: 0.25,
        offPeak: 0.16
      },
      commercial: {
        base: 0.17,
        peak: 0.22,
        offPeak: 0.13
      }
    },
    programs: {
      solar: {
        available: false
      },
      storage: {
        available: false
      }
    }
  },
  'CONNECTICUT_LIGHT': {
    name: 'Connecticut Light & Power Co',
    color: '#757575',
    borderColor: '#424242',
    opacity: 0.4,
    serviceArea: 'Northern Connecticut',
    rates: {
      residential: {
        base: 0.19,
        peak: 0.24,
        offPeak: 0.15
      },
      commercial: {
        base: 0.16,
        peak: 0.21,
        offPeak: 0.12
      }
    },
    programs: {
      solar: {
        name: 'CT Solar Home Program',
        incentiveRate: 0.04,
        maxCapacity: 10,
        requirements: ['Connecticut residence', 'Energy audit']
      },
      storage: {
        available: true,
        incentive: '$40/kW-year'
      }
    }
  }
}

// Helper function to validate GeoJSON data
const validateGeoJSON = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (data.type !== 'FeatureCollection') return false;
  if (!Array.isArray(data.features)) return false;
  return data.features.every(feature => 
    feature.type === 'Feature' &&
    feature.geometry &&
    feature.properties &&
    (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
  );
};

// Helper function to create mock data with actual coordinates
const createMockData = () => ({
  type: 'FeatureCollection',
  features: Object.entries(MA_UTILITIES).map(([id, data]) => ({
    type: 'Feature',
    geometry: data.geometry,
    properties: {
      id,
      ...data,
      stats: {
        totalCustomers: id === 'WESTERN_MASS_ELECTRIC' ? '210,000' :
                      id === 'MASS_ELECTRIC' ? '320,000' :
                      id === 'NSTAR' ? '450,000' :
                      id === 'CHICOPEE' ? '25,000' :
                      id === 'FARMINGTON_RIVER' ? '15,000' :
                      '280,000',
        avgBill: data.rates.residential.base * 750,
        solarAdoption: id === 'WESTERN_MASS_ELECTRIC' ? '14%' :
                     id === 'MASS_ELECTRIC' ? '12%' :
                     id === 'NSTAR' ? '15%' :
                     id === 'CHICOPEE' ? '8%' :
                     id === 'FARMINGTON_RIVER' ? '6%' :
                     '10%'
      }
    }
  }))
});

export const fetchUtilityData = async (bounds) => {
  const attempts = [
    {
      name: 'ArcGIS REST',
      fetch: async () => {
        const params = new URLSearchParams({
          where: '1=1',
          outFields: 'COMPANY,STATE',
          returnGeometry: 'true',
          f: 'geojson',
          spatialRel: 'esriSpatialRelIntersects',
          geometryType: 'esriGeometryEnvelope',
          geometry: JSON.stringify({
            xmin: bounds.west,
            ymin: bounds.south,
            xmax: bounds.east,
            ymax: bounds.north,
            spatialReference: { wkid: 4326 }
          })
        });
        
        return axios.get(`${ENDPOINTS.ARCGIS}?${params}`);
      }
    },
    {
      name: 'MassGIS WFS',
      fetch: async () => {
        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'GISDATA.UTILITYSERVICE_POLY',
          outputFormat: 'application/json',
          srsName: 'EPSG:4326',
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
        });
        
        return axios.get(`${ENDPOINTS.MASSGIS}?${params}`);
      }
    }
  ];

  let lastError = null;
  
  for (const attempt of attempts) {
    try {
      console.log(`Attempting to fetch utility data from ${attempt.name}...`);
      const response = await attempt.fetch();
      
      if (!response.data) {
        console.warn(`${attempt.name}: No data received`);
        continue;
      }

      if (!validateGeoJSON(response.data)) {
        console.warn(`${attempt.name}: Invalid GeoJSON data received`);
        continue;
      }

      console.log(`Successfully fetched utility data from ${attempt.name}`);
      
      // Transform the features with extended data
      const features = response.data.features.map(feature => {
        const utilityData = MA_UTILITIES[feature.properties.COMPANY];
        if (!utilityData) {
          console.warn(`Unknown utility company: ${feature.properties.COMPANY}`);
          return null;
        }

        return {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            ...feature.properties,
            name: utilityData.name,
            color: utilityData.color,
            borderColor: utilityData.borderColor,
            opacity: utilityData.opacity,
            serviceArea: utilityData.serviceArea,
            rates: utilityData.rates,
            programs: utilityData.programs
          }
        };
      }).filter(Boolean);

      return {
        type: 'FeatureCollection',
        features
      };
    } catch (error) {
      console.error(`Error fetching from ${attempt.name}:`, error);
      lastError = error;
    }
  }

  // If all attempts fail, fall back to mock data
  console.warn('All API attempts failed, falling back to mock data', lastError);
  handleApiError({ message: 'Failed to fetch utility data', status: lastError?.response?.status || 500, data: lastError?.response?.data }, 'Utility Data');
  
  const mockData = createMockData();
  console.log('Created mock data with', mockData.features.length, 'utility areas');
  
  return mockData;
};

// Helper function to get utility boundary style
export const getUtilityBoundaryStyle = (feature) => {
  return {
    fillColor: feature.properties.color || '#808080',
    color: feature.properties.borderColor || '#666666',
    weight: 2,
    opacity: 0.8,
    fillOpacity: feature.properties.opacity || 0.2
  };
};

// Helper function to format rate information
export const formatRate = (rate, type = 'currency') => {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(rate);
};

// Helper function to get program details
export const getProgramDetails = (utility, programType = 'solar') => {
  const program = utility.programs?.[programType];
  if (!program || !program.available) {
    return null;
  }
  return program;
}; 