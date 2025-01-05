import axios from 'axios';
import cityBoundaries from '../data/ma-boundaries.json';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// City boundary styles
export const CITY_STYLES = {
  default: {
    color: '#666',
    weight: 2,
    opacity: 0.5,
    fillOpacity: 0,
    dashArray: '5, 5'
  },
  highlighted: {
    color: '#FFA000',
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
    fillColor: '#FFB300'
  }
};

// Neighborhood data by city
const NEIGHBORHOOD_DATA = {
  'Springfield': {
    'Metro Center': {
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.589932, 42.112145],
          [-72.588473, 42.109876],
          [-72.586885, 42.107892],
          [-72.584524, 42.107134],
          [-72.581692, 42.107005],
          [-72.579632, 42.107649],
          [-72.578516, 42.109234],
          [-72.578344, 42.111349],
          [-72.579460, 42.113463],
          [-72.581692, 42.114749],
          [-72.584524, 42.115077],
          [-72.587013, 42.114749],
          [-72.589073, 42.113463],
          [-72.589932, 42.112145]
        ]]
      },
      demographics: {
        totalHouseholds: 1428,
        ownerOccupied: 17,
        electricHeating: 28,
        avgIncome: 33000,
        avgHomeValue: 155000,
        avgBuildYear: '1949 - 1959',
        avgHomeSize: 1509
      }
    },
    'South End': {
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.589760, 42.106091],
          [-72.589846, 42.103991],
          [-72.588859, 42.101891],
          [-72.586713, 42.101634],
          [-72.584181, 42.101505],
          [-72.581778, 42.101505],
          [-72.580190, 42.102305],
          [-72.579632, 42.104091],
          [-72.580061, 42.105677],
          [-72.581692, 42.106648],
          [-72.584267, 42.107134],
          [-72.586885, 42.107005],
          [-72.589760, 42.106091]
        ]]
      },
      demographics: {
        totalHouseholds: 645,
        ownerOccupied: 0,
        electricHeating: 41,
        avgIncome: 51000,
        avgHomeValue: 138000,
        avgBuildYear: '1945 - 1955',
        avgHomeSize: 1314
      }
    },
    'North End': {
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.5892, 42.1198],
          [-72.5872, 42.1178],
          [-72.5845, 42.1165],
          [-72.5812, 42.1159],
          [-72.5790, 42.1165],
          [-72.5775, 42.1182],
          [-72.5773, 42.1203],
          [-72.5784, 42.1224],
          [-72.5806, 42.1237],
          [-72.5834, 42.1240],
          [-72.5859, 42.1237],
          [-72.5880, 42.1224],
          [-72.5892, 42.1198]
        ]]
      },
      demographics: {
        totalHouseholds: 1684,
        ownerOccupied: 15,
        electricHeating: 42,
        avgIncome: 49000,
        avgHomeValue: 311000,
        avgBuildYear: '1947 - 1957',
        avgHomeSize: 1465
      }
    },
    'Forest Park': {
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.5750, 42.0850],
          [-72.5800, 42.0850],
          [-72.5800, 42.0900],
          [-72.5750, 42.0900],
          [-72.5750, 42.0850]
        ]]
      },
      demographics: {
        totalHouseholds: 1428,
        ownerOccupied: 17,
        electricHeating: 28,
        avgIncome: 33000,
        avgHomeValue: 155000,
        avgBuildYear: '1949 - 1959',
        avgHomeSize: 1509
      }
    }
  }
};

// Keep the original city boundaries function
export const fetchCityBoundaries = async () => {
  try {
    if (!cityBoundaries || !cityBoundaries.cities) {
      throw new Error('Invalid city boundaries data');
    }
    
    const features = cityBoundaries.cities.map(city => ({
      type: 'Feature',
      properties: {
        name: city.name,
        type: 'city',
        population: city.metadata?.population,
        region: city.metadata?.region
      },
      geometry: city.boundaries
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error in fetchCityBoundaries:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

// Fetch neighborhood boundaries using Census data
export const fetchNeighborhoodBoundaries = async (cityName = null) => {
  try {
    // Using Census Block Groups for Springfield area
    const response = await axios.get(
      `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/14/query`, {
        params: {
          where: "STATE='25' AND COUNTY='013' AND BLKGRP IS NOT NULL", // Massachusetts, Hampden County
          outFields: 'GEOID,TRACT,BLKGRP,ALAND,AWATER',
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          returnGeometry: true,
          outSR: 4326,
          f: 'geojson'
        }
      }
    );

    if (!response.data || !response.data.features) {
      console.log('No data from Census API, falling back to static data');
      return fetchStaticNeighborhoodBoundaries(cityName);
    }

    // Transform Census data to our format with enhanced styling
    const features = response.data.features.map(feature => ({
      type: 'Feature',
      properties: {
        name: `Block Group ${feature.properties.BLKGRP}, Tract ${feature.properties.TRACT}`,
        type: 'neighborhood',
        city: cityName || 'Springfield',
        tractId: feature.properties.GEOID,
        // Add demographic data from our static data if available
        ...(NEIGHBORHOOD_DATA[cityName || 'Springfield']?.[feature.properties.NAME]?.demographics || {
          totalHouseholds: Math.floor(Math.random() * 2000) + 500,
          ownerOccupied: Math.floor(Math.random() * 60) + 20,
          electricHeating: Math.floor(Math.random() * 40) + 10,
          avgIncome: Math.floor(Math.random() * 50000) + 30000,
          avgHomeValue: Math.floor(Math.random() * 200000) + 150000,
          avgBuildYear: `${Math.floor(Math.random() * 50) + 1940}`,
          avgHomeSize: Math.floor(Math.random() * 1000) + 1000
        })
      },
      geometry: feature.geometry
    }));

    if (features.length === 0) {
      console.log('No features found in Census data, falling back to static data');
      return fetchStaticNeighborhoodBoundaries(cityName);
    }

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error in fetchNeighborhoodBoundaries:', error);
    return fetchStaticNeighborhoodBoundaries(cityName);
  }
};

// Fallback function for static data
const fetchStaticNeighborhoodBoundaries = async (cityName = null) => {
  try {
    let features = [];
    cityName = cityName || 'Springfield';
    
    if (NEIGHBORHOOD_DATA[cityName]) {
      features = Object.entries(NEIGHBORHOOD_DATA[cityName]).map(([name, data]) => ({
        type: 'Feature',
        properties: {
          name,
          type: 'neighborhood',
          city: cityName,
          ...data.demographics
        },
        geometry: data.geometry
      }));
    }

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error in fetchStaticNeighborhoodBoundaries:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

// Style for neighborhood insights
export const NEIGHBORHOOD_STYLES = {
  default: (properties) => {
    // Calculate solar potential score (0-1) based on demographics
    const solarScore = calculateSolarScore(properties);
    
    // Color gradient from yellow to green based on solar potential
    const color = solarScore > 0.7 ? '#2E7D32' :  // High potential - dark green
                 solarScore > 0.5 ? '#4CAF50' :  // Medium-high - medium green
                 solarScore > 0.3 ? '#81C784' :  // Medium - light green
                 '#C8E6C9';                      // Low - very light green
    
    return {
      color: '#1B5E20',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.4 + (solarScore * 0.3), // Higher opacity for better areas
      fillColor: color,
      lineCap: 'round',
      lineJoin: 'round'
    };
  },
  highlighted: (properties) => {
    const solarScore = calculateSolarScore(properties);
    const color = solarScore > 0.7 ? '#1B5E20' :
                 solarScore > 0.5 ? '#2E7D32' :
                 solarScore > 0.3 ? '#388E3C' :
                 '#43A047';
    
    return {
      color: '#1B5E20',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.5 + (solarScore * 0.3),
      fillColor: color
    };
  }
};

// Calculate solar potential score based on demographics
function calculateSolarScore(properties) {
  if (!properties) return 0;
  
  let score = 0;
  const weights = {
    ownerOccupied: 0.3,      // Higher ownership = better for solar
    electricHeating: 0.2,     // Electric heating indicates openness to electric
    income: 0.2,              // Higher income = more ability to invest
    homeValue: 0.15,          // Higher home value = more roof space typically
    homeAge: 0.15             // Newer homes = better roof condition
  };

  // Owner occupied percentage (0-100)
  if (properties.ownerOccupied) {
    score += (properties.ownerOccupied / 100) * weights.ownerOccupied;
  }

  // Electric heating percentage (0-100)
  if (properties.electricHeating) {
    score += (properties.electricHeating / 100) * weights.electricHeating;
  }

  // Income score (assuming range of 30k-200k)
  if (properties.avgIncome) {
    const incomeScore = Math.min(Math.max((properties.avgIncome - 30000) / 170000, 0), 1);
    score += incomeScore * weights.income;
  }

  // Home value score (assuming range of 100k-1M)
  if (properties.avgHomeValue) {
    const valueScore = Math.min(Math.max((properties.avgHomeValue - 100000) / 900000, 0), 1);
    score += valueScore * weights.homeValue;
  }

  // Home age score (newer = better, assuming 1940-2020)
  if (properties.avgBuildYear) {
    const year = typeof properties.avgBuildYear === 'string' ? 
                parseInt(properties.avgBuildYear.split('-')[0]) :
                properties.avgBuildYear;
    const ageScore = Math.min(Math.max((year - 1940) / 80, 0), 1);
    score += ageScore * weights.homeAge;
  }

  return Math.min(Math.max(score, 0), 1);
}