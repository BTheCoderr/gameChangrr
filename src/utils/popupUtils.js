import { POPUP_CONFIG } from '../config/mapStyles';
import mapboxgl from 'mapbox-gl';

const formatNumber = (num) => {
  return num ? num.toLocaleString() : 'N/A';
};

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'N/A';
};

const formatCurrency = (amount) => {
  return amount ? `$${amount.toLocaleString()}` : 'N/A';
};

const formatPercent = (value) => {
  return value ? `${(value * 100).toFixed(1)}%` : 'N/A';
};

export const createPopup = (feature, lngLat, layerType) => {
  let content = '';

  switch (layerType) {
    case 'utility':
      content = `
        <div class="popup-content">
          <h3>${feature.properties.utilityName}</h3>
          <div class="popup-section">
            <p>
              <strong>Service Area:</strong> ${feature.properties.serviceArea}<br>
              <strong>Solar Rate:</strong> ${formatCurrency(feature.properties.solarRate)}/kWh<br>
              <strong>Net Metering Cap:</strong> ${formatPercent(feature.properties.netMeteringCap)}<br>
              <strong>Solar Installations:</strong> ${formatNumber(feature.properties.solarInstallations)}
            </p>
          </div>
        </div>
      `;
      break;

    case 'solarPotential':
      content = `
        <div class="popup-content">
          <h3>Solar Potential</h3>
          <div class="popup-section">
            <p>
              <strong>Annual Generation:</strong> ${formatNumber(feature.properties.annualGeneration)} kWh<br>
              <strong>Area:</strong> ${formatNumber(feature.properties.area)} sq ft<br>
              <strong>Potential Score:</strong> ${formatPercent(feature.properties.potentialScore)}
            </p>
          </div>
        </div>
      `;
      break;

    case 'solarInstallation':
      content = `
        <div class="popup-content">
          <h3>Solar Installation</h3>
          <div class="popup-section">
            <p>
              <strong>System Size:</strong> ${feature.properties.systemSize.toFixed(1)} kW<br>
              <strong>Annual Generation:</strong> ${formatNumber(feature.properties.annualGeneration)} kWh<br>
              <strong>Installation Date:</strong> ${formatDate(feature.properties.installationDate)}<br>
              <strong>Module Type:</strong> ${feature.properties.moduleType}<br>
              <strong>Array Type:</strong> ${feature.properties.arrayType}<br>
              <strong>Efficiency:</strong> ${formatPercent(feature.properties.efficiency)}
            </p>
          </div>
        </div>
      `;
      break;

    case 'property':
      content = `
        <div class="popup-content">
          <h3>Property Details</h3>
          <div class="popup-section">
            <p>
              <strong>Address:</strong> ${feature.properties.address}<br>
              <strong>Property Type:</strong> ${feature.properties.propertyType}<br>
              <strong>Year Built:</strong> ${feature.properties.yearBuilt}<br>
              <strong>Square Footage:</strong> ${formatNumber(feature.properties.squareFootage)} sq ft<br>
              <strong>Roof Area:</strong> ${formatNumber(feature.properties.roofArea)} sq ft<br>
              <strong>Roof Type:</strong> ${feature.properties.roofType}<br>
              <strong>Solar Potential Score:</strong> ${formatPercent(feature.properties.solarPotential.score)}
            </p>
          </div>
        </div>
      `;
      break;

    default:
      content = `
        <div class="popup-content">
          <h3>Information</h3>
          <div class="popup-section">
            <p>No details available</p>
          </div>
        </div>
      `;
  }

  return new mapboxgl.Popup(POPUP_CONFIG)
    .setLngLat(lngLat)
    .setHTML(content);
};

export const addPopupToLayer = (map, layerId, layerType) => {
  let popup = null;

  map.on('mousemove', layerId, (e) => {
    if (e.features.length === 0) return;

    // Remove existing popup
    if (popup) {
      popup.remove();
    }

    // Create new popup
    popup = createPopup(e.features[0], e.lngLat, layerType);
    popup.addTo(map);
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
    if (popup) {
      popup.remove();
      popup = null;
    }
  });

  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
}; 