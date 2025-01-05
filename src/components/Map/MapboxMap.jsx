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
} from '../../services/solarscoutService';
import { fetchPropertyBoundaries, fetchCityBoundaries } from '../../services/propertyService';
import { API_CONFIG } from '../../config/api';
import MapControls from './MapControls';
import LayersPanel from './LayersPanel';
import LeadsPanel from './LeadsPanel';
import FiltersPanel from './FiltersPanel';
import SolarPermitsPanel from './SolarPermitsPanel';
import './MapboxMap.css';

// Ensure Mapbox token is set
if (!import.meta.env.VITE_MAPBOX_TOKEN) {
  console.error('Mapbox token is missing! Please add VITE_MAPBOX_TOKEN to your .env file');
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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

const MapboxMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    moveIns: false,
    cityBoundaries: false,
    solarPotential: false,
    utilityBoundaries: false,
    solarPermits: false,
    evStations: false,
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
    dateRange: [null, null],
    propertyType: 'all',
    priceRange: [0, 1000000],
    yearBuilt: [1900, new Date().getFullYear()],
    capacityRange: [0, 50],
    expiredPermits: false,
    recentPermits: false,
    hasBattery: false,
    installers: {
      allBankrupt: false,
      expiredBankrupt: false,
      lumio: false,
      titanSolar: false,
      sunpower: false
    }
  });
  const [mapStyle, setMapStyle] = useState('satellite');

  const createPopupContent = (feature, layerType) => {
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

  const initializeLayers = (map) => {
    // Add utility boundaries source and layer
    map.addSource('utility-boundaries', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'utility-boundaries-layer',
      type: 'fill',
      source: 'utility-boundaries',
      paint: {
        'fill-color': '#4a90e2',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.3,
          0.15
        ],
        'fill-outline-color': '#4a90e2'
      },
      layout: {
        visibility: activeLayers.utilityBoundaries ? 'visible' : 'none'
      }
    });

    // Add solar permits source and layer
    map.addSource('solar-permits', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'solar-permits-layer',
      type: 'circle',
      source: 'solar-permits',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 4,
          16, 6,
          18, 8
        ],
        'circle-color': '#ff9900',
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2,
          1.5
        ],
        'circle-stroke-color': '#ffffff',
        'circle-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0.9
        ]
      },
      layout: {
        visibility: activeLayers.solarPermits ? 'visible' : 'none'
      }
    });

    // Add EV stations source and layer
    map.addSource('ev-stations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'ev-stations-layer',
      type: 'symbol',
      source: 'ev-stations',
      layout: {
        'icon-image': 'charging-station',
        'icon-size': 1.2,
        'icon-allow-overlap': true,
        visibility: activeLayers.evStations ? 'visible' : 'none'
      }
    });

    // Add city boundaries source and layer
    map.addSource('city-boundaries', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'city-boundaries-layer',
      type: 'line',
      source: 'city-boundaries',
      paint: {
        'line-color': '#ffffff',
        'line-width': 1.5,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 0.8],
        'line-dasharray': [2, 2]
      }
    });

    // Add property boundaries source and layer
    map.addSource('property-boundaries', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add property fill layer for hover effect
    map.addLayer({
      id: 'property-boundaries-fill',
      type: 'fill',
      source: 'property-boundaries',
      paint: {
        'fill-color': '#FFD700',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.2,
          0
        ]
      }
    });

    map.addLayer({
      id: 'property-boundaries-layer',
      type: 'line',
      source: 'property-boundaries',
      paint: {
        'line-color': '#FFD700',
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 17, 1],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 17, 0.8]
      }
    });

    // Add move-ins source and layer with enhanced styling
    map.addSource('move-ins', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'move-ins-layer',
      type: 'circle',
      source: 'move-ins',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 4,
          16, 6,
          18, 8
        ],
        'circle-color': '#33cc33',
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2,
          1.5
        ],
        'circle-stroke-color': '#ffffff',
        'circle-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0.9
        ],
        'circle-stroke-opacity': 1
      },
      layout: {
        visibility: activeLayers.moveIns ? 'visible' : 'none'
      }
    });

    // Add neighborhood insights with improved styling
    map.addSource('neighborhoods', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'neighborhoods-layer',
      type: 'fill',
      source: 'neighborhoods',
      paint: {
        'fill-color': '#088',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.3,
          0.15
        ],
        'fill-outline-color': '#088'
      },
      layout: {
        visibility: activeLayers.neighborhoodInsights ? 'visible' : 'none'
      }
    });

    // Add solar installations with enhanced styling
    map.addSource('solar-installations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'solar-installations-layer',
      type: 'circle',
      source: 'solar-installations',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 4,
          16, 6,
          18, 8
        ],
        'circle-color': '#ff9900',
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2,
          1.5
        ],
        'circle-stroke-color': '#ffffff',
        'circle-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0.9
        ],
        'circle-stroke-opacity': 1
      },
      layout: {
        visibility: activeLayers.solarInstallations ? 'visible' : 'none'
      }
    });

    // Add hover effects and popups for solar permits layer
    let hoveredStateId = null;
    const addLayerInteractions = (layerId, sourceId) => {
      // Mouse enter - show tooltip
      map.on('mouseenter', layerId, (e) => {
        if (e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';
        
        // Set hover state
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
      });

      // Mouse leave - hide tooltip
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
          map.setFeatureState(
            { source: sourceId, id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
      });

      // Click - show popup
      map.on('click', layerId, (e) => {
        if (e.features.length === 0) return;
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const layerType = layerId.replace('-layer', '');
        
        // Create popup
        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          className: 'custom-popup'
        })
          .setLngLat(coordinates)
          .setHTML(createPopupContent(e.features[0], layerType))
          .addTo(map);
      });
    };

    // Add interactions to all interactive layers
    ['solar-permits', 'ev-stations', 'utility-boundaries'].forEach(layerId => {
      addLayerInteractions(`${layerId}-layer`, layerId);
    });

    // Update layer filters based on user input
    const updateLayerFilters = () => {
      if (!map.getLayer('solar-permits-layer')) return;

      // Solar permits filters
      const solarFilters = ['all'];
      
      // Date range filter
      if (filters.dateRange[0] && filters.dateRange[1]) {
        solarFilters.push([
          'all',
          ['>=', ['get', 'applicationDate'], filters.dateRange[0]],
          ['<=', ['get', 'applicationDate'], filters.dateRange[1]]
        ]);
      }

      // System capacity filter
      if (filters.capacityRange[0] !== 0 || filters.capacityRange[1] !== 50) {
        solarFilters.push([
          'all',
          ['>=', ['get', 'systemSize'], filters.capacityRange[0]],
          ['<=', ['get', 'systemSize'], filters.capacityRange[1]]
        ]);
      }

      // Permit features filters
      if (filters.expiredPermits) {
        solarFilters.push(['==', ['get', 'status'], 'expired']);
      }
      if (filters.recentPermits) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        solarFilters.push([
          'all',
          ['>=', ['get', 'applicationDate'], sixtyDaysAgo.toISOString()],
          ['<=', ['get', 'applicationDate'], thirtyDaysAgo.toISOString()]
        ]);
      }
      if (filters.hasBattery) {
        solarFilters.push(['==', ['get', 'hasBattery'], true]);
      }

      // Installer filters
      if (filters.installers) {
        const installerFilters = [];
        if (filters.installers.allBankrupt) {
          installerFilters.push(['==', ['get', 'installerStatus'], 'bankrupt']);
        }
        if (filters.installers.expiredBankrupt) {
          installerFilters.push([
            'all',
            ['==', ['get', 'installerStatus'], 'bankrupt'],
            ['==', ['get', 'status'], 'expired']
          ]);
        }
        if (filters.installers.lumio) {
          installerFilters.push(['==', ['get', 'installer'], 'Lumio']);
        }
        if (filters.installers.titanSolar) {
          installerFilters.push(['==', ['get', 'installer'], 'Titan Solar Power']);
        }
        if (filters.installers.sunpower) {
          installerFilters.push(['==', ['get', 'installer'], 'Sunpower']);
        }
        
        if (installerFilters.length > 0) {
          solarFilters.push(['any', ...installerFilters]);
        }
      }

      // Apply filters to layer
      map.setFilter('solar-permits-layer', solarFilters);

      // EV stations filters
      if (map.getLayer('ev-stations-layer')) {
        const evFilters = ['all'];
        // Add minimum chargers filter
        evFilters.push(['>=', ['get', 'numChargers'], 2]);
        map.setFilter('ev-stations-layer', evFilters);
      }
    };

    // Update filters when they change
    useEffect(() => {
      if (map.current && mapLoaded) {
        updateLayerFilters();
      }
    }, [filters, mapLoaded]);
  };

  const handleStyleChange = (styleId) => {
    if (map.current && MAP_STYLES[styleId]) {
      setMapStyle(styleId);
      map.current.setStyle(MAP_STYLES[styleId].style);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle].style,
        center: [-72.589811, 42.102535],
        zoom: 13
      });

      // Create style switcher first
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

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geocoder last
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: 'Search addresses'
      });

      // Add geocoder and make it collapsible
      const geocoderContainer = geocoder.onAdd(map.current);
      geocoderContainer.className += ' collapsed';

      // Add click handler to toggle collapse
      const searchIcon = geocoderContainer.querySelector('.mapboxgl-ctrl-geocoder--icon-search');
      const searchInput = geocoderContainer.querySelector('input');

      // Make the entire container clickable when collapsed
      geocoderContainer.addEventListener('click', (e) => {
        if (geocoderContainer.classList.contains('collapsed')) {
          geocoderContainer.classList.remove('collapsed');
          searchInput.focus();
        }
      });

      // Handle search icon click separately
      searchIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!geocoderContainer.classList.contains('collapsed')) {
          geocoderContainer.classList.add('collapsed');
        }
      });

      // Collapse search when input loses focus and is empty
      searchInput.addEventListener('blur', (e) => {
        // Small delay to allow for icon clicks
        setTimeout(() => {
          if (!searchInput.value && !geocoderContainer.contains(document.activeElement)) {
            geocoderContainer.classList.add('collapsed');
          }
        }, 200);
      });

      // Add the geocoder container to the map
      map.current.getContainer().querySelector('.mapboxgl-ctrl-top-right').appendChild(geocoderContainer);

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        initializeLayers(map.current);
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
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load data when bounds change
  const loadMapData = async () => {
    if (!map.current || !mapBounds) return;

    try {
      const loadLayerData = async (layerId, fetchFunction, options = {}) => {
        if (!activeLayers[layerId]) return;

        try {
          const source = map.current.getSource(layerId);
          if (!source) {
            console.warn(`Source not found for layer: ${layerId}`);
            return;
          }

          // Show loading state
          if (options.showLoading) {
            map.current.setLayoutProperty(
              `${layerId}-layer`,
              'visibility',
              'none'
            );
          }

          const data = await fetchFunction(mapBounds, filters);
          source.setData(data);

          // Restore visibility
          if (options.showLoading) {
            map.current.setLayoutProperty(
              `${layerId}-layer`,
              'visibility',
              activeLayers[layerId] ? 'visible' : 'none'
            );
          }
        } catch (error) {
          console.error(`Error loading data for ${layerId}:`, error);
          // Show error state or fallback
        }
      };

      // Load all layer data in parallel
      await Promise.all([
        loadLayerData('utility-boundaries', fetchUtilityBoundaries, { showLoading: true }),
        loadLayerData('solar-permits', fetchSolarInstallations, { showLoading: true }),
        loadLayerData('ev-stations', fetchEVStations, { showLoading: true }),
        loadLayerData('move-ins', fetchMoveIns),
        loadLayerData('neighborhoods', fetchNeighborhoods),
        loadLayerData('city-boundaries', fetchCityBoundaries)
      ]);

      // Update filters after data is loaded
      updateLayerFilters();
    } catch (error) {
      console.error('Error loading map data:', error);
      // Show error state to user
    }
  };

  // Debounce the loadMapData function to prevent too many API calls
  const debouncedLoadMapData = useCallback(
    debounce(() => {
      loadMapData();
    }, 300),
    [mapBounds, activeLayers, filters]
  );

  // Update data when bounds, layers, or filters change
  useEffect(() => {
    debouncedLoadMapData();
    return () => debouncedLoadMapData.cancel();
  }, [mapBounds, activeLayers, filters]);

  // Enhanced layer filter function
  const updateLayerFilters = () => {
    if (!map.current) return;

    const layers = {
      'solar-permits-layer': createSolarPermitsFilter(),
      'ev-stations-layer': createEVStationsFilter(),
      'utility-boundaries-layer': createUtilityBoundariesFilter()
    };

    Object.entries(layers).forEach(([layerId, filter]) => {
      if (map.current.getLayer(layerId) && filter) {
        map.current.setFilter(layerId, filter);
      }
    });
  };

  const createSolarPermitsFilter = () => {
    const solarFilters = ['all'];
    
    // Date range filter
    if (filters.dateRange[0] && filters.dateRange[1]) {
      solarFilters.push([
        'all',
        ['>=', ['get', 'applicationDate'], filters.dateRange[0]],
        ['<=', ['get', 'applicationDate'], filters.dateRange[1]]
      ]);
    }

    // System capacity filter
    if (filters.capacityRange[0] !== 0 || filters.capacityRange[1] !== 50) {
      solarFilters.push([
        'all',
        ['>=', ['get', 'systemSize'], filters.capacityRange[0]],
        ['<=', ['get', 'systemSize'], filters.capacityRange[1]]
      ]);
    }

    // Permit features filters
    if (filters.expiredPermits) {
      solarFilters.push(['==', ['get', 'status'], 'expired']);
    }
    if (filters.recentPermits) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      solarFilters.push([
        'all',
        ['>=', ['get', 'applicationDate'], sixtyDaysAgo.toISOString()],
        ['<=', ['get', 'applicationDate'], thirtyDaysAgo.toISOString()]
      ]);
    }
    if (filters.hasBattery) {
      solarFilters.push(['==', ['get', 'hasBattery'], true]);
    }

    // Installer filters
    if (filters.installers) {
      const installerFilters = [];
      if (filters.installers.allBankrupt) {
        installerFilters.push(['==', ['get', 'installerStatus'], 'bankrupt']);
      }
      if (filters.installers.expiredBankrupt) {
        installerFilters.push([
          'all',
          ['==', ['get', 'installerStatus'], 'bankrupt'],
          ['==', ['get', 'status'], 'expired']
        ]);
      }
      if (filters.installers.lumio) {
        installerFilters.push(['==', ['get', 'installer'], 'Lumio']);
      }
      if (filters.installers.titanSolar) {
        installerFilters.push(['==', ['get', 'installer'], 'Titan Solar Power']);
      }
      if (filters.installers.sunpower) {
        installerFilters.push(['==', ['get', 'installer'], 'Sunpower']);
      }
      
      if (installerFilters.length > 0) {
        solarFilters.push(['any', ...installerFilters]);
      }
    }

    return solarFilters;
  };

  const createEVStationsFilter = () => {
    return ['all',
      ['>=', ['get', 'numChargers'], 2],
      ['==', ['get', 'status'], 'active']
    ];
  };

  const createUtilityBoundariesFilter = () => {
    return ['all']; // Add utility-specific filters here
  };

  // Toggle layer visibility
  const toggleLayer = (layerId) => {
    setActiveLayers(prev => {
      const newLayers = { ...prev, [layerId]: !prev[layerId] };
      
      // Update layer visibility
      if (map.current) {
        const mapLayerId = `${layerId}-layer`;
        if (map.current.getLayer(mapLayerId)) {
          map.current.setLayoutProperty(
            mapLayerId,
            'visibility',
            newLayers[layerId] ? 'visible' : 'none'
          );
        }
      }

      return newLayers;
    });
  };

  // Toggle panel visibility
  const togglePanel = (panelName) => {
    console.log('Toggling panel:', panelName, 'Current active panel:', activePanel);
    if (activePanel === panelName) {
      console.log('Closing panel:', panelName);
      setActivePanel(null);
    } else {
      console.log('Opening panel:', panelName);
      setActivePanel(panelName);
    }
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

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      
      {mapLoaded && (
        <>
          <MapControls onTogglePanel={togglePanel} activePanel={activePanel} />
          <div className="panel-container">
            <div className={`panel ${activePanel === 'layers' ? 'visible' : ''}`}>
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
            
            <div className={`panel ${activePanel === 'filters' ? 'visible' : ''}`}>
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
            
            <div className={`panel ${activePanel === 'leads' ? 'visible' : ''}`}>
              <div className="panel-header">
                <h3>Leads</h3>
                <button className="panel-close" onClick={() => togglePanel('leads')}>×</button>
              </div>
              <div className="panel-content">
                <LeadsPanel />
              </div>
            </div>
            
            <div className={`panel ${activePanel === 'solar-permits' ? 'visible' : ''}`}>
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
              <div className={`panel ${activePanel === 'propertyDetails' ? 'visible' : ''}`}>
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
        </>
      )}
    </div>
  );
};

export default MapboxMap; 