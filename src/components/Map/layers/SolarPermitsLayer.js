import mapboxgl from 'mapbox-gl';
import { fetchSolarInstallations } from '../../../services/gamechangrrService';

export class SolarPermitsLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'solar-permits';
    this.layerIds = {
      clusters: 'solar-permits-clusters',
      clusterCount: 'solar-permits-cluster-count',
      unclusteredPoints: 'solar-permits-points',
      labels: 'solar-permits-labels'
    };
    this.visible = true;
    this.opacity = 1;
  }

  initialize() {
    try {
      // Add clustered source
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        generateId: true
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
            '#2196F3', // 0-19 points
            20,
            '#1976D2', // 20-99 points
            100,
            '#0D47A1' // 100+ points
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, // 0-19 points
            20,
            25, // 20-99 points
            100,
            30 // 100+ points
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.5
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
          'text-size': 14,
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': 'rgba(0, 0, 0, 0.2)',
          'text-halo-width': 1
        }
      });

      // Add unclustered points layer
      this.map.addLayer({
        id: this.layerIds.unclusteredPoints,
        type: 'circle',
        source: this.sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'active', '#4CAF50',
            'expired', '#FFC107',
            'bankrupt', '#F44336',
            '#808080' // default color
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 4,
            15, 8,
            20, 12
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.8
        }
      });

      // Add text labels for unclustered points (visible only when zoomed in)
      this.map.addLayer({
        id: this.layerIds.labels,
        type: 'symbol',
        source: this.sourceId,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'address'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'visibility': 'visible',
          'symbol-sort-key': ['get', 'capacity'],
          'text-max-width': 8
        },
        paint: {
          'text-color': '#333333',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0,
            15, 1
          ]
        }
      });

      this.addInteractions();
    } catch (error) {
      console.error('Error initializing SolarPermitsLayer:', error);
      throw error;
    }
  }

  addInteractions() {
    // Click event for clusters
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

    // Click event for unclustered points
    this.map.on('click', this.layerIds.unclusteredPoints, (e) => {
      const feature = e.features[0];
      this.showPopup(feature, e.lngLat);
    });

    // Change cursor on hover
    this.map.on('mouseenter', this.layerIds.clusters, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.clusters, () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', this.layerIds.unclusteredPoints, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', this.layerIds.unclusteredPoints, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  showPopup(feature, lngLat) {
    const { properties } = feature;
    
    const content = `
      <div class="popup-content">
        <h3>${properties.address}</h3>
        <div class="popup-section">
          <h4>Permit Details</h4>
          <ul>
            <li>Status: ${properties.status}</li>
            <li>Capacity: ${properties.capacity} kW</li>
            <li>Installation Date: ${properties.installDate}</li>
          </ul>
        </div>
        <div class="popup-section">
          <h4>System Details</h4>
          <ul>
            <li>Panel Type: ${properties.panelType}</li>
            <li>Inverter Type: ${properties.inverterType}</li>
            <li>Annual Production: ${properties.annualProduction} kWh</li>
          </ul>
        </div>
      </div>
    `;

    new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(content)
      .addTo(this.map);
  }

  async loadData(data) {
    try {
      const source = this.map.getSource(this.sourceId);
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error('Error loading solar permits data:', error);
      throw error;
    }
  }

  setVisibility(visible) {
    this.visible = visible;
    const visibility = visible ? 'visible' : 'none';
    Object.values(this.layerIds).forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    
    if (this.map.getLayer(this.layerIds.clusters)) {
      this.map.setPaintProperty(
        this.layerIds.clusters,
        'circle-opacity',
        opacity * 0.8
      );
      this.map.setPaintProperty(
        this.layerIds.clusters,
        'circle-stroke-opacity',
        opacity * 0.5
      );
    }

    if (this.map.getLayer(this.layerIds.unclusteredPoints)) {
      this.map.setPaintProperty(
        this.layerIds.unclusteredPoints,
        'circle-opacity',
        opacity * 0.8
      );
      this.map.setPaintProperty(
        this.layerIds.unclusteredPoints,
        'circle-stroke-opacity',
        opacity * 0.8
      );
    }

    if (this.map.getLayer(this.layerIds.labels)) {
      this.map.setPaintProperty(
        this.layerIds.labels,
        'text-opacity',
        [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, 0,
          15, opacity
        ]
      );
    }
  }

  cleanup() {
    Object.values(this.layerIds).forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }
  }
} 