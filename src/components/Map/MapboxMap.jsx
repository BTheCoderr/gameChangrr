import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { debounce } from 'lodash';
import { fetchDemographicData } from '../../services/censusService';
import { 
  fetchNeighborhoods, 
  fetchSolarInstallations, 
  fetchMoveIns,
  fetchUtilityBoundaries,
  fetchEVStations
} from '../../services/gamechangrrService';
import { fetchProperties } from '../../services/propertyService';
import { fetchCityBoundaries } from '../../services/boundaryService';
import { API_CONFIG } from '../../config/api';
import MapControls from './MapControls';
import LayersPanel from './LayersPanel';
import LeadsPanel from './LeadsPanel';
import FiltersPanel from './FiltersPanel';
import SolarPermitsPanel from './SolarPermitsPanel';
import './MapboxMap.css';
import { cacheData, getCachedData } from '../../utils/cache';
import { LayerManager } from './layers/LayerManager';

// Ensure Mapbox token is set
mapboxgl.accessToken = "pk.eyJ1IjoiYmZlcnJlbGw1MTQiLCJhIjoiY200ajY5ZXdyMGFyMTJqcTAyMXplYTJjYiJ9.5yoWGtPOPInX9rUBRCI5Iw";

const MAP_STYLES = {
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    style: 'mapbox://styles/mapbox/satellite-streets-v12'
  },
  streets: {
    id: 'streets',
    label: 'Streets',
    style: 'mapbox://styles/mapbox/streets-v12'
  }
};

// Add custom geocoder options
const GEOCODER_OPTIONS = {
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: true, // Enable marker for better visibility
  placeholder: 'Search addresses, cities, or areas',
  bbox: [-72.7242, 42.0824, -72.4771, 42.1718], // Tighter bounding box for Springfield
  countries: 'us',
  types: 'address,place,neighborhood',
  minLength: 3,
  fuzzyMatch: true,
  routing: true,
  flyTo: {
    speed: 1.2,
    curve: 1,
    easing: (t) => t,
    zoom: 17 // Zoom in closer for addresses
  }
};

// Springfield bounds for validation
const SPRINGFIELD_BOUNDS = {
  north: 42.1718,
  south: 42.0824,
  east: -72.4771,
  west: -72.7242
};

// Helper function to validate Springfield address
const isInSpringfield = (lat, lng) => {
  return lat >= SPRINGFIELD_BOUNDS.south &&
         lat <= SPRINGFIELD_BOUNDS.north &&
         lng >= SPRINGFIELD_BOUNDS.west &&
         lng <= SPRINGFIELD_BOUNDS.east;
};

// Function to look up specific address
const lookupAddress = async (address) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
      `access_token=${mapboxgl.accessToken}&` +
      `bbox=${SPRINGFIELD_BOUNDS.west},${SPRINGFIELD_BOUNDS.south},${SPRINGFIELD_BOUNDS.east},${SPRINGFIELD_BOUNDS.north}&` +
      'types=address&limit=1'
    );
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const location = data.features[0];
      const [lng, lat] = location.center;
      
      if (isInSpringfield(lat, lng)) {
        return {
          center: location.center,
          address: location.place_name,
          coordinates: [lng, lat]
        };
      }
    }
    throw new Error('Address not found in Springfield');
  } catch (error) {
    console.error('Error looking up address:', error);
    return null;
  }
};

const MapboxMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const layerManager = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [visiblePanels, setVisiblePanels] = useState({});
  const [activeLayers, setActiveLayers] = useState({
    moveIns: false,
    cityBoundaries: false,
    solarPotential: false,
    utilityBoundaries: false,
    solarPermits: false,
    evStations: false,
    evStationsHeatmap: false,
    demographicsChoropleth: false,
    roofPermits: false,
    hvacPermits: false,
    poolPermits: false,
    neighborhoodInsights: false,
    hoas: false,
    spanishSpeakers: false,
    zipcodeStats: false,
    sgip: false,
    adRespondents: false,
    evOwners: false,
    reapIneligibleAreas: false,
    powerOutages: false
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filters, setFilters] = useState({
    // Solar Permits Filters
    solarPermits: {
      dateRange: [null, null],
    capacityRange: [0, 50],
      status: 'all', // 'all', 'approved', 'pending', 'rejected'
    hasBattery: false,
      installers: {
        allBankrupt: false,
        expiredBankrupt: false,
    lumio: false,
    titanSolar: false,
    sunpower: false
      }
    },
    // EV Stations Filters
    evStations: {
      minChargers: 2,
      status: 'active',
      connectorTypes: [], // Array of selected connector types
      network: 'all' // 'all' or specific network
    },
    // Demographics Filters
    demographics: {
      income: {
        min: 0,
        max: 200000
      },
      age: {
        min: 0,
        max: 100
      },
      homeownership: 'all', // 'all', 'owned', 'rented'
      education: 'all' // 'all', 'highschool', 'college', 'graduate'
    },
    // Property Filters
    properties: {
      type: 'all', // 'all', 'residential', 'commercial'
      priceRange: [0, 1000000],
      yearBuilt: [1900, new Date().getFullYear()],
      squareFootage: [0, 10000]
    },
    // Move-Ins Filters
    moveIns: {
      dateRange: [null, null],
      propertyType: 'all'
    },
    // Utility Boundaries Filters
    utilities: {
      provider: 'all',
      rateType: 'all',
      hasSolarProgram: null
    }
  });
  const [mapStyle, setMapStyle] = useState('satellite');
  const [hoverPopup, setHoverPopup] = useState(null);
  const [pendingFilterUpdates, setPendingFilterUpdates] = useState(new Set());

  const createPopupContent = (feature, layerType, extraDetails = {}) => {
    const { properties } = feature;
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString();
    };

    const formatCurrency = (value) => {
      if (!value) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    };

    switch (layerType) {
      case 'solar-permits':
        return `
          <div class="custom-popup">
            <h4>${properties.address || 'Solar Permit'}</h4>
            <div class="popup-details">
              <div class="popup-detail">
                <span class="label">Permit ID:</span>
                <span class="value">${properties.permitId || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Status:</span>
                <span class="value">${properties.status || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">System Size:</span>
                <span class="value">${properties.systemSize || 'N/A'} kW</span>
              </div>
              <div class="popup-detail">
                <span class="label">Installer:</span>
                <span class="value">${properties.installer || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Application Date:</span>
                <span class="value">${formatDate(properties.applicationDate)}</span>
              </div>
              ${properties.hasBattery ? '<div class="popup-detail battery-included">Includes Battery Storage</div>' : ''}
              ${extraDetails.estimatedCost ? `
                <div class="popup-detail">
                  <span class="label">Estimated Cost:</span>
                  <span class="value">${formatCurrency(extraDetails.estimatedCost)}</span>
                </div>
              ` : ''}
              ${extraDetails.incentives ? `
                <div class="popup-detail">
                  <span class="label">Available Incentives:</span>
                  <span class="value">${formatCurrency(extraDetails.incentives)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;

      case 'ev-stations':
        return `
          <div class="custom-popup">
            <h4>${properties.name || 'EV Station'}</h4>
            <div class="popup-details">
              <div class="popup-detail">
                <span class="label">Status:</span>
                <span class="value">${properties.status || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Chargers:</span>
                <span class="value">${properties.numChargers || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Network:</span>
                <span class="value">${properties.network || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Connector Types:</span>
                <span class="value">${properties.connectorTypes || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;

      case 'utility-boundaries':
        return `
          <div class="custom-popup">
            <h4>${properties.utilityName || 'Utility Area'}</h4>
            <div class="popup-details">
              <div class="popup-detail">
                <span class="label">Service Area:</span>
                <span class="value">${properties.serviceArea || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Rate Type:</span>
                <span class="value">${properties.rateType || 'N/A'}</span>
              </div>
              <div class="popup-detail">
                <span class="label">Solar Rate:</span>
                <span class="value">${properties.solarRate || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;

      default:
        return '';
    }
  };

  const addLayerInteractions = (map, layerId, sourceId) => {
    if (!map || !map.getLayer(layerId)) {
      console.debug(`Skipping interactions for ${layerId} - layer not found`);
      return;
    }

    let hoveredStateId = null;
    const tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'tooltip-popup'
    });

    // Mouse enter
    map.on('mouseenter', layerId, (e) => {
      if (!e.features || e.features.length === 0) return;
      map.getCanvas().style.cursor = 'pointer';
      
      if (hoveredStateId) {
        map.setFeatureState(
          { source: sourceId, id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = e.features[0].id;
      map.setFeatureState(
        { source: sourceId, id: hoveredStateId },
        { hover: true }
      );

      // Show tooltip
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      const layerType = layerId.replace('-layer', '');
      
      // Create tooltip content based on layer type
      let tooltipContent = '';
      switch (layerType) {
        case 'solar-permits':
          tooltipContent = `
            <div class="tooltip-content">
              <strong>${feature.properties.address || 'Solar Permit'}</strong>
              <div>${feature.properties.systemSize || 'N/A'} kW</div>
            </div>
          `;
          break;
        case 'ev-stations':
          tooltipContent = `
            <div class="tooltip-content">
              <strong>${feature.properties.name || 'EV Station'}</strong>
              <div>${feature.properties.numChargers || 'N/A'} chargers</div>
            </div>
          `;
          break;
        case 'utility-boundaries':
          tooltipContent = `
            <div class="tooltip-content">
              <strong>${feature.properties.utilityName || 'Utility Area'}</strong>
            </div>
          `;
          break;
        default:
          tooltipContent = `
            <div class="tooltip-content">
              <strong>${feature.properties.name || 'Feature'}</strong>
            </div>
          `;
      }

      tooltip
        .setLngLat(coordinates)
        .setHTML(tooltipContent)
        .addTo(map);
    });

    // Mouse leave
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
      if (hoveredStateId) {
        map.setFeatureState(
          { source: sourceId, id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = null;
      tooltip.remove();
    });

    // Click for detailed popup
    map.on('click', layerId, async (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      const layerType = layerId.replace('-layer', '');

      // Remove any existing tooltip
      tooltip.remove();
      
      try {
        // Create detailed popup
        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          className: 'custom-popup'
        })
          .setLngLat(coordinates)
          .setHTML(createPopupContent(feature, layerType))
          .addTo(map);
      } catch (error) {
        console.error('Error creating popup:', error);
      }
    });
  };

  const initializeLayers = (map) => {
    console.log('Initializing map layers...');
    
    // Initialize layer manager first
    layerManager.current = new LayerManager(map);
    layerManager.current.initialize();
    
    // Wait for layers to be initialized before setting visibility
    map.once('idle', () => {
      // Only set visibility for implemented layers
      const implementedLayers = [
        'moveIns',
        'cityBoundaries',
        'solarPotential',
        'utilityBoundaries',
        'solarPermits',
        'evStations',
        'evStationsHeatmap',
        'demographicsChoropleth',
        'roofPermits',
        'hvacPermits',
        'poolPermits'
      ];
      
      // Initialize layer visibility based on activeLayers state
      Object.entries(activeLayers)
        .filter(([layerId]) => implementedLayers.includes(layerId))
        .forEach(([layerId, isVisible]) => {
          if (layerManager.current) {
            layerManager.current.setLayerVisibility(layerId, isVisible);
          }
        });
      
      setMapLoaded(true);
    });
  };

  const handleStyleChange = (styleId) => {
    if (map.current && MAP_STYLES[styleId]) {
      setMapStyle(styleId);
      map.current.setStyle(MAP_STYLES[styleId].style);
    }
  };

  const initializeGeocoder = () => {
    const geocoder = new MapboxGeocoder({
      ...GEOCODER_OPTIONS,
      collapsed: true,
      clearOnBlur: true
    });

    // Add result handler
    geocoder.on('result', (e) => {
      const { result } = e;
      const { center, place_type } = result;
      
      // Adjust zoom based on result type
      let zoom = 17; // Default for addresses
      if (place_type.includes('neighborhood')) {
        zoom = 15;
      } else if (place_type.includes('place')) {
        zoom = 13;
      }

      map.current.flyTo({
        center: center,
        zoom: zoom,
        essential: true
      });
    });

    map.current.addControl(geocoder, 'top-right');

    // Handle clear button click
    geocoder.on('clear', () => {
      // Reset map view or perform other cleanup
      map.current.flyTo({
        center: [-98.5795, 39.8283], // US center
        zoom: 4
      });
    });

    // Handle loading state
    geocoder.on('loading', () => {
      const searchIcon = document.querySelector('.mapboxgl-ctrl-geocoder--icon-search');
      if (searchIcon) {
        searchIcon.classList.add('loading');
      }
    });

    geocoder.on('results', () => {
      const searchIcon = document.querySelector('.mapboxgl-ctrl-geocoder--icon-search');
      if (searchIcon) {
        searchIcon.classList.remove('loading');
      }
    });

    // Handle error state
    geocoder.on('error', () => {
      const searchIcon = document.querySelector('.mapboxgl-ctrl-geocoder--icon-search');
      if (searchIcon) {
        searchIcon.classList.remove('loading');
      }
      // Optionally show error message
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      console.log('Initializing map...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle].style,
        center: [-72.589811, 42.102535],
        zoom: 12
      });

      // Add navigation control (zoom buttons) first
      const nav = new mapboxgl.NavigationControl({
        showCompass: false, // Only show zoom controls
        visualizePitch: false
      });
      map.current.addControl(nav, 'top-left');

      // Create style switcher
      const styleSwitcher = document.createElement('div');
      styleSwitcher.className = 'map-style-switcher';

      // Add both buttons in order
      const buttons = [MAP_STYLES.satellite, MAP_STYLES.streets];
      buttons.forEach(style => {
        const button = document.createElement('button');
        button.className = `style-button ${style.id === mapStyle ? 'active' : ''}`;
        button.textContent = style.label;
        button.onclick = () => {
          // Update active state of buttons
          styleSwitcher.querySelectorAll('.style-button').forEach(btn => {
            btn.classList.remove('active');
          });
          button.classList.add('active');
          // Change map style
          setMapStyle(style.id);
          map.current.setStyle(style.style);
        };
        styleSwitcher.appendChild(button);
      });

      // Add style switcher to map
      const styleControl = document.createElement('div');
      styleControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      styleControl.appendChild(styleSwitcher);
      map.current.getContainer().querySelector('.mapboxgl-ctrl-top-right').appendChild(styleControl);

      // Enhanced geocoder setup
      const geocoder = new MapboxGeocoder({
        ...GEOCODER_OPTIONS,
        collapsed: true,
        clearOnBlur: true
      });

      map.current.addControl(geocoder, 'top-right');

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        
        // Initialize layer manager first
        layerManager.current = new LayerManager(map.current);
        layerManager.current.initialize();
        
        // Initialize layers
        initializeLayers(map.current);
        
        // Wait for layers to be initialized before setting visibility
        map.current.once('idle', () => {
          // Only set visibility for implemented layers
          const implementedLayers = [
            'moveIns',
            'cityBoundaries',
            'solarPotential',
            'utilityBoundaries',
            'solarPermits',
            'evStations',
            'evStationsHeatmap',
            'demographicsChoropleth',
            'roofPermits',
            'hvacPermits',
            'poolPermits'
          ];
          
          // Initialize layer visibility based on activeLayers state
          Object.entries(activeLayers)
            .filter(([layerId]) => implementedLayers.includes(layerId))
            .forEach(([layerId, isVisible]) => {
              if (layerManager.current) {
                layerManager.current.setLayerVisibility(layerId, isVisible);
              }
            });
          
          setMapLoaded(true);
        });
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      // Update bounds when map moves
      map.current.on('moveend', () => {
        if (!map.current) return;
        const bounds = map.current.getBounds();
        setMapBounds([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ]);
      });

      // Add property click handler
      map.current.on('click', 'property-boundaries-layer', (e) => {
        if (e.features.length > 0) {
          handlePropertyClick(e.features[0]);
        }
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (layerManager.current) {
        layerManager.current.cleanup();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add effect to log mapLoaded changes
  useEffect(() => {
    console.log('mapLoaded state changed:', mapLoaded);
  }, [mapLoaded]);

  // Helper function to get appropriate zoom level based on result type
  const getZoomLevelForType = (category) => {
    switch (category) {
      case 'address':
        return 18;
      case 'neighborhood':
        return 15;
      case 'locality':
        return 13;
      case 'place':
        return 11;
      case 'postcode':
        return 12;
      default:
        return 14;
    }
  };

  // Helper function to get icon for result type
  const getResultIcon = (category) => {
    switch (category) {
      case 'address':
        return '🏠';
      case 'neighborhood':
        return '🏘️';
      case 'locality':
        return '🌆';
      case 'place':
        return '🌎';
      case 'postcode':
        return '📍';
      default:
        return '📍';
    }
  };

  // Load data when bounds change
    const loadMapData = async () => {
      if (!map.current || !mapLoaded || !layerManager.current) return;

      try {
        const bounds = map.current.getBounds();
        await layerManager.current.loadData(bounds, filters);
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

  // Add error display function
  const showError = (message) => {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'map-error-message';
    errorContainer.textContent = message;
    map.current.getContainer().appendChild(errorContainer);
    
    // Remove error after 3 seconds
    setTimeout(() => {
      errorContainer.remove();
    }, 3000);
  };

  // Update the map event listeners in the useEffect hook
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Enhanced debounced version of loadMapData with error boundary
    const debouncedLoadData = debounce(async () => {
      if (!map.current) return;

      try {
        const bounds = map.current.getBounds();
        const zoom = map.current.getZoom();
        
        // Only update data if we've moved significantly
        const boundsChanged = !mapBounds || (
          Math.abs(bounds.getWest() - mapBounds[0]) > 0.01 ||
          Math.abs(bounds.getSouth() - mapBounds[1]) > 0.01 ||
          Math.abs(bounds.getEast() - mapBounds[2]) > 0.01 ||
          Math.abs(bounds.getNorth() - mapBounds[3]) > 0.01
        );

        if (boundsChanged) {
          setMapBounds([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ]);

          // Show loading state
          const loadingEl = document.createElement('div');
          loadingEl.className = 'map-loading';
          map.current.getContainer().appendChild(loadingEl);

          // Batch load all visible layers
          await Promise.all(
            Object.entries(activeLayers)
              .filter(([, isVisible]) => isVisible)
              .map(async ([layerId]) => {
                try {
                  const source = map.current.getSource(layerId);
                  if (!source) return;

                  // Check cache first
                  const cachedData = getCachedData(layerId, [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], filters);
                  
                  if (cachedData) {
                    source.setData(cachedData);
                    return;
                  }

                  // Fetch new data if not in cache
                  const response = await fetch(
                    `/api/${layerId}?bounds=${bounds.toString()}&zoom=${zoom}&filters=${JSON.stringify(filters[layerId] || {})}`
                  );

                  if (!response.ok) {
                    throw new Error(`Failed to fetch ${layerId} data: ${response.statusText}`);
                  }

                  const data = await response.json();
                  source.setData(data);

                  // Cache the new data
                  cacheData(layerId, [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], filters, data);
                } catch (error) {
                  console.error(`Error loading ${layerId} data:`, error);
                  // Show error indicator for this layer
                  const errorEl = document.createElement('div');
                  errorEl.className = 'map-layer-error';
                  errorEl.textContent = `Failed to load ${layerId}`;
                  map.current.getContainer().appendChild(errorEl);
                  setTimeout(() => errorEl.remove(), 3000);
                }
              })
          );

          // Remove loading indicator
          loadingEl.remove();
        }
      } catch (error) {
        console.error('Error in loadMapData:', error);
        // Show general error message
        const errorEl = document.createElement('div');
        errorEl.className = 'map-error';
        errorEl.textContent = 'Error loading map data';
        map.current.getContainer().appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 3000);
      }
    }, 300);

    // Add event listeners
    map.current.on('moveend', debouncedLoadData);
    map.current.on('zoomend', debouncedLoadData);
    
    // Load initial data
    debouncedLoadData();

    return () => {
      if (map.current) {
        map.current.off('moveend', debouncedLoadData);
        map.current.off('zoomend', debouncedLoadData);
      }
    };
  }, [mapLoaded, activeLayers, filters]);

  // Enhanced layer filter function
  const updateLayerFilters = useCallback(
    debounce(() => {
      if (!map.current || pendingFilterUpdates.size === 0) return;

      console.log('Applying batch filter updates');
      const layersToUpdate = Array.from(pendingFilterUpdates);
      
      const filterFunctions = {
        'solar-permits': createSolarPermitsFilter,
        'ev-stations': createEVStationsFilter,
        'demographics': createDemographicsFilter,
        'utility-boundaries': createUtilityBoundariesFilter
      };

      // Batch all filter updates into a single style update
      const batchedUpdates = layersToUpdate.reduce((updates, layerId) => {
        const filterFunction = filterFunctions[layerId];
        if (filterFunction) {
          const mapLayerId = `${layerId}-layer`;
          if (map.current.getLayer(mapLayerId)) {
            updates[mapLayerId] = filterFunction();
          }
          // Also update cluster layers if they exist
          if (map.current.getLayer(`clusters-${layerId}`)) {
            updates[`clusters-${layerId}`] = filterFunction();
          }
          if (map.current.getLayer(`unclustered-${layerId}`)) {
            updates[`unclustered-${layerId}`] = filterFunction();
          }
        }
        return updates;
      }, {});

      // Apply all filter updates in a single batch
      if (Object.keys(batchedUpdates).length > 0) {
        map.current.batch((batch) => {
          Object.entries(batchedUpdates).forEach(([layerId, filter]) => {
            batch.setFilter(layerId, filter);
          });
        });
      }

      // Clear pending updates
      setPendingFilterUpdates(new Set());
    }, 300),
    [filters, map, pendingFilterUpdates]
  );

  // Add this function to queue filter updates
  const queueFilterUpdate = (layerId) => {
    setPendingFilterUpdates(prev => new Set([...prev, layerId]));
  };

  // Update the filters state setter
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    
    // Apply filters to respective layers
    if (newFilters.solarPermits) {
      applyFilter('solar-permits', newFilters.solarPermits);
    }
    if (newFilters.moveIns) {
      applyFilter('move-ins', newFilters.moveIns);
    }
    if (newFilters.evStations) {
      applyFilter('ev-stations', newFilters.evStations);
    }
  };

  const createSolarPermitsFilter = () => {
    const { solarPermits } = filters;
    const filterArray = ['all'];
    
    // Date range filter
    if (solarPermits.dateRange[0] && solarPermits.dateRange[1]) {
      filterArray.push([
        'all',
        ['>=', ['get', 'date_installed'], solarPermits.dateRange[0]],
        ['<=', ['get', 'date_installed'], solarPermits.dateRange[1]]
      ]);
    }

    // System capacity filter
    if (solarPermits.capacityRange[0] !== 0 || solarPermits.capacityRange[1] !== 50) {
      filterArray.push([
        'all',
        ['>=', ['get', 'capacity'], solarPermits.capacityRange[0]],
        ['<=', ['get', 'capacity'], solarPermits.capacityRange[1]]
      ]);
    }

    // Status filter
    if (solarPermits.status !== 'all') {
      filterArray.push(['==', ['get', 'status'], solarPermits.status]);
    }

    // Battery filter
    if (solarPermits.hasBattery) {
      filterArray.push(['==', ['get', 'has_battery'], true]);
    }

    // Installer filters
    const installerFilters = [];
    Object.entries(solarPermits.installers || {}).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case 'allBankrupt':
            installerFilters.push(['==', ['get', 'installer_status'], 'bankrupt']);
            break;
          case 'expiredBankrupt':
            installerFilters.push([
              'all',
              ['==', ['get', 'installer_status'], 'bankrupt'],
              ['==', ['get', 'status'], 'expired']
            ]);
            break;
          default:
            installerFilters.push(['==', ['get', 'installer'], key]);
        }
      }
    });
    
    if (installerFilters.length > 0) {
      filterArray.push(['any', ...installerFilters]);
    }

    return filterArray.length > 1 ? filterArray : null;
  };

  const createEVStationsFilter = () => {
    const { evStations } = filters;
    const filterArray = ['all'];

    // Minimum chargers filter
    filterArray.push(['>=', ['get', 'numChargers'], evStations.minChargers]);

    // Status filter
    if (evStations.status !== 'all') {
      filterArray.push(['==', ['get', 'status'], evStations.status]);
    }

    // Connector types filter
    if (evStations.connectorTypes.length > 0) {
      filterArray.push([
        'any',
        ...evStations.connectorTypes.map(type => 
          ['in', type, ['get', 'connectorTypes']]
        )
      ]);
    }

    // Network filter
    if (evStations.network !== 'all') {
      filterArray.push(['==', ['get', 'network'], evStations.network]);
    }

    return filterArray;
  };

  const createDemographicsFilter = () => {
    const { demographics } = filters;
    const filterArray = ['all'];

    // Income filter
    if (demographics.income.min > 0 || demographics.income.max < 200000) {
      filterArray.push([
        'all',
        ['>=', ['get', 'medianIncome'], demographics.income.min],
        ['<=', ['get', 'medianIncome'], demographics.income.max]
      ]);
    }

    // Age filter
    if (demographics.age.min > 0 || demographics.age.max < 100) {
      filterArray.push([
        'all',
        ['>=', ['get', 'medianAge'], demographics.age.min],
        ['<=', ['get', 'medianAge'], demographics.age.max]
      ]);
    }

    // Homeownership filter
    if (demographics.homeownership !== 'all') {
      filterArray.push(['==', ['get', 'homeownership'], demographics.homeownership]);
    }

    // Education filter
    if (demographics.education !== 'all') {
      filterArray.push(['==', ['get', 'education'], demographics.education]);
    }

    return filterArray;
  };

  const createUtilityBoundariesFilter = () => {
    const { utilities } = filters;
    const filterArray = ['all'];

    // Provider filter
    if (utilities.provider !== 'all') {
      filterArray.push(['==', ['get', 'provider'], utilities.provider]);
    }

    // Rate type filter
    if (utilities.rateType !== 'all') {
      filterArray.push(['==', ['get', 'rateType'], utilities.rateType]);
    }

    // Solar program filter
    if (utilities.hasSolarProgram !== null) {
      filterArray.push(['==', ['get', 'hasSolarProgram'], utilities.hasSolarProgram]);
    }

    return filterArray;
  };

  // Add performance monitoring
  const monitorLayerPerformance = (layerId) => {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        console.debug(`${layerId} operation took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  };

  // Enhanced toggle layer function
  const toggleLayer = (layerId) => {
    if (!map.current || !layerManager.current) return;

    console.log(`Toggling layer: ${layerId}`);
    
    setActiveLayers(prev => {
      const newLayers = { ...prev, [layerId]: !prev[layerId] };
      layerManager.current.setLayerVisibility(layerId, newLayers[layerId]);
      return newLayers;
    });
  };

  // Enhanced layer initialization
  const initializeLayerVisibility = () => {
    if (!map.current) return;

    const monitor = monitorLayerPerformance('initializeLayerVisibility');
    
    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      // Update main layer
      const mapLayerId = `${layerId}-layer`;
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(
          mapLayerId,
          'visibility',
          isVisible ? 'visible' : 'none'
        );
      }

      // Update associated layers
      const relatedLayers = [
        `clusters-${layerId}`,
        `cluster-count-${layerId}`,
        `unclustered-${layerId}`,
        `${layerId}-heatmap`
      ];

      relatedLayers.forEach(relatedId => {
        if (map.current.getLayer(relatedId)) {
          map.current.setLayoutProperty(
            relatedId,
            'visibility',
            isVisible ? 'visible' : 'none'
          );
        }
      });
    });

    monitor.end();
  };

  // Add this to the map load handler
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const monitor = monitorLayerPerformance('mapLoadSetup');

    // Initialize layer visibility
    initializeLayerVisibility();

    // Set up performance monitoring for map movements
    map.current.on('movestart', () => {
      window._mapMoveStart = performance.now();
    });

    map.current.on('moveend', () => {
      if (window._mapMoveStart) {
        const duration = performance.now() - window._mapMoveStart;
        console.debug(`Map move took ${duration.toFixed(2)}ms`);
        delete window._mapMoveStart;
      }
    });

    monitor.end();
  }, [mapLoaded]);

  // Toggle panel visibility
  const togglePanel = (panelName) => {
    console.log('Toggling panel:', panelName);
    setActivePanel(prevPanel => {
      const newPanel = prevPanel === panelName ? null : panelName;
      console.log('New active panel:', newPanel);
      return newPanel;
    });
    
    // Update visible panels state
    setVisiblePanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  useEffect(() => {
    console.log('Active panel changed to:', activePanel);
  }, [activePanel]);

  // Handle property selection
  const handlePropertyClick = (feature) => {
    setSelectedProperty(feature.properties);
    setVisiblePanels(prev => ({
      ...prev,
      propertyDetails: true
    }));
  };

  // Add effect to handle layer visibility changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      const mapLayerId = `${layerId}-layer`;
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(
          mapLayerId,
          'visibility',
          isVisible ? 'visible' : 'none'
        );

        // If layer is being shown, ensure its data is loaded
        if (isVisible && ['solar-permits', 'ev-stations', 'utility-boundaries', 'move-ins'].includes(layerId)) {
          loadMapData();
        }
      }
    });
  }, [activeLayers, mapLoaded]);

  const renderLegend = () => {
    if (!activeLayers.evStationsHeatmap && !activeLayers.demographicsChoropleth) {
      return null;
    }

  return (
      <div className="layer-legend">
        {activeLayers.evStationsHeatmap && (
          <div className="legend-section">
            <h4>EV Station Density</h4>
            <div className="legend-gradient ev-stations">
              <div className="gradient-bar"></div>
              <div className="gradient-labels">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}
        
        {activeLayers.demographicsChoropleth && (
          <div className="legend-section">
            <h4>Median Income</h4>
            <div className="legend-gradient demographics">
              <div className="gradient-bar"></div>
              <div className="gradient-labels">
                <span>$0</span>
                <span>$200k+</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add this to your initialization
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Look up Roosevelt Ave address
    lookupAddress('1007 Roosevelt Ave, Springfield, MA').then(result => {
      if (result) {
        map.current.flyTo({
          center: result.center,
          zoom: 17,
          essential: true
        });
        
        // Add a marker
        new mapboxgl.Marker()
          .setLngLat(result.center)
          .addTo(map.current);
      }
    });
  }, [mapLoaded]);

  // Enhanced filter application function
  const applyFilter = (layerId, filterCriteria) => {
    if (!map.current) return;
    
    const createFilterExpression = (criteria) => {
      switch(layerId) {
        case 'solar-permits':
          return [
            'all',
            ['==', 'status', criteria.status || 'all'],
            criteria.hasBattery ? ['==', 'hasBattery', true] : true,
            criteria.dateRange[0] ? ['>=', ['get', 'applicationDate'], criteria.dateRange[0]] : true,
            criteria.dateRange[1] ? ['<=', ['get', 'applicationDate'], criteria.dateRange[1]] : true,
            ['>=', ['get', 'systemSize'], criteria.capacityRange[0]],
            ['<=', ['get', 'systemSize'], criteria.capacityRange[1]]
          ];
        
        case 'move-ins':
          return [
            'all',
            ['==', 'propertyType', criteria.propertyType || 'all'],
            criteria.dateRange[0] ? ['>=', ['get', 'moveInDate'], criteria.dateRange[0]] : true,
            criteria.dateRange[1] ? ['<=', ['get', 'moveInDate'], criteria.dateRange[1]] : true
          ];
        
        case 'ev-stations':
          return [
            'all',
            ['==', 'status', criteria.status || 'active'],
            ['>=', ['get', 'numChargers'], criteria.minChargers || 0],
            criteria.connectorTypes.length ? ['in', ['get', 'connectorType'], ['literal', criteria.connectorTypes]] : true,
            criteria.network === 'all' ? true : ['==', ['get', 'network'], criteria.network]
          ];
        
        default:
          return true;
      }
    };

    const filter = createFilterExpression(filterCriteria);
    map.current.setFilter(layerId, filter);
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <MapControls 
        onTogglePanel={togglePanel} 
        activePanel={activePanel}
      />
      {renderLegend()}
          <div className="panel-container">
        <div className={`panel ${visiblePanels.layers ? 'visible' : ''}`}>
          <div className="panel-header">
            <h3>Layers</h3>
            <button className="panel-close" onClick={() => togglePanel('layers')}>×</button>
          </div>
          <div className="panel-content">
            <LayersPanel
              activeLayers={activeLayers}
              onLayerToggle={toggleLayer}
            />
          </div>
        </div>
        
        <div className={`panel ${visiblePanels.filters ? 'visible' : ''}`}>
          <div className="panel-header">
            <h3>Filters</h3>
            <button className="panel-close" onClick={() => togglePanel('filters')}>×</button>
          </div>
          <div className="panel-content">
            <FiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>
        
        <div className={`panel ${visiblePanels.leads ? 'visible' : ''}`}>
          <div className="panel-header">
            <h3>Leads</h3>
            <button className="panel-close" onClick={() => togglePanel('leads')}>×</button>
          </div>
          <div className="panel-content">
            <LeadsPanel />
          </div>
        </div>
        
        <div className={`panel ${visiblePanels['solar-permits'] ? 'visible' : ''}`}>
          <div className="panel-header">
            <h3>Solar Permits</h3>
            <button className="panel-close" onClick={() => togglePanel('solar-permits')}>×</button>
          </div>
          <div className="panel-content">
            <SolarPermitsPanel
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>
        
        {selectedProperty && (
          <div className={`panel ${visiblePanels.propertyDetails ? 'visible' : ''}`}>
            <div className="panel-header">
              <h3>Property Details</h3>
              <button className="panel-close" onClick={() => togglePanel('propertyDetails')}>×</button>
            </div>
            <div className="panel-content">
              <PropertyDetailsPanel
                property={selectedProperty}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapboxMap; 