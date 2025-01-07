import { BaseLayer } from './BaseLayer';
import { fetchEVStations } from '../../../services/evData';

export class EVStationsHeatmapLayer extends BaseLayer {
  constructor(map) {
    super(map);
    this.sourceId = 'ev-stations';
    this.layerIds = {
      heatmap: 'ev-stations-heat',
      circle: 'ev-stations-points'
    };
  }

  async initialize() {
    // Add source
    this.map.addSource(this.sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add heatmap layer
    this.map.addLayer({
      id: this.layerIds.heatmap,
      type: 'heatmap',
      source: this.sourceId,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'numChargers'],
          1, 0.5,
          8, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, '#2196F3',
          0.4, '#4CAF50',
          0.6, '#FFC107',
          0.8, '#FF9800',
          1, '#F44336'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        'heatmap-opacity': 0.7
      }
    });

    // Add circle layer for individual points at high zoom levels
    this.map.addLayer({
      id: this.layerIds.circle,
      type: 'circle',
      source: this.sourceId,
      minzoom: 11,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'numChargers'],
          1, 5,
          8, 15
        ],
        'circle-color': '#4CAF50',
        'circle-stroke-color': '#388E3C',
        'circle-stroke-width': 1,
        'circle-opacity': 0.8
      }
    });

    // Add popup on click
    this.map.on('click', this.layerIds.circle, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [this.layerIds.circle]
      });

      if (!features.length) return;

      const { properties } = features[0];
      const coordinates = features[0].geometry.coordinates.slice();

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <h3>${properties.name}</h3>
          <p>
            <strong>Chargers:</strong> ${properties.numChargers}<br>
            <strong>Network:</strong> ${properties.network}<br>
            <strong>Address:</strong> ${properties.address}, ${properties.city}, ${properties.state} ${properties.zip}
          </p>
        `)
        .addTo(this.map);
    });

    // Change cursor on hover
    this.map.on('mouseenter', this.layerIds.circle, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.circle, () => {
      this.map.getCanvas().style.cursor = '';
    });

    // Load initial data
    await this.loadData();

    // Set up data refresh on map move
    this.map.on('moveend', () => this.loadData());
  }

  async loadData() {
    try {
      const bounds = this.map.getBounds();
      const data = await fetchEVStations({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      const source = this.map.getSource(this.sourceId);
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error('Error loading EV station data:', error);
    }
  }
} 