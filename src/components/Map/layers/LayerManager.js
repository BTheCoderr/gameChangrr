import { UtilityBoundariesLayer } from './UtilityBoundariesLayer';
import { SolarPermitsLayer } from './SolarPermitsLayer';
import { CityBoundariesLayer } from './CityBoundariesLayer';
import { SolarPotentialLayer } from './SolarPotentialLayer';
import { EVStationsHeatmapLayer } from './EVStationsHeatmapLayer';
import { DemographicsChoroplethLayer } from './DemographicsChoroplethLayer';
import { RoofPermitsLayer } from './RoofPermitsLayer';
import { HVACPermitsLayer } from './HVACPermitsLayer';
import { PoolPermitsLayer } from './PoolPermitsLayer';

export class LayerManager {
  constructor(map) {
    this.map = map;
    this.layers = {
      utilityBoundaries: new UtilityBoundariesLayer(map),
      cityBoundaries: new CityBoundariesLayer(map),
      solarPermits: new SolarPermitsLayer(map),
      solarPotential: new SolarPotentialLayer(map),
      evStationsHeatmap: new EVStationsHeatmapLayer(map),
      demographicsChoropleth: new DemographicsChoroplethLayer(map),
      roofPermits: new RoofPermitsLayer(map),
      hvacPermits: new HVACPermitsLayer(map),
      poolPermits: new PoolPermitsLayer(map)
    };
  }

  async initialize() {
    try {
      // Clean up any existing layers first
      Object.values(this.layers).forEach(layer => {
        if (layer && typeof layer.cleanup === 'function') {
          layer.cleanup();
        }
      });

      // Initialize each layer
      for (const layer of Object.values(this.layers)) {
        if (layer && typeof layer.initialize === 'function') {
          await layer.initialize();
        }
      }
    } catch (error) {
      console.error('Error initializing layers:', error);
      throw error;
    }
  }

  setLayerVisibility(layerId, visible) {
    console.log('LayerManager: Setting', layerId, 'visibility to', visible);
    const layer = this.layers[layerId];
    if (layer && typeof layer.setVisibility === 'function') {
      layer.setVisibility(visible);
    } else {
      console.warn('LayerManager: Layer', layerId, 'not found');
    }
  }

  setLayerOpacity(layerId, opacity) {
    const layer = this.layers[layerId];
    if (layer && typeof layer.setOpacity === 'function') {
      layer.setOpacity(opacity);
    } else {
      console.warn('LayerManager: Layer', layerId, 'not found');
    }
  }

  getLayer(layerId) {
    return this.layers[layerId];
  }

  cleanup() {
    Object.values(this.layers).forEach(layer => {
      if (layer && typeof layer.cleanup === 'function') {
        layer.cleanup();
      }
    });
  }
} 