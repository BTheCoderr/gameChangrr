import * as shapefile from 'shapefile'

export const loadParcelData = async (shpFile) => {
  try {
    const geojson = await shapefile.read(shpFile)
    return geojson
  } catch (error) {
    console.error('Error loading parcel data:', error)
    throw error
  }
}

// Function to fetch from Mass GIS ArcGIS REST API
export const fetchMassGISParcels = async (bounds) => {
  try {
    const response = await fetch(
      `https://massgis.maps.arcgis.com/sharing/rest/content/items/af341365e61f43c7b94527470e4c3ad0/data`, 
      {
        method: 'POST',
        body: JSON.stringify({
          f: 'geojson',
          geometry: {
            xmin: bounds.getWest(),
            ymin: bounds.getSouth(),
            xmax: bounds.getEast(),
            ymax: bounds.getNorth(),
            spatialReference: { wkid: 4326 }
          },
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*'
        })
      }
    )

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching MassGIS parcels:', error)
    throw error
  }
}

// Function to style parcels based on their attributes
export const getParcelStyle = (feature) => {
  const hasBuilding = feature.properties.BLDG_VALUE > 0;
  
  return {
    color: hasBuilding ? '#000000' : '#666666',
    weight: hasBuilding ? 2 : 1,
    opacity: hasBuilding ? 0.8 : 0.5,
    fillOpacity: 0.1,
    fillColor: getParcelFillColor(feature.properties),
    dashArray: hasBuilding ? null : '2'
  }
}

// Helper function to determine fill color based on property attributes
const getParcelFillColor = (properties) => {
  const useCode = properties.USE_CODE;
  // Standard Mass Land Use Codes
  if (useCode >= 101 && useCode <= 109) return '#FFE4E1'; // Single family
  if (useCode >= 110 && useCode <= 119) return '#FFA07A'; // Two/Three family
  if (useCode >= 120 && useCode <= 125) return '#FA8072'; // Multi-family
  if (useCode >= 300 && useCode <= 399) return '#87CEEB'; // Commercial
  if (useCode >= 400 && useCode <= 499) return '#DEB887'; // Industrial
  return '#DCDCDC'; // Default gray
}

// Function to format parcel popup content
export const formatParcelPopup = (properties) => {
  const formatMoney = (val) => val ? '$' + val.toLocaleString() : 'N/A';
  const formatArea = (sqft) => sqft ? (sqft / 43560).toFixed(2) + ' acres' : 'N/A';
  
  return `
    <div style="min-width: 200px;">
      <h4 style="margin: 0 0 8px 0;">${properties.ADDRESS || 'No Address'}</h4>
      <div style="margin-bottom: 8px;">
        <strong>Parcel ID:</strong> ${properties.PARCEL_ID || 'N/A'}<br>
        <strong>Owner:</strong> ${properties.OWNER1 || 'N/A'}<br>
        <strong>Land Use:</strong> ${properties.USE_DESC || 'N/A'}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Building Info:</strong><br>
        • Year Built: ${properties.YEAR_BUILT || 'N/A'}<br>
        • Living Area: ${properties.LIVING_AREA ? properties.LIVING_AREA.toLocaleString() + ' sq ft' : 'N/A'}<br>
        • Style: ${properties.STYLE_DESC || 'N/A'}<br>
        • Stories: ${properties.NUM_STORIES || 'N/A'}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Assessment:</strong><br>
        • Total: ${formatMoney(properties.TOTAL_VAL)}<br>
        • Building: ${formatMoney(properties.BLDG_VALUE)}<br>
        • Land: ${formatMoney(properties.LAND_VALUE)}
      </div>
      <div>
        <strong>Lot Size:</strong> ${formatArea(properties.LOT_SIZE)}<br>
        <strong>Last Sale:</strong> ${formatMoney(properties.SALE_PRICE)} (${properties.SALE_DATE || 'N/A'})
      </div>
    </div>
  `
}

// Function to search parcels by address or parcel ID
export const searchParcels = async (searchTerm) => {
  try {
    const response = await fetch(
      `https://massgis.maps.arcgis.com/sharing/rest/content/items/af341365e61f43c7b94527470e4c3ad0/data/search`, 
      {
        method: 'POST',
        body: JSON.stringify({
          f: 'json',
          searchText: searchTerm,
          outFields: '*',
          returnGeometry: true,
          maxResults: 10
        })
      }
    );
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error searching parcels:', error);
    return [];
  }
}

// Function to download parcel data for a selected area
export const downloadParcelData = async (bounds, format = 'geojson') => {
  try {
    const data = await fetchMassGISParcels(bounds);
    
    if (format === 'csv') {
      return convertToCSV(data.features);
    }
    
    // For GeoJSON, return as is
    return data;
  } catch (error) {
    console.error('Error downloading parcel data:', error);
    throw error;
  }
}

// Helper function to convert GeoJSON to CSV
const convertToCSV = (features) => {
  if (!features || features.length === 0) return '';
  
  const headers = Object.keys(features[0].properties);
  const rows = features.map(feature => 
    headers.map(header => feature.properties[header]).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// GIS utility functions for Mapbox GL JS

export const validateGeoJSON = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (data.type !== 'FeatureCollection' && data.type !== 'Feature') return false;
  if (data.type === 'FeatureCollection' && !Array.isArray(data.features)) return false;
  return true;
};

export const transformGeoJSON = (data) => {
  if (!validateGeoJSON(data)) {
    console.error('Invalid GeoJSON data:', data);
    return null;
  }
  return data;
};

export const getBounds = (geojson) => {
  if (!validateGeoJSON(geojson)) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];

  features.forEach(feature => {
    if (!feature.geometry) return;

    const coords = feature.geometry.coordinates;
    if (!coords) return;

    const processCoords = (coord) => {
      const [lng, lat] = coord;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    };

    switch (feature.geometry.type) {
      case 'Point':
        processCoords(coords);
        break;
      case 'LineString':
      case 'MultiPoint':
        coords.forEach(processCoords);
        break;
      case 'Polygon':
      case 'MultiLineString':
        coords.forEach(line => line.forEach(processCoords));
        break;
      case 'MultiPolygon':
        coords.forEach(poly => poly.forEach(line => line.forEach(processCoords)));
        break;
    }
  });

  return [[minLng, minLat], [maxLng, maxLat]];
}; 