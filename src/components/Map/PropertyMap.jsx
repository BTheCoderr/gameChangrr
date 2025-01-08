import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, MarkerClusterer, Marker } from '@react-google-maps/api';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import {
  processPropertyMarkers,
  MapLayerManager,
  MapViewportManager,
  createMapEventHandlers,
  getClusterConfig
} from '../../utils/mapUtils';

const PropertyMap = ({ properties, onMarkerClick, className }) => {
  const [markers, setMarkers] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const layerManager = useRef(new MapLayerManager());
  const viewportManager = useRef(new MapViewportManager());
  const [error, setError] = useState(null);

  // Process properties into map markers
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        layerManager.current.setLayerLoading('markers');
        const processedMarkers = processPropertyMarkers(properties);
        setMarkers(processedMarkers);
        
        // Update viewport to fit markers
        if (mapInstance) {
          const viewport = viewportManager.current.fitMarkers(processedMarkers);
          mapInstance.setCenter(viewport.center);
          mapInstance.setZoom(viewport.zoom);
        }

        layerManager.current.setLayerLoaded('markers');
      } catch (error) {
        console.error('Error processing markers:', error);
        layerManager.current.setLayerError('markers', error);
        setError('Failed to load property markers');
      }
    };

    loadMarkers();
  }, [properties, mapInstance]);

  // Map event handlers
  const handlers = createMapEventHandlers({
    onLoad: (map) => {
      setMapInstance(map);
      const viewport = viewportManager.current.fitMarkers(markers);
      map.setCenter(viewport.center);
      map.setZoom(viewport.zoom);
    },
    onBoundsChanged: () => {
      if (mapInstance) {
        const center = mapInstance.getCenter().toJSON();
        const zoom = mapInstance.getZoom();
        const bounds = mapInstance.getBounds();
        viewportManager.current.updateViewport(center, zoom, bounds);
      }
    }
  });

  // Handle marker click
  const handleMarkerClick = (marker) => {
    if (onMarkerClick && marker.isValid) {
      onMarkerClick(marker);
    }
  };

  return (
    <Box className={className} position="relative" width="100%" height="100%">
      {/* Loading Overlay */}
      {layerManager.current.isLoading() && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.7)"
          zIndex={1}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Box position="absolute" top={16} left={16} right={16} zIndex={1}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Map Component */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
        {...handlers}
      >
        {/* Marker Clusterer */}
        <MarkerClusterer
          options={getClusterConfig(markers)}
        >
          {(clusterer) => (
            <>
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  title={marker.title}
                  icon={marker.icon}
                  clusterer={clusterer}
                  onClick={() => handleMarkerClick(marker)}
                  opacity={marker.isValid ? 1 : 0.6}
                />
              ))}
            </>
          )}
        </MarkerClusterer>
      </GoogleMap>
    </Box>
  );
};

export default PropertyMap; 