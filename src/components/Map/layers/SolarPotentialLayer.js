import { BaseLayer } from './BaseLayer';
import { fetchOpenPVData, getSolarStats } from '../../../services/nrelService';
import { LAYER_STYLES, POPUP_CONFIG } from '../../../config/mapStyles';
import mapboxgl from 'mapbox-gl';

export class SolarPotentialLayer extends BaseLayer {
  constructor(map) {
    super(map);
    this.sourceId = 'solar-potential';
    this.layerIds = {
      fill: 'solar-potential-fill',
      line: 'solar-potential-line',
      points: 'solar-installations'
    };
  }

  async initialize() {
    // Add source for solar potential areas
    this.map.addSource(this.sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add fill layer for solar potential
    this.map.addLayer({
      id: this.layerIds.fill,
      type: 'fill',
      source: this.sourceId,
      paint: LAYER_STYLES.solarPotential.fill
    });

    // Add line layer for boundaries
    this.map.addLayer({
      id: this.layerIds.line,
      type: 'line',
      source: this.sourceId,
      paint: LAYER_STYLES.solarPotential.line
    });

    // Add points layer for existing installations
    this.map.addLayer({
      id: this.layerIds.points,
      type: 'circle',
      source: this.sourceId,
      filter: ['has', 'systemSize'],
      paint: LAYER_STYLES.permits.circle
    });

    // Add hover effect for points
    this.map.on('mousemove', this.layerIds.points, (e) => {
      if (e.features.length === 0) return;

      const feature = e.features[0];
      const coordinates = e.lngLat;

      // Show popup
      const popup = new mapboxgl.Popup(POPUP_CONFIG)
        .setLngLat(coordinates)
        .setHTML(`
          <div class="popup-content">
            <h3>Solar Installation</h3>
            <div class="popup-section">
              <p>
                <strong>System Size:</strong> ${feature.properties.systemSize.toFixed(1)} kW<br>
                <strong>Annual Generation:</strong> ${feature.properties.annualGeneration.toLocaleString()} kWh<br>
                <strong>Installation Date:</strong> ${new Date(feature.properties.installationDate).toLocaleDateString()}<br>
                <strong>Module Type:</strong> ${feature.properties.moduleType}<br>
                <strong>Array Type:</strong> ${feature.properties.arrayType}<br>
                <strong>Efficiency:</strong> ${feature.properties.efficiency}%
              </p>
            </div>
          </div>
        `)
        .addTo(this.map);

      // Store the popup to remove it later
      this.activePopup = popup;
    });

    // Add hover effect for fill areas
    this.map.on('mousemove', this.layerIds.fill, (e) => {
      if (e.features.length === 0) return;

      const feature = e.features[0];
      const coordinates = e.lngLat;

      // Show popup
      const popup = new mapboxgl.Popup(POPUP_CONFIG)
        .setLngLat(coordinates)
        .setHTML(`
          <div class="popup-content">
            <h3>Solar Potential</h3>
            <div class="popup-section">
              <p>
                <strong>Annual Generation:</strong> ${feature.properties.annualGeneration.toLocaleString()} kWh<br>
                <strong>Area:</strong> ${feature.properties.area.toLocaleString()} sq ft<br>
                <strong>Potential Score:</strong> ${(feature.properties.potentialScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        `)
        .addTo(this.map);

      // Store the popup to remove it later
      this.activePopup = popup;
    });

    // Change cursor on hover
    this.map.on('mouseenter', this.layerIds.points, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.points, () => {
      this.map.getCanvas().style.cursor = '';
      if (this.activePopup) {
        this.activePopup.remove();
        this.activePopup = null;
      }
    });

    this.map.on('mouseenter', this.layerIds.fill, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.fill, () => {
      this.map.getCanvas().style.cursor = '';
      if (this.activePopup) {
        this.activePopup.remove();
        this.activePopup = null;
      }
    });

    // Load initial data
    await this.loadData();

    // Set up data refresh on map move
    this.map.on('moveend', () => this.loadData());
  }

  async loadData() {
    try {
      const bounds = this.map.getBounds();
      const data = await fetchOpenPVData({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      const source = this.map.getSource(this.sourceId);
      if (source) {
        source.setData(data);
      }

      // Update stats if needed
      const stats = await getSolarStats({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      // You can emit an event or use a callback to update UI with stats
      if (this.onStatsUpdate) {
        this.onStatsUpdate(stats);
      }
    } catch (error) {
      console.error('Error loading solar potential data:', error);
    }
  }
} 