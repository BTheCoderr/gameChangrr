import { BaseLayer } from './BaseLayer';
import { fetchDemographicData } from '../../../services/censusService';

export class DemographicsChoroplethLayer extends BaseLayer {
  constructor(map) {
    super(map);
    this.sourceId = 'demographics';
    this.layerIds = {
      fill: 'demographics-fill',
      line: 'demographics-line',
      label: 'demographics-label'
    };
    this.selectedMetric = 'medianIncome';
  }

  async initialize() {
    // Add source
    this.map.addSource(this.sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add fill layer
    this.map.addLayer({
      id: this.layerIds.fill,
      type: 'fill',
      source: this.sourceId,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', this.selectedMetric],
          0, '#FFEBEE',
          50000, '#FFCDD2',
          75000, '#EF9A9A',
          100000, '#E57373',
          150000, '#EF5350',
          200000, '#F44336'
        ],
        'fill-opacity': 0.7
      }
    });

    // Add line layer for boundaries
    this.map.addLayer({
      id: this.layerIds.line,
      type: 'line',
      source: this.sourceId,
      paint: {
        'line-color': '#9E9E9E',
        'line-width': 1,
        'line-opacity': 0.5
      }
    });

    // Add label layer
    this.map.addLayer({
      id: this.layerIds.label,
      type: 'symbol',
      source: this.sourceId,
      layout: {
        'text-field': ['number-format', ['get', this.selectedMetric], { 'min-fraction-digits': 0, 'max-fraction-digits': 0 }],
        'text-size': 12,
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#212121',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1
      }
    });

    // Add popup on hover
    this.map.on('mousemove', this.layerIds.fill, (e) => {
      if (e.features.length === 0) return;

      const feature = e.features[0];
      const coordinates = e.lngLat;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <h3>Census Tract ${feature.properties.tract}</h3>
          <p>
            <strong>Median Income:</strong> $${feature.properties.medianIncome.toLocaleString()}<br>
            <strong>Population:</strong> ${feature.properties.totalPopulation.toLocaleString()}<br>
            <strong>Median Age:</strong> ${feature.properties.medianAge}<br>
            <strong>Higher Education:</strong> ${(feature.properties.educationBachelorsOrHigher / feature.properties.totalPopulation * 100).toFixed(1)}%
          </p>
        `)
        .addTo(this.map);
    });

    // Change cursor on hover
    this.map.on('mouseenter', this.layerIds.fill, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.fill, () => {
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
      const data = await fetchDemographicData({
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
      console.error('Error loading demographic data:', error);
    }
  }

  setMetric(metric) {
    this.selectedMetric = metric;
    if (this.map.getLayer(this.layerIds.fill)) {
      this.map.setPaintProperty(this.layerIds.fill, 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', metric],
        ...this.getColorStops(metric)
      ]);
    }
  }

  getColorStops(metric) {
    switch (metric) {
      case 'medianIncome':
        return [0, '#FFEBEE', 50000, '#FFCDD2', 75000, '#EF9A9A', 100000, '#E57373', 150000, '#EF5350', 200000, '#F44336'];
      case 'medianAge':
        return [20, '#E3F2FD', 30, '#BBDEFB', 40, '#90CAF9', 50, '#64B5F6', 60, '#42A5F5', 70, '#2196F3'];
      case 'educationBachelorsOrHigher':
        return [0, '#F1F8E9', 0.2, '#DCEDC8', 0.4, '#C5E1A5', 0.6, '#AED581', 0.8, '#9CCC65', 1, '#8BC34A'];
      default:
        return [0, '#FFEBEE', 50000, '#FFCDD2', 75000, '#EF9A9A', 100000, '#E57373', 150000, '#EF5350', 200000, '#F44336'];
    }
  }
} 