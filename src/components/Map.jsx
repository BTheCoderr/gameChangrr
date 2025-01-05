import { LayerGroup, GeoJSON } from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

function BoundariesControl({ showCityBoundaries }) {
  const map = useMap();

  useEffect(() => {
    // Find all vector layers (boundaries)
    const vectorLayers = Object.values(map._layers).filter(layer => 
      layer.feature && 
      layer.feature.type === 'Feature' && 
      layer.feature.geometry
    );

    vectorLayers.forEach(layer => {
      if (!showCityBoundaries) {
        // Remove the layer from map when toggle is off
        map.removeLayer(layer);
      } else if (!map.hasLayer(layer)) {
        // Add the layer back when toggle is on
        layer.addTo(map);
      }
    });

  }, [showCityBoundaries, map]);

  return null;
}

function Map({ showCityBoundaries }) {
  return (
    <MapContainer
      center={[42.4072, -71.3824]}
      zoom={8}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <BoundariesControl showCityBoundaries={showCityBoundaries} />
    </MapContainer>
  );
}

export default Map; 