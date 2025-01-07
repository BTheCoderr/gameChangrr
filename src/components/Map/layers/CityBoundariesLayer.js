import mapboxgl from 'mapbox-gl';
import { fetchCityBoundaries } from '../../../services/boundaryService';

export class CityBoundariesLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'city-boundaries';
    this.layerId = 'city-boundaries-layer';
    this.visible = false;
    console.log('CityBoundariesLayer constructed');
  }

  initialize() {
    console.log('Initializing CityBoundariesLayer');
    try {
      // Add source
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      console.log('Added source:', this.sourceId);

      // Add fill layer
      this.map.addLayer({
        id: this.layerId,
        type: 'fill',
        source: this.sourceId,
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-color': '#4A90E2',
          'fill-opacity': 0.1,
          'fill-outline-color': '#4A90E2'
        }
      });

      // Add outline layer
      this.map.addLayer({
        id: `${this.layerId}-outline`,
        type: 'line',
        source: this.sourceId,
        layout: {
          visibility: 'none'
        },
        paint: {
          'line-color': '#2196F3',
          'line-width': 3,
          'line-opacity': 0.9
        }
      });

      // Add interactions
      this.addInteractions();
      console.log('CityBoundariesLayer initialized successfully');
    } catch (error) {
      console.error('Error initializing CityBoundariesLayer:', error);
    }
  }

  addInteractions() {
    // Hover effect
    this.map.on('mouseenter', this.layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
      
      // Highlight the hovered city
      if (this.map.getLayer(`${this.layerId}-hover`)) {
        this.map.removeLayer(`${this.layerId}-hover`);
      }
      
      this.map.addLayer({
        id: `${this.layerId}-hover`,
        type: 'fill',
        source: this.sourceId,
        filter: ['==', ['id'], ['get', 'id', ['properties', ['feature-state', 'hover']]]],
        paint: {
          'fill-color': '#FFA000',
          'fill-opacity': 0.3
        }
      });
    });

    this.map.on('mouseleave', this.layerId, () => {
      this.map.getCanvas().style.cursor = '';
      
      // Remove highlight
      if (this.map.getLayer(`${this.layerId}-hover`)) {
        this.map.removeLayer(`${this.layerId}-hover`);
      }
    });

    // Click handling
    this.map.on('click', this.layerId, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        this.showPopup(feature);
      }
    });
  }

  showPopup(feature) {
    const coordinates = feature.geometry.coordinates[0][0].slice();
    const { properties } = feature;

    const popupContent = `
      <div class="custom-popup">
        <h4>${properties.name || 'City'}</h4>
        <div class="popup-details">
          ${properties.population ? `
            <div class="popup-detail">
              <span class="label">Population:</span>
              <span class="value">${properties.population.toLocaleString()}</span>
            </div>
          ` : ''}
          ${properties.region ? `
            <div class="popup-detail">
              <span class="label">Region:</span>
              <span class="value">${properties.region}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(this.map);
  }

  async loadData(bounds, filters = {}) {
    console.log('CityBoundariesLayer.loadData: Starting data load');
    if (!this.visible) {
      console.log('CityBoundariesLayer: Layer not visible, skipping data load');
      return;
    }

    try {
      console.log('CityBoundariesLayer: Fetching data with bounds:', bounds);
      const data = await fetchCityBoundaries();
      
      console.log('CityBoundariesLayer: Received data:', data);
      console.log('CityBoundariesLayer: Number of features:', data.features?.length || 0);

      const source = this.map.getSource(this.sourceId);
      if (source) {
        console.log('CityBoundariesLayer: Updating source with new data');
        source.setData(data);
        console.log('CityBoundariesLayer: Source updated successfully');
      } else {
        console.warn('CityBoundariesLayer: Source not found:', this.sourceId);
      }
    } catch (error) {
      console.error('CityBoundariesLayer: Error loading data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  }

  setFilter(filters) {
    if (!this.map.getLayer(this.layerId)) return;

    const filterArray = ['all'];

    if (filters.region && filters.region !== 'all') {
      filterArray.push(['==', ['get', 'region'], filters.region]);
    }

    if (filters.minPopulation) {
      filterArray.push(['>=', ['get', 'population'], filters.minPopulation]);
    }

    if (filters.maxPopulation) {
      filterArray.push(['<=', ['get', 'population'], filters.maxPopulation]);
    }

    const layers = [this.layerId, `${this.layerId}-outline`];
    layers.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.setFilter(layerId, filterArray.length > 1 ? filterArray : null);
      }
    });
  }

  setVisibility(visible) {
    console.log('setVisibility called with:', visible);
    this.visible = visible;
    
    const layers = [this.layerId, `${this.layerId}-outline`];
    layers.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        console.log(`Setting ${layerId} visibility to:`, visible ? 'visible' : 'none');
        this.map.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        );
      } else {
        console.warn('Layer not found:', layerId);
      }
    });

    if (visible) {
      console.log('Layer visible, loading data');
      this.loadData(this.map.getBounds());
    }
  }

  remove() {
    const layers = [
      this.layerId,
      `${this.layerId}-outline`,
      `${this.layerId}-hover`
    ];

    layers.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }
  }
} 