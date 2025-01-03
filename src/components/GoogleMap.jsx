import { useCallback, useState, useEffect } from 'react';
import { 
  Box, 
  ToggleButton, 
  ToggleButtonGroup, 
  InputAdornment, 
  IconButton, 
  Collapse, 
  Paper, 
  Typography,
  TextField
} from '@mui/material';
import { 
  GoogleMap, 
  useLoadScript, 
  Autocomplete,
  MarkerClusterer,
  Marker,
  InfoWindow
} from '@react-google-maps/api';
import PropTypes from 'prop-types';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import SatelliteIcon from '@mui/icons-material/Satellite';
import CloseIcon from '@mui/icons-material/Close';
import { 
  fetchNeighborhoodBoundaries, 
  fetchZipCodeBoundaries 
} from '../services/boundaryService';

// Constants
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places', 'geometry'];
const DEBOUNCE_DELAY = 1000; // 1 second delay

console.log('Google Maps API Key loaded:', GOOGLE_MAPS_API_KEY ? 'Yes' : 'No');

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 42.1015,
  lng: -72.5898
};

const options = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeId: 'satellite'
};

// Boundary styling configurations
const boundaryStyles = {
  block_group: {
    strokeColor: '#FF9800',  // Orange
    strokeOpacity: 0.8,
    strokeWeight: 1.5,
    fillColor: '#FF9800',
    fillOpacity: 0.1,
    zIndex: 1
  },
  zipcode: {
    strokeColor: '#FF9800',  // Orange
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: '#FF9800',
    fillOpacity: 0.05,
    zIndex: 1
  }
};

function Map({ activeLayers, onLayerToggle }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState('satellite');
  const [searchValue, setSearchValue] = useState('');
  const [markers, setMarkers] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [lastBoundsUpdate, setLastBoundsUpdate] = useState(null);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete) => {
    setAutocomplete(autocomplete);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        map?.panTo(location);
        map?.setZoom(17);
        setIsSearchOpen(false);
      }
    }
  }, [autocomplete, map]);

  // Handle boundary click
  const handleBoundaryClick = useCallback((feature) => {
    setSelectedFeature({
      name: feature.properties.name,
      type: feature.properties.type,
      stats: {
        population: feature.properties.population,
        medianIncome: feature.properties.medianIncome,
        homeownership: feature.properties.homeownership,
        avgHomeValue: feature.properties.avgHomeValue,
        zoning: feature.properties.zoning
      }
    });
    
    // Calculate center of boundary for info window
    const bounds = new window.google.maps.LatLngBounds();
    feature.geometry.coordinates[0].forEach(coord => {
      bounds.extend(new window.google.maps.LatLng(coord[1], coord[0]));
    });
    setInfoWindowPosition(bounds.getCenter());
  }, []);

  // Create a debounced version of the boundary update function
  const updateBoundaries = useCallback((map, activeLayers) => {
    if (!map || !activeLayers) return;

    console.log('Updating boundaries...');
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const zoom = map.getZoom();

    // Only fetch if the bounds have changed significantly
    const boundsChanged = !lastBoundsUpdate || 
      Math.abs(lastBoundsUpdate.ne.lat - ne.lat()) > 0.001 ||
      Math.abs(lastBoundsUpdate.ne.lng - ne.lng()) > 0.001;

    if (!boundsChanged) {
      console.log('Skipping update - bounds haven\'t changed significantly');
      return;
    }

    setLastBoundsUpdate({
      ne: { lat: ne.lat(), lng: ne.lng() },
      sw: { lat: sw.lat(), lng: sw.lng() }
    });

    // Clear existing boundaries
    setBoundaries(prevBoundaries => {
      prevBoundaries.forEach(boundary => boundary.setMap(null));
      return [];
    });

    if (activeLayers.neighborhoodInsights) {
      const params = {
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLng: sw.lng(),
        maxLng: ne.lng()
      };

      if (zoom >= 12) {
        fetchNeighborhoodBoundaries(params)
          .then(data => {
            if (data.features && data.features.length > 0) {
              const newBoundaries = data.features.map(feature => {
                if (!feature.geometry || !feature.geometry.coordinates) return null;

                const coordinates = feature.geometry.coordinates[0].map(coord => ({
                  lat: coord[1],
                  lng: coord[0]
                }));

                const polygon = new window.google.maps.Polygon({
                  paths: coordinates,
                  ...boundaryStyles[feature.properties.type],
                  clickable: true,
                  zIndex: 1
                });

                polygon.addListener('click', () => handleBoundaryClick(feature));
                polygon.setMap(map);

                // Add hover effect
                polygon.addListener('mouseover', () => {
                  polygon.setOptions({
                    strokeWeight: polygon.strokeWeight * 1.5,
                    fillOpacity: polygon.fillOpacity * 2
                  });
                });

                polygon.addListener('mouseout', () => {
                  polygon.setOptions(boundaryStyles[feature.properties.type]);
                });

                return polygon;
              }).filter(Boolean);

              setBoundaries(prev => [...prev, ...newBoundaries]);
            }
          })
          .catch(console.error);
      } else {
        fetchZipCodeBoundaries(params)
          .then(data => {
            if (data.features && data.features.length > 0) {
              const newBoundaries = data.features.map(feature => {
                if (!feature.geometry || !feature.geometry.coordinates) return null;

                const coordinates = feature.geometry.coordinates[0].map(coord => ({
                  lat: coord[1],
                  lng: coord[0]
                }));

                const polygon = new window.google.maps.Polygon({
                  paths: coordinates,
                  ...boundaryStyles[feature.properties.type],
                  clickable: true,
                  zIndex: 1
                });

                polygon.addListener('click', () => handleBoundaryClick(feature));
                polygon.setMap(map);

                // Add hover effect
                polygon.addListener('mouseover', () => {
                  polygon.setOptions({
                    strokeWeight: polygon.strokeWeight * 1.5,
                    fillOpacity: polygon.fillOpacity * 2
                  });
                });

                polygon.addListener('mouseout', () => {
                  polygon.setOptions(boundaryStyles[feature.properties.type]);
                });

                return polygon;
              }).filter(Boolean);

              setBoundaries(prev => [...prev, ...newBoundaries]);
            }
          })
          .catch(console.error);
      }
    }
  }, [lastBoundsUpdate, handleBoundaryClick]);

  const debouncedUpdateBoundaries = useCallback(
    debounce(updateBoundaries, DEBOUNCE_DELAY),
    [updateBoundaries]
  );

  const onBoundsChanged = useCallback(() => {
    if (!map) return;
    debouncedUpdateBoundaries(map, activeLayers);
  }, [map, activeLayers, debouncedUpdateBoundaries]);

  // Update boundaries when map or layers change
  useEffect(() => {
    debouncedUpdateBoundaries(map, activeLayers);
  }, [map, activeLayers, debouncedUpdateBoundaries]);

  if (loadError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        p: 3
      }}>
        <Typography color="error">
          Error loading maps: {loadError.message}
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%'
      }}>
        <Typography>Loading maps...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Top Controls Bar */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          right: 20, 
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Paper sx={{ 
          display: 'flex', 
          alignItems: 'center',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          {/* Search Box */}
          <Box sx={{ 
            position: 'relative',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <IconButton 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              sx={{ 
                width: '40px', 
                height: '40px',
                borderRadius: 0,
                color: 'primary.main'
              }}
            >
              <SearchIcon sx={{ fontSize: '20px' }} />
            </IconButton>
            
            <Collapse in={isSearchOpen} orientation="horizontal">
              <Box sx={{
                width: '260px',
                height: '40px'
              }}>
                <Autocomplete 
                  onLoad={onAutocompleteLoad} 
                  onPlaceChanged={onPlaceChanged}
                  style={{ width: '100%' }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search location..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    InputProps={{
                      endAdornment: searchValue && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSearchValue('');
                              setIsSearchOpen(false);
                            }}
                          >
                            <CloseIcon sx={{ fontSize: '20px' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        height: '40px',
                        '& input': {
                          padding: '8px 14px'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                </Autocomplete>
              </Box>
            </Collapse>
          </Box>

          {/* Map Type Toggle */}
          <ToggleButtonGroup
            value={mapType}
            exclusive
            onChange={(e, value) => value && setMapType(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                width: '40px',
                height: '40px',
                borderRadius: 0,
                border: 'none',
                borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
                color: 'primary.main',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }
              }
            }}
          >
            <ToggleButton value="roadmap">
              <MapIcon />
            </ToggleButton>
            <ToggleButton value="satellite">
              <SatelliteIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={{
          ...options,
          mapTypeId: mapType
        }}
        onLoad={onLoad}
        onBoundsChanged={onBoundsChanged}
      >
        {/* Map content */}
      </GoogleMap>

      {/* Feature Info Window */}
      {selectedFeature && infoWindowPosition && (
        <InfoWindow
          position={infoWindowPosition}
          onCloseClick={() => setSelectedFeature(null)}
        >
          <Box>
            <Typography variant="h6">{selectedFeature.name}</Typography>
            <Typography>Type: {selectedFeature.type}</Typography>
            {selectedFeature.stats && (
              <>
                <Typography>Population: {selectedFeature.stats.population}</Typography>
                <Typography>Median Income: ${selectedFeature.stats.medianIncome}</Typography>
                <Typography>Homeownership: {selectedFeature.stats.homeownership}%</Typography>
                <Typography>Avg Home Value: ${selectedFeature.stats.avgHomeValue}</Typography>
              </>
            )}
          </Box>
        </InfoWindow>
      )}
    </Box>
  );
}

Map.propTypes = {
  activeLayers: PropTypes.shape({
    leads: PropTypes.bool,
    neighborhoodInsights: PropTypes.bool,
    utilityBoundaries: PropTypes.bool,
    solarPermits: PropTypes.bool,
    moveIns: PropTypes.bool,
    cityBoundaries: PropTypes.bool,
    manufacturedHomes: PropTypes.bool,
    spanishSpeakers: PropTypes.bool,
    evOwners: PropTypes.bool,
    aerial: PropTypes.bool
  }).isRequired,
  onLayerToggle: PropTypes.func.isRequired
};

export default Map;
