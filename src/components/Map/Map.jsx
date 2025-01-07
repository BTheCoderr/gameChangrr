import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapLegend from './MapLegend';
import LayerPanel from './LayerPanel';
import { LayerManager } from './layers/LayerManager';
import './Map.css';

const Map = ({ onMapLoad }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const layerManager = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState({
    utilityBoundaries: { visible: true, opacity: 0.8 },
    cityBoundaries: { visible: false, opacity: 0.8 },
    solarPermits: { visible: false, opacity: 1 },
    roofPermits: { visible: false, opacity: 1 },
    hvacPermits: { visible: false, opacity: 1 },
    poolPermits: { visible: false, opacity: 1 },
    moveIns: { visible: false, opacity: 1 },
    spanishSpeakers: { visible: false, opacity: 0.8 },
    evOwners: { visible: false, opacity: 0.8 }
  });

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-71.0589, 42.3601],
      zoom: 9
    });

    map.current.on('load', () => {
      layerManager.current = new LayerManager(map.current);
      layerManager.current.initialize();
      setMapLoaded(true);
      if (onMapLoad) onMapLoad(map.current);
    });

    return () => {
      if (layerManager.current) {
        layerManager.current.cleanup();
      }
      map.current?.remove();
    };
  }, [onMapLoad]);

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

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      {mapLoaded && (
        <>
          <LayerPanel
            layers={layers}
            onLayerChange={handleLayerChange}
            onOpacityChange={handleOpacityChange}
          />
          <MapLegend activeLayers={Object.fromEntries(
            Object.entries(layers)
              .filter(([_, settings]) => settings.visible)
              .map(([id, _]) => [id, true])
          )} />
        </>
      )}
    </div>
  );
};

export default Map; 