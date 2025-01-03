import L from 'leaflet';

// Function to create solar installations layer
export const createSolarInstallationsLayer = (map) => {
  // Example data - replace with real API call
  const solarInstallations = [
    { lat: 42.1015, lng: -72.5898, size: '5kW', date: '2023-01-01' },
    { lat: 42.1115, lng: -72.5798, size: '7kW', date: '2023-02-15' }
  ];

  const layerGroup = L.layerGroup();

  solarInstallations.forEach(installation => {
    const marker = L.circleMarker([installation.lat, installation.lng], {
      radius: 8,
      fillColor: '#FFC107',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });

    marker.bindPopup(`
      <div>
        <h3>Solar Installation</h3>
        <p>Size: ${installation.size}</p>
        <p>Date: ${installation.date}</p>
      </div>
    `);

    layerGroup.addLayer(marker);
  });

  return layerGroup;
};

// Function to create solar potential layer
export const createSolarPotentialLayer = (map) => {
  // Example data - replace with real API call
  const potentialAreas = [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.5898, 42.1015],
          [-72.5898, 42.1115],
          [-72.5798, 42.1115],
          [-72.5798, 42.1015],
          [-72.5898, 42.1015]
        ]]
      },
      properties: {
        potential: 'High',
        annualSunHours: 2000
      }
    }
  ];

  const layerGroup = L.layerGroup();

  L.geoJSON(potentialAreas, {
    style: {
      color: '#FF9800',
      weight: 2,
      opacity: 0.6,
      fillOpacity: 0.2
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`
        <div>
          <h3>Solar Potential</h3>
          <p>Potential: ${feature.properties.potential}</p>
          <p>Annual Sun Hours: ${feature.properties.annualSunHours}</p>
        </div>
      `);
    }
  }).addTo(layerGroup);

  return layerGroup;
};

// Add more layer creation functions as needed
export const createPropertyBoundariesLayer = (map) => {
  // Implementation for property boundaries
  return L.layerGroup();
};

export const createSolarPermitsLayer = (map) => {
  // Implementation for solar permits
  return L.layerGroup();
};

export const createNeighborhoodInsightsLayer = (map) => {
  // Implementation for neighborhood insights
  return L.layerGroup();
};

// Function to initialize all layers
export const initializeLayers = (map) => {
  return {
    solarInstallations: createSolarInstallationsLayer(map),
    solarPotential: createSolarPotentialLayer(map),
    propertyBoundaries: createPropertyBoundariesLayer(map),
    solarPermits: createSolarPermitsLayer(map),
    neighborhoodInsights: createNeighborhoodInsightsLayer(map),
    // Add more layers as needed
  };
};