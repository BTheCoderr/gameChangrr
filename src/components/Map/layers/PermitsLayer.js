import { BaseLayer } from './BaseLayer';

export class PermitsLayer extends BaseLayer {
  constructor(map, type) {
    super(map);
    this.type = type;
    this.sourceId = `${type}-permits`;
    this.layerIds = {
      clusters: `${type}-permits-clusters`,
      clusterCount: `${type}-permits-cluster-count`,
      unclusteredPoint: `${type}-permits-unclustered-point`
    };
  }

  async initialize() {
    // Add source with clustering enabled
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

    // Add clusters layer
    this.map.addLayer({
      id: this.layerIds.clusters,
      type: 'circle',
      source: this.sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100, '#f1f075',
          750, '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100, 30,
          750, 40
        ]
      }
    });

    // Add cluster count labels
    this.map.addLayer({
      id: this.layerIds.clusterCount,
      type: 'symbol',
      source: this.sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Add unclustered point layer
    this.map.addLayer({
      id: this.layerIds.unclusteredPoint,
      type: 'circle',
      source: this.sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': this.getPointColor(),
        'circle-radius': 8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Add click handlers
    this.map.on('click', this.layerIds.clusters, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [this.layerIds.clusters]
      });
      const clusterId = features[0].properties.cluster_id;
      this.map.getSource(this.sourceId).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    this.map.on('click', this.layerIds.unclusteredPoint, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [this.layerIds.unclusteredPoint]
      });
      if (!features.length) return;

      const { properties } = features[0];
      const coordinates = features[0].geometry.coordinates.slice();

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(this.getPopupContent(properties))
        .addTo(this.map);
    });

    // Change cursor on hover
    this.map.on('mouseenter', this.layerIds.clusters, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.clusters, () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', this.layerIds.unclusteredPoint, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.unclusteredPoint, () => {
      this.map.getCanvas().style.cursor = '';
    });

    // Load initial data
    await this.loadData();

    // Set up data refresh on map move
    this.map.on('moveend', () => this.loadData());
  }

  // These methods should be implemented by child classes
  async loadData() {
    throw new Error('loadData must be implemented by child class');
  }

  getPointColor() {
    throw new Error('getPointColor must be implemented by child class');
  }

  getPopupContent(properties) {
    throw new Error('getPopupContent must be implemented by child class');
  }
} 