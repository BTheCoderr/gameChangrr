import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapLegend from './MapLegend';
import LayerPanel from './LayerPanel';
import LayersPanel from './LayersPanel';
import { LayerManager } from './layers/LayerManager';
import './Map.css';

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const layerManager = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLayerManager, setShowLayerManager] = useState(false);
  
  const [layers, setLayers] = useState({
    utilityBoundaries: { visible: false, opacity: 1 },
    cityBoundaries: { visible: false, opacity: 1 },
    solarPermits: { visible: false, opacity: 1 },
    solarPotential: { visible: false, opacity: 1 },
    evStationsHeatmap: { visible: false, opacity: 1 },
    demographicsChoropleth: { visible: false, opacity: 1 },
    roofPermits: { visible: false, opacity: 1 },
    hvacPermits: { visible: false, opacity: 1 },
    poolPermits: { visible: false, opacity: 1 }
  });

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-71.0589, 42.3601],
      zoom: 12
    });

    map.current.on('load', () => {
      layerManager.current = new LayerManager(map.current);
      layerManager.current.initialize().then(() => {
        setMapLoaded(true);
      });
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !layerManager.current) return;

    Object.entries(layers).forEach(([layerId, settings]) => {
      layerManager.current.setLayerVisibility(layerId, settings.visible);
      layerManager.current.setLayerOpacity(layerId, settings.opacity);
    });
  }, [layers, mapLoaded]);

  const handleLayerChange = (layerId, visible) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], visible }
    }));
  };

  const handleOpacityChange = (layerId, opacity) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], opacity }
    }));
  };

  const handleLayerSettings = (layerId, settings) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], ...settings }
    }));
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      {mapLoaded && (
        <>
          <div className="map-controls">
            <LayerPanel
              layers={layers}
              onLayerChange={handleLayerChange}
              onOpacityChange={handleOpacityChange}
            />
            <button 
              className="layer-manager-button"
              onClick={() => setShowLayerManager(!showLayerManager)}
            >
              Advanced Layer Settings
            </button>
          </div>
          
          {showLayerManager && (
            <div className="layer-manager-modal">
              <LayersPanel
                visible={true}
                activeLayers={Object.fromEntries(
                  Object.entries(layers)
                    .map(([id, settings]) => [id, settings.visible])
                )}
                onLayerToggle={(layerId, settings) => handleLayerSettings(layerId, settings)}
                onClose={() => setShowLayerManager(false)}
              />
            </div>
          )}
          
          <MapLegend 
            activeLayers={Object.fromEntries(
              Object.entries(layers)
                .filter(([_, settings]) => settings.visible)
                .map(([id, _]) => [id, true])
            )} 
          />
        </>
      )}
    </div>
  );
};

export default Map; 