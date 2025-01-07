export class BaseLayer {
  constructor(map) {
    this.map = map;
    this.visible = false;
    this.opacity = 1;
    this.sourceId = null;
    this.layerIds = {};
  }

  async initialize() {
    // To be implemented by child classes
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
    Object.entries(this.layerIds).forEach(([type, layerId]) => {
      if (!this.map.getLayer(layerId)) return;

      switch (type) {
        case 'circle':
          this.map.setPaintProperty(layerId, 'circle-opacity', opacity);
          break;
        case 'fill':
          this.map.setPaintProperty(layerId, 'fill-opacity', opacity);
          break;
        case 'line':
          this.map.setPaintProperty(layerId, 'line-opacity', opacity);
          break;
        case 'symbol':
          this.map.setPaintProperty(layerId, 'icon-opacity', opacity);
          this.map.setPaintProperty(layerId, 'text-opacity', opacity);
          break;
        case 'heatmap':
          this.map.setPaintProperty(layerId, 'heatmap-opacity', opacity);
          break;
      }
    });
  }

  cleanup() {
    Object.values(this.layerIds).forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.sourceId && this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }
  }
} 