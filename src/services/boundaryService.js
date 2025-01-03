import axios from 'axios';
import cityBoundaries from '../data/ma-boundaries.json';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MASSGIS_REST_ENDPOINT = 'https://gis-prod.digital.mass.gov/geoserver/wfs';

// Fetch city boundaries for Massachusetts
export const fetchCityBoundaries = async () => {
  try {
    if (!cityBoundaries || !cityBoundaries.cities) {
      throw new Error('Invalid city boundaries data');
    }
    
    // Transform the data into GeoJSON format
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

// Fetch neighborhood boundaries
export const fetchNeighborhoodBoundaries = async (cityName = 'Springfield') => {
  try {
    // MassGIS WFS parameters for neighborhood boundaries
    const params = {
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'massgis:GISDATA.NEIGHBORHOODS_POLY',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      cql_filter: `CITY='${cityName.toUpperCase()}'`
    };

    console.log('Fetching neighborhood data for', cityName);
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${MASSGIS_REST_ENDPOINT}?${queryString}`);

    if (!response.data || !response.data.features) {
      throw new Error('Invalid response from MassGIS');
    }

    // Transform the data into our GeoJSON format
    const features = response.data.features.map(feature => ({
      type: 'Feature',
      properties: {
        name: feature.properties.name || feature.properties.NAME || 'Unknown Neighborhood',
        type: 'neighborhood',
        city: cityName,
        population: feature.properties.population || null,
        area: feature.properties.shape_area || null
      },
      geometry: feature.geometry
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error in fetchNeighborhoodBoundaries:', error);
    // Return empty feature collection on error
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

// Style configurations for different boundary types
export const getBoundaryStyle = (type, isHighlighted = false) => {
  const styles = {
    city: {
      color: isHighlighted ? '#FFA500' : '#666',
      weight: 2,
      opacity: 1,
      fillColor: isHighlighted ? '#FFA500' : '#666',
      fillOpacity: isHighlighted ? 0.35 : 0.1
    },
    neighborhood: {
      color: '#4ECDC4',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.1,
      dashArray: '3'
    },
    default: {
      color: '#666',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.1
    }
  };

  return styles[type] || styles.default;
};