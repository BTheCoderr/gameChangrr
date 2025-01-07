import mapboxgl from 'mapbox-gl';
import { fetchMoveIns } from '../../../services/gamechangrrService';

export class MoveInsLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'move-ins';
    this.layerId = 'move-ins-layer';
    this.visible = false;
    this.clusterConfig = {
      radius: 50,
      maxZoom: 14,
      minPoints: 2,
      extent: 512,
      nodeSize: 64
    };
  }

  initialize() {
    console.log('Initializing MoveInsLayer');
    try {
      // Add custom icon image
      this.map.loadImage('/assets/icons/home-marker.png', (error, image) => {
        if (error) throw error;
        if (!this.map.hasImage('home-marker')) {
          this.map.addImage('home-marker', image);
        }
      });

      // Add source with optimized clustering
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: this.clusterConfig.maxZoom,
        clusterRadius: this.clusterConfig.radius,
        clusterProperties: {
          // Count property types in clusters
          singleFamilyCount: [
            '+',
            ['case', ['==', ['get', 'propertyType'], 'Single Family'], 1, 0]
          ],
          multiFamilyCount: [
            '+',
            ['case', ['==', ['get', 'propertyType'], 'Multi Family'], 1, 0]
          ],
          condoCount: [
            '+',
            ['case', ['==', ['get', 'propertyType'], 'Condo'], 1, 0]
          ],
          // Average price in cluster
          totalPrice: ['+', ['get', 'price']],
          priceCount: ['+', 1]
        },
        maxzoom: 16
      });

      // Add cluster layer with enhanced styling
      this.map.addLayer({
        id: `clusters-${this.sourceId}`,
        type: 'circle',
        source: this.sourceId,
        filter: ['has', 'point_count'],
        paint: {
          // Size based on point count
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'point_count'],
            this.clusterConfig.minPoints, 20,
            10, 30,
            50, 40
          ],
          // Color based on dominant property type in cluster
          'circle-color': [
            'case',
            ['>', ['get', 'singleFamilyCount'], ['max', ['get', 'multiFamilyCount'], ['get', 'condoCount']]],
            '#4CAF50',  // Green for single family
            ['>', ['get', 'multiFamilyCount'], ['get', 'condoCount']],
            '#2196F3',  // Blue for multi family
            '#9C27B0'   // Purple for condos
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-stroke-opacity': 0.5
        }
      });

      // Add cluster count layer with enhanced styling
      this.map.addLayer({
        id: `cluster-count-${this.sourceId}`,
        type: 'symbol',
        source: this.sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': [
            'concat',
            ['to-string', ['get', 'point_count']],
            '\n',
            ['number-format', 
              ['/', ['get', 'totalPrice'], ['get', 'priceCount']], 
              { 'min-fraction-digits': 0, 'max-fraction-digits': 0 }
            ],
            'k'
          ],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 0.1]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.5)',
          'text-halo-width': 1
        }
      });

      // Add individual points layer with enhanced styling
      this.map.addLayer({
        id: this.layerId,
        type: 'symbol',
        source: this.sourceId,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': 'home-marker',
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.3,
            16, 0.5,
            22, 0.8
          ],
          'icon-allow-overlap': false,
          'icon-ignore-placement': false,
          'text-field': [
            'case',
            ['>', ['zoom'], 14],
            ['concat',
              ['get', 'address'],
              '\n',
              ['get', 'propertyType'],
              ' - $',
              ['number-format', ['get', 'price'], { 'min-fraction-digits': 0, 'max-fraction-digits': 0 }],
              'k'
            ],
            ''
          ],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-size': 12,
          'text-optional': true,
          'text-max-width': 8
        },
        paint: {
          'text-color': [
            'match',
            ['get', 'propertyType'],
            'Single Family', '#2E7D32',
            'Multi Family', '#1565C0',
            'Condo', '#6A1B9A',
            '#333333'
          ],
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // Add interactions
      this.addInteractions();
      console.log('MoveInsLayer initialized successfully');
    } catch (error) {
      console.error('Error initializing MoveInsLayer:', error);
    }
  }

  addInteractions() {
    // Hover effect
    this.map.on('mouseenter', this.layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });

    // Click handling for individual points
    this.map.on('click', this.layerId, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        this.showPopup(feature);
      }
    });

    // Click handling for clusters with smooth zoom
    this.map.on('click', `clusters-${this.sourceId}`, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [`clusters-${this.sourceId}`]
      });
      const clusterId = features[0].properties.cluster_id;
      
      // Get cluster expansion zoom with smooth transition
      this.map.getSource(this.sourceId).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          // Calculate the center point with a slight offset for better view
          const center = features[0].geometry.coordinates;
          const offset = 0.001; // Small offset for better visibility
          
          this.map.easeTo({
            center: [center[0] + offset, center[1]],
            zoom: zoom + 0.5, // Slight zoom increase for better visibility
            duration: 500, // Smooth animation duration
            easing: t => t * (2 - t) // Smooth easing function
          });
        }
      );
    });

    // Hover effect for clusters
    this.map.on('mouseenter', `clusters-${this.sourceId}`, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', `clusters-${this.sourceId}`, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  showPopup(feature) {
    const coordinates = feature.geometry.coordinates.slice();
    const { properties } = feature;

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString();
    };

    const formatCurrency = (amount) => {
      if (!amount) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const popupContent = `
      <div class="custom-popup move-in-popup">
        <h4>${properties.address}</h4>
        <div class="popup-section">
          <div class="popup-detail">
            <span class="label">Property Type:</span>
            <span class="value">${properties.propertyType}</span>
          </div>
          <div class="popup-detail">
            <span class="label">Move-in Date:</span>
            <span class="value">${formatDate(properties.purchaseDate)}</span>
          </div>
          <div class="popup-detail">
            <span class="label">Square Feet:</span>
            <span class="value">${properties.squareFeet.toLocaleString()}</span>
          </div>
          <div class="popup-detail">
            <span class="label">Year Built:</span>
            <span class="value">${properties.yearBuilt}</span>
          </div>
          <div class="popup-detail">
            <span class="label">Estimated Income:</span>
            <span class="value">${properties.income}</span>
          </div>
          <div class="popup-detail">
            <span class="label">Previous Address:</span>
            <span class="value">${properties.ownerInfo.previousAddress}</span>
          </div>
        </div>
        ${properties.corporateOwned ? 
          '<div class="popup-badge corporate">Corporate Owned</div>' : 
          '<div class="popup-badge individual">Individual Owner</div>'}
      </div>
    `;

    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '300px',
      className: 'move-in-popup'
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(this.map);
  }

  async loadData(bounds, filters = {}) {
    console.log('MoveInsLayer.loadData: Starting data load');
    if (!this.visible) {
      console.log('MoveInsLayer: Layer not visible, skipping data load');
      return;
    }

    try {
      const data = await fetchMoveIns({
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ],
        zoom: Math.round(this.map.getZoom()),
        filters
      });

      const source = this.map.getSource(this.sourceId);
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error('Error loading move-ins data:', error);
    }
  }

  setFilter(filters) {
    if (!this.map.getLayer(this.layerId)) return;

    const filterArray = ['all'];

    // Date range filter
    if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
      filterArray.push([
        'all',
        ['>=', ['get', 'purchaseDate'], filters.dateRange[0]],
        ['<=', ['get', 'purchaseDate'], filters.dateRange[1]]
      ]);
    }

    // Property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      filterArray.push(['==', ['get', 'propertyType'], filters.propertyType]);
    }

    // Corporate ownership filter
    if (filters.ownership) {
      filterArray.push(['==', ['get', 'corporateOwned'], filters.ownership === 'corporate']);
    }

    // Apply filter to all related layers
    const layersToFilter = [
      this.layerId,
      `clusters-${this.sourceId}`,
      `cluster-count-${this.sourceId}`
    ];

    layersToFilter.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.setFilter(layerId, filterArray.length > 1 ? filterArray : null);
      }
    });
  }

  setVisibility(visible) {
    this.visible = visible;
    const layers = [
      this.layerId,
      `clusters-${this.sourceId}`,
      `cluster-count-${this.sourceId}`
    ];

    layers.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        );
      }
    });

    if (visible) {
      this.loadData(this.map.getBounds());
    }
  }

  remove() {
    const layers = [
      this.layerId,
      `clusters-${this.sourceId}`,
      `cluster-count-${this.sourceId}`
    ];

    layers.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }

    if (this.map.hasImage('home-marker')) {
      this.map.removeImage('home-marker');
    }
  }
} 