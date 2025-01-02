import axios from 'axios'

export async function fetchNeighborhoodBoundaries({ minLat, maxLat, minLng, maxLng }) {
  try {
    console.log('Fetching neighborhood boundaries for:', { minLat, maxLat, minLng, maxLng });
    
    // Build the bounding box string in the format expected by the API
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    
    const response = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tract_Boundaries_2020/FeatureServer/0/query', {
      params: {
        where: '1=1',
        outFields: '*',
        geometry: bbox,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        f: 'geojson'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data features:', response.data.features?.length || 0);

    if (!response.data.features || response.data.features.length === 0) {
      console.log('No features found in the response');
      return { type: 'FeatureCollection', features: [] };
    }

    const features = response.data.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        name: `Census Tract ${feature.properties.TRACTCE || 'Unknown'}`,
        type: 'block_group',
        source: 'Census Bureau',
        population: feature.properties.POP100 || 0,
        median_income: 0,
        homeownership: 0,
        avgHomeValue: 0
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error fetching neighborhood boundaries:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

export async function fetchZipCodeBoundaries({ minLat, maxLat, minLng, maxLng }) {
  try {
    console.log('Fetching ZIP code boundaries for:', { minLat, maxLat, minLng, maxLng });
    
    // Build the bounding box string in the format expected by the API
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    
    const response = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_ZIP_Code_Boundaries_2020/FeatureServer/0/query', {
      params: {
        where: '1=1',
        outFields: '*',
        geometry: bbox,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        f: 'geojson'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data features:', response.data.features?.length || 0);

    if (!response.data.features || response.data.features.length === 0) {
      console.log('No features found in the response');
      return { type: 'FeatureCollection', features: [] };
    }

    const features = response.data.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        name: `ZIP Code ${feature.properties.ZCTA5CE20 || 'Unknown'}`,
        type: 'zipcode',
        source: 'Census Bureau',
        population: feature.properties.POP100 || 0,
        median_income: 0,
        homeownership: 0,
        avgHomeValue: 0
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error fetching ZIP code boundaries:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
} 