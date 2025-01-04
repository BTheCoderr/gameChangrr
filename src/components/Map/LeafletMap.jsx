import React, { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMoveIns, startPeriodicFetch } from '../../services/moveInService';

// Custom hook for managing map layers
const useMapLayers = () => {
  const [activeLayers, setActiveLayers] = useState({
    moveIns: true,
    neighborhoodInsights: false,
    solarInstallations: false
  });

  const handleLayerToggle = (layerId) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  return { activeLayers, handleLayerToggle };
};

const LeafletMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({
    moveIns: L.layerGroup(),
    neighborhoodInsights: L.layerGroup(),
    solarInstallations: L.layerGroup()
  });
  const [error, setError] = useState(null);
  const { activeLayers, handleLayerToggle } = useMapLayers();

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return; // Skip if map is already initialized

    const map = L.map(mapRef.current).setView([42.1015, -72.5898], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize layer groups
    Object.values(layerGroupsRef.current).forEach(layer => layer.addTo(map));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const addMoveInsToMap = useCallback((moveInsData) => {
    if (!mapInstanceRef.current || !moveInsData) {
      console.log('Map or data not ready');
      return;
    }

    console.log('Adding move-ins to map:', moveInsData);

    // Clear existing markers
    if (layerGroupsRef.current.moveIns) {
      layerGroupsRef.current.moveIns.clearLayers();
    }

    // Add new markers
    moveInsData.forEach(moveIn => {
      if (!moveIn.position || !Array.isArray(moveIn.position)) {
        console.warn('Invalid position data for move-in:', moveIn);
        return;
      }

      try {
        const marker = L.marker(moveIn.position)
          .bindPopup(`
            <div class="popup-content">
              <h3>${moveIn.properties.address || 'No Address'}</h3>
              <p>Type: ${moveIn.properties.propertyType || 'N/A'}</p>
              <p>Move-in Date: ${moveIn.properties.purchaseDate || 'N/A'}</p>
              <p>Square Feet: ${moveIn.properties.squareFeet || 'N/A'}</p>
              <p>Year Built: ${moveIn.properties.yearBuilt || 'N/A'}</p>
            </div>
          `);
        marker.addTo(layerGroupsRef.current.moveIns);
      } catch (err) {
        console.error('Error adding marker:', err);
      }
    });
  }, []);

  // Set up move-ins layer with periodic updates
  useEffect(() => {
    if (!mapInstanceRef.current || !activeLayers.moveIns) {
      console.log('Map not ready or move-ins layer inactive');
      return;
    }

    console.log('Starting periodic fetch for move-ins');
    const cleanup = startPeriodicFetch(addMoveInsToMap);

    return () => {
      console.log('Cleaning up move-ins fetch');
      cleanup();
      if (layerGroupsRef.current.moveIns) {
        layerGroupsRef.current.moveIns.clearLayers();
      }
    };
  }, [mapInstanceRef.current, activeLayers.moveIns, addMoveInsToMap]);

  // Update layer visibility when toggles change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    Object.entries(activeLayers).forEach(([layerId, isActive]) => {
      const layer = layerGroupsRef.current[layerId];
      if (layer) {
        if (isActive) {
          layer.addTo(mapInstanceRef.current);
        } else {
          layer.remove();
        }
      }
    });
  }, [activeLayers]);

  if (error) {
    return <div>Error loading map data: {error}</div>;
  }

  return (
    <div className="map-layout" style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default LeafletMap; 