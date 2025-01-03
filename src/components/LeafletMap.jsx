import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Box,
  Paper,
  IconButton, 
  TextField,
  InputAdornment,
  Collapse,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import SatelliteIcon from '@mui/icons-material/Satellite';
import { fetchCityBoundaries, fetchNeighborhoodBoundaries, getBoundaryStyle } from '../services/boundaryService';
import { fetchSolarInstallations, getSolarInstallationStyle } from '../services/solarService';

// Mapbox configuration
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const LeafletMap = ({ activeLayers, onLayerToggle }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);
  const cityBoundaryLayerRef = useRef(null);
  const neighborhoodBoundaryLayerRef = useRef(null);
  const solarInstallationsRef = useRef(null);

  useEffect(() => {
    // Skip if no container
    if (!mapContainerRef.current) return;

    // Skip if map is already initialized
    if (mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Create map centered on Massachusetts
        const map = L.map(mapContainerRef.current, {
          center: [42.0654, -71.7184], // Center of Massachusetts
          zoom: 8, // Zoom level to show entire state
        zoomControl: false,
          attributionControl: true
        });
        
        mapRef.current = map;

        // Add initial layer based on active state
        const style = activeLayers.standardMap ? 'streets-v12' : 'satellite-streets-v12';
        const baseLayer = L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
          {
          maxZoom: 19,
            attribution: '© Mapbox'
          }
        ).addTo(map);
        
        baseLayerRef.current = baseLayer;

        // Add zoom control to the bottom right
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);

        // Force a resize to ensure the map fills its container
        map.invalidateSize();

    } catch (error) {
      console.error('Error initializing map:', error);
    }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        baseLayerRef.current = null;
        cityBoundaryLayerRef.current = null;
        neighborhoodBoundaryLayerRef.current = null;
      }
    };
  }, []);

  // Handle map type changes
  useEffect(() => {
    if (!mapRef.current || !baseLayerRef.current) return;

    const style = activeLayers.standardMap ? 'streets-v12' : 'satellite-streets-v12';
    const newLayer = L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      {
        maxZoom: 19,
        attribution: '© Mapbox'
      }
    );

    mapRef.current.removeLayer(baseLayerRef.current);
    newLayer.addTo(mapRef.current);
    baseLayerRef.current = newLayer;
  }, [activeLayers.standardMap, activeLayers.satelliteView]);

  // Handle city boundary layer visibility
  useEffect(() => {
    const loadCityBoundaries = async () => {
      try {
        if (!mapRef.current) {
          console.log('Map not initialized yet');
          return;
        }

        // Remove existing layer if it exists
        if (cityBoundaryLayerRef.current) {
          mapRef.current.removeLayer(cityBoundaryLayerRef.current);
          cityBoundaryLayerRef.current = null;
        }

        if (activeLayers.cityBoundaries) {
          console.log('Fetching city boundaries...');
          const boundaries = await fetchCityBoundaries();
          console.log('Received boundaries:', boundaries);
          
          if (!boundaries || !boundaries.features || boundaries.features.length === 0) {
            console.error('No valid boundary data received');
            return;
          }

          cityBoundaryLayerRef.current = L.geoJSON(boundaries, {
            style: (feature) => getBoundaryStyle('city'),
            onEachFeature: (feature, layer) => {
              // Add mouseover/mouseout events for highlighting
              layer.on({
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle(getBoundaryStyle('city', true));
                  layer.bringToFront();
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.setStyle(getBoundaryStyle('city'));
                },
                click: (e) => {
                  const layer = e.target;
                  // Reset all layers to default style
                  cityBoundaryLayerRef.current.eachLayer(l => {
                    l.setStyle(getBoundaryStyle('city'));
                  });
                  // Highlight clicked layer
                  layer.setStyle(getBoundaryStyle('city', true));
                  layer.bringToFront();
                  
                  const { name, permitTime } = feature.properties;
                  // Show popup with permit time info
                  layer.bindPopup(`
                    <div style="text-align: center;">
                      <h3>${name}, MA</h3>
                      <h2>${permitTime || 'N/A'}</h2>
                      <p>Average permit time</p>
                      <p style="color: #666;">More AHJ data coming soon</p>
                    </div>
                  `).openPopup();
                }
              });
            }
          }).addTo(mapRef.current);

          // Wait for the layer to be added and rendered
          setTimeout(() => {
            try {
              if (cityBoundaryLayerRef.current) {
                const bounds = cityBoundaryLayerRef.current.getBounds();
                if (bounds && bounds.isValid()) {
                  mapRef.current.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 10  // Limit zoom level when fitting bounds
                  });
                } else {
                  console.log('Setting default view for Massachusetts');
                  mapRef.current.setView([42.0654, -71.7184], 8);
                }
              }
            } catch (error) {
              console.error('Error fitting bounds:', error);
              mapRef.current.setView([42.0654, -71.7184], 8);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error loading city boundaries:', error);
      }
    };

    loadCityBoundaries();
  }, [activeLayers.cityBoundaries]);

  // Handle neighborhood boundary layer visibility
  useEffect(() => {
    const loadNeighborhoodBoundaries = async () => {
      try {
        if (!mapRef.current) return;

        // Remove existing layer if it exists
        if (neighborhoodBoundaryLayerRef.current) {
          mapRef.current.removeLayer(neighborhoodBoundaryLayerRef.current);
          neighborhoodBoundaryLayerRef.current = null;
        }

        if (activeLayers.neighborhoodInsights) {
          // Get the current map bounds
          const bounds = mapRef.current.getBounds();
          const center = mapRef.current.getCenter();
          
          // Find the closest city to the center of the view
          let closestCity = null;
          let shortestDistance = Infinity;
          
          cityBoundaryLayerRef.current?.eachLayer(layer => {
            const layerCenter = layer.getBounds().getCenter();
            const distance = center.distanceTo(layerCenter);
            if (distance < shortestDistance) {
              shortestDistance = distance;
              closestCity = layer.feature.properties.name;
            }
          });

          if (!closestCity) {
            console.log('No city found in view, defaulting to Springfield');
            closestCity = 'Springfield';
          }

          console.log('Fetching neighborhoods for:', closestCity);
          const boundaries = await fetchNeighborhoodBoundaries(closestCity);
          
          if (!boundaries.features || boundaries.features.length === 0) {
            console.log('No neighborhood data available for', closestCity);
            return;
          }

          neighborhoodBoundaryLayerRef.current = L.geoJSON(boundaries, {
            style: (feature) => getBoundaryStyle('neighborhood'),
            onEachFeature: (feature, layer) => {
              // Add mouseover/mouseout events for highlighting
              layer.on({
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    ...getBoundaryStyle('neighborhood'),
                    fillOpacity: 0.3,
                    weight: 3
                  });
                  layer.bringToFront();
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.setStyle(getBoundaryStyle('neighborhood'));
                },
                click: (e) => {
                  const layer = e.target;
                  const props = feature.properties;
                  
                  // Show popup with neighborhood info
                  layer.bindPopup(`
                    <div style="text-align: center;">
                      <h3>${props.name}</h3>
                      <p>${props.city}</p>
                      ${props.population ? `<p>Population: ${props.population.toLocaleString()}</p>` : ''}
                      ${props.area ? `<p>Area: ${(props.area / 1000000).toFixed(2)} km²</p>` : ''}
                    </div>
                  `).openPopup();
                }
              });
            }
          }).addTo(mapRef.current);
        }
      } catch (error) {
        console.error('Error loading neighborhood boundaries:', error);
      }
    };

    loadNeighborhoodBoundaries();
  }, [activeLayers.neighborhoodInsights]);

  // Handle search
  const handleSearch = async () => {
    if (!searchValue.trim() || !mapRef.current) return;

    try {
      setIsSearching(true);
      // Focus on Springfield, MA area
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue)}.json?access_token=${MAPBOX_TOKEN}&bbox=-72.7,42.0,-72.4,42.2&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        mapRef.current.flyTo([lat, lng], 16);
        setSearchValue('');
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle solar installations layer
  useEffect(() => {
    const loadSolarInstallations = async () => {
      try {
        if (!mapRef.current) return;

        // Remove existing layer if it exists
        if (solarInstallationsRef.current) {
          mapRef.current.removeLayer(solarInstallationsRef.current);
          solarInstallationsRef.current = null;
        }

        if (activeLayers.solarInstallations) {
          const data = await fetchSolarInstallations();
          
          solarInstallationsRef.current = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
              return L.circleMarker(latlng, getSolarInstallationStyle());
            },
            onEachFeature: (feature, layer) => {
              const { capacity, date_installed, system_type, address } = feature.properties;
              layer.bindPopup(`
                <div style="text-align: center;">
                  <h3>Solar Installation</h3>
                  <p>Capacity: ${capacity} kW</p>
                  <p>Installed: ${new Date(date_installed).toLocaleDateString()}</p>
                  <p>Type: ${system_type}</p>
                  <p>Address: ${address}</p>
                </div>
              `);
            }
          }).addTo(mapRef.current);
        }
      } catch (error) {
        console.error('Error loading solar installations:', error);
      }
    };

    loadSolarInstallations();
  }, [activeLayers.solarInstallations]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }}
      />

      {/* Controls Container */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          zIndex: 1000,
          display: 'flex',
          gap: 1
        }}
      >
        {/* Search Bar */}
        <Paper 
          elevation={3}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: '#fff',
            width: isSearchOpen ? 300 : 40,
            transition: 'width 0.3s ease'
          }}
        >
          <IconButton 
            onClick={() => {
              if (isSearchOpen && searchValue) {
                handleSearch();
              } else {
                setIsSearchOpen(!isSearchOpen);
              }
            }}
            disabled={isSearching}
            sx={{ 
              width: 40, 
              height: 40,
              borderRadius: 0
            }}
          >
            <SearchIcon />
          </IconButton>
          
          <Collapse in={isSearchOpen} orientation="horizontal">
            <Box sx={{ width: 260 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                InputProps={{
                  endAdornment: searchValue && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSearchValue('');
                          setIsSearchOpen(false);
                        }}
                        disabled={isSearching}
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    height: 40,
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
            </Box>
          </Collapse>
        </Paper>

        {/* Map Type Toggle */}
        <Paper 
          elevation={3}
          sx={{
            display: 'flex', 
            alignItems: 'center',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <ToggleButtonGroup
            value={activeLayers.standardMap ? 'standard' : 'satellite'}
            exclusive
            onChange={(event, newValue) => {
              if (newValue === 'standard') {
                onLayerToggle('standardMap');
              } else if (newValue === 'satellite') {
                onLayerToggle('satelliteView');
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                width: 40,
                height: 40,
                borderRadius: 0,
                border: 'none',
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
            <ToggleButton value="standard">
              <MapIcon />
            </ToggleButton>
            <ToggleButton value="satellite">
              <SatelliteIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
        </Box>
    </Box>
  );
};

export default LeafletMap;
