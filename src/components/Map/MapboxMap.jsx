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

// Add custom geocoder options
const GEOCODER_OPTIONS = {
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  placeholder: 'Search addresses, cities, or areas',
  bbox: [-125.0, 24.396308, -66.93457, 49.384358], // Limit to contiguous US
  countries: ['us'],
  types: ['address', 'neighborhood', 'locality', 'place', 'postcode'],
  minLength: 3,
  fuzzyMatch: true,
  routing: true,
  flyTo: {
    speed: 1.2,
    curve: 1,
    easing: (t) => t,
  },
  proximity: {
    longitude: -98.5795,
    latitude: 39.8283
  }
};

const MapboxMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
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

    // Add move-ins source and layer
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
        ]
      },
      layout: {
        visibility: activeLayers.moveIns ? 'visible' : 'none'
      }
    });

    // Add neighborhoods source and layer
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

    // Add EV stations heatmap source and layer
    map.addSource('ev-stations-heat', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'ev-stations-heatmap',
      type: 'heatmap',
      source: 'ev-stations-heat',
      paint: {
        // Increase weight based on number of chargers
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'numChargers'],
          1, 0.2,
          10, 1
        ],
        // Increase intensity as zoom level increases
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        // Assign color values based on density
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        // Adjust radius based on zoom level
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ],
        // Decrease opacity based on zoom level
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0.5
        ]
      },
      layout: {
        visibility: activeLayers.evStationsHeatmap ? 'visible' : 'none'
      }
    });

    // Add demographics choropleth source and layer
    map.addSource('demographics', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'demographics-choropleth',
      type: 'fill',
      source: 'demographics',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'medianIncome'],
          0, '#FFEDA0',
          25000, '#FED976',
          50000, '#FEB24C',
          75000, '#FD8D3C',
          100000, '#FC4E2A',
          150000, '#E31A1C',
          200000, '#BD0026'
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.8,
          0.6
        ],
        'fill-outline-color': '#000000'
      },
      layout: {
        visibility: activeLayers.demographicsChoropleth ? 'visible' : 'none'
      }
    });

    // Add hover effect for choropleth
    let hoveredStateId = null;
    map.on('mousemove', 'demographics-choropleth', (e) => {
      if (e.features.length > 0) {
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'demographics', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
          { source: 'demographics', id: hoveredStateId },
          { hover: true }
        );
      }
    });

    map.on('mouseleave', 'demographics-choropleth', () => {
      if (hoveredStateId !== null) {
        map.setFeatureState(
          { source: 'demographics', id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = null;
    });

    // Initialize layer visibility based on activeLayers state
    Object.entries(activeLayers).forEach(([layerId, isVisible]) => {
      const mapLayerId = `${layerId}-layer`;
      if (map.getLayer(mapLayerId)) {
        map.setLayoutProperty(
          mapLayerId,
          'visibility',
          isVisible ? 'visible' : 'none'
        );
      }
    });

    // Add hover effects and popups
    const addLayerInteractions = (layerId, sourceId) => {
      let hoveredStateId = null;
      let tooltip = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'tooltip-popup'
      });

      // Mouse enter
      map.current.on('mouseenter', layerId, (e) => {
        if (e.features.length === 0) return;
        map.current.getCanvas().style.cursor = 'pointer';
        
        if (hoveredStateId) {
          map.current.setFeatureState(
            { source: sourceId, id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = e.features[0].id;
        map.current.setFeatureState(
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
        }

        tooltip
          .setLngLat(coordinates)
          .setHTML(tooltipContent)
          .addTo(map.current);
      });

      // Mouse leave
      map.current.on('mouseleave', layerId, () => {
        map.current.getCanvas().style.cursor = '';
        if (hoveredStateId) {
          map.current.setFeatureState(
            { source: sourceId, id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        tooltip.remove();
      });

      // Click for detailed popup
      map.current.on('click', layerId, async (e) => {
        if (e.features.length === 0) return;
        
        const feature = e.features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const layerType = layerId.replace('-layer', '');

        // Remove any existing tooltip
        tooltip.remove();
        
        try {
          // Fetch additional details if needed
          let extraDetails = {};
          switch (layerType) {
            case 'solar-permits':
              extraDetails = await fetchSolarPermitDetails(feature.properties.id);
              break;
            case 'ev-stations':
              extraDetails = await fetchEVStationDetails(feature.properties.id);
              break;
            case 'utility-boundaries':
              extraDetails = await fetchUtilityDetails(feature.properties.id);
              break;
          }

          // Create detailed popup with extra information
          new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '300px',
            className: 'custom-popup'
          })
            .setLngLat(coordinates)
            .setHTML(createPopupContent(feature, layerType, extraDetails))
            .addTo(map.current);
        } catch (error) {
          console.error('Error fetching additional details:', error);
          // Show basic popup if fetch fails
          new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '300px',
            className: 'custom-popup'
          })
            .setLngLat(coordinates)
            .setHTML(createPopupContent(feature, layerType))
            .addTo(map.current);
        }
      });
    };

    // Add interactions to all interactive layers
    ['solar-permits', 'ev-stations', 'utility-boundaries', 'move-ins', 'neighborhoods'].forEach(layerId => {
      addLayerInteractions(`${layerId}-layer`, layerId);
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
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      countries: 'us',
      types: 'address,place,region,postcode',
      placeholder: 'Search for a location',
      marker: false,
      collapsed: false,
      clearOnBlur: false,
      minLength: 3,
      limit: 5,
      flyTo: {
        speed: 1.2,
        curve: 1,
        easing: (t) => t,
      },
      render: (item) => {
        const { place_name, place_type, text } = item;
        const icon = place_type[0] === 'address' ? '🏠' :
                    place_type[0] === 'place' ? '🏙️' :
                    place_type[0] === 'region' ? '🗺️' : '📍';

        return `<div class="custom-geocoder-result">
                  <div class="result-icon">${icon}</div>
                  <div class="result-content">
                    <div class="result-primary">${text}</div>
                    <div class="result-secondary">${place_name}</div>
                  </div>
                </div>`;
      }
    });

    // Add the geocoder to the map
    if (map.current) {
      map.current.addControl(geocoder, 'top-right');
    }

    // Handle result selection
    geocoder.on('result', (e) => {
      const { result } = e;
      const { center, bbox } = result;

      if (bbox) {
        map.current.fitBounds(bbox, {
          padding: 50,
          maxZoom: 15
        });
      } else {
        map.current.flyTo({
          center,
          zoom: 15
        });
      }

      // Update visible data based on new location
      loadMapData();
    });

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
        zoom: 13
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

      // Enhanced geocoder setup with collapsed state
      const geocoder = new MapboxGeocoder({
        ...GEOCODER_OPTIONS,
        collapsed: true, // Start collapsed
        clearOnBlur: true, // Clear when focus is lost
      });
      map.current.addControl(geocoder, 'top-right');

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
    if (!map.current || !mapBounds) return;

    try {
      // Show loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'map-loading-indicator';
      loadingIndicator.innerHTML = '<div class="spinner"></div>';
      map.current.getContainer().appendChild(loadingIndicator);

      const loadLayerData = async (layerId, fetchFunction, options = {}) => {
        if (!activeLayers[layerId]) return;

        try {
          const source = map.current.getSource(layerId);
          if (!source) {
            console.warn(`Source not found for layer: ${layerId}`);
            return;
          }

          // Show loading state for the layer
          if (options.showLoading) {
            map.current.setLayoutProperty(
              `${layerId}-layer`,
              'visibility',
              'none'
            );
          }

          // Get visible bounds
          const bounds = map.current.getBounds();
          const visibleBounds = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ];

          // Get current zoom level for data resolution
          const zoom = map.current.getZoom();
          
          // Fetch data with bounds and zoom
          const data = await fetchFunction({
            bounds: visibleBounds,
            zoom,
            filters: filters // Pass current filters
          });

          // Update source data
          source.setData(data);

          // If this is a heatmap or choropleth layer, update the corresponding source
          if (layerId === 'ev-stations' && activeLayers.evStationsHeatmap) {
            const heatSource = map.current.getSource('ev-stations-heat');
            if (heatSource) {
              heatSource.setData(data);
            }
          }

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
          showError(`Failed to load ${layerId} data`);
        }
      };

      // Load demographic data for choropleth
      const loadDemographicData = async () => {
        if (!activeLayers.demographicsChoropleth) return;

        try {
          const bounds = map.current.getBounds();
          const data = await fetchDemographicData({
            bounds: [
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth()
            ],
            filters: filters.demographics
          });

          const source = map.current.getSource('demographics');
          if (source) {
            source.setData(data);
          }
        } catch (error) {
          console.error('Error loading demographic data:', error);
          showError('Failed to load demographic data');
        }
      };

      // Load all active layer data in parallel
      await Promise.all([
        loadLayerData('utility-boundaries', fetchUtilityBoundaries, { showLoading: true }),
        loadLayerData('solar-permits', fetchSolarInstallations, { showLoading: true }),
        loadLayerData('ev-stations', fetchEVStations, { showLoading: true }),
        loadLayerData('move-ins', fetchMoveIns),
        loadLayerData('neighborhoods', fetchNeighborhoods),
        loadLayerData('city-boundaries', fetchCityBoundaries),
        loadDemographicData()
      ]);

      // Update filters after data is loaded
      updateLayerFilters();

      // Remove loading indicator
      const indicator = map.current.getContainer().querySelector('.map-loading-indicator');
      if (indicator) {
        indicator.remove();
      }
    } catch (error) {
      console.error('Error loading map data:', error);
      showError('Failed to load map data');
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

    // Debounced version of loadMapData
    const debouncedLoadData = debounce(() => {
      const bounds = map.current.getBounds();
      setMapBounds([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ]);
      loadMapData();
    }, 300);

    // Add event listeners for map movement
    map.current.on('moveend', debouncedLoadData);
    map.current.on('zoomend', debouncedLoadData);
    
    // Load initial data
    debouncedLoadData();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.off('moveend', debouncedLoadData);
        map.current.off('zoomend', debouncedLoadData);
      }
    };
  }, [mapLoaded, activeLayers, filters]);

  // Enhanced layer filter function
  const updateLayerFilters = () => {
    if (!map.current) return;

    const layers = {
      'solar-permits-layer': createSolarPermitsFilter(),
      'ev-stations-layer': createEVStationsFilter(),
      'demographics-layer': createDemographicsFilter(),
      'utility-boundaries-layer': createUtilityBoundariesFilter()
    };

    Object.entries(layers).forEach(([layerId, filter]) => {
      if (map.current.getLayer(layerId)) {
        map.current.setFilter(layerId, filter);
      }
    });
  };

  const createSolarPermitsFilter = () => {
    const { solarPermits } = filters;
    const filterArray = ['all'];
    
    // Date range filter
    if (solarPermits.dateRange[0] && solarPermits.dateRange[1]) {
      filterArray.push([
        'all',
        ['>=', ['get', 'applicationDate'], solarPermits.dateRange[0]],
        ['<=', ['get', 'applicationDate'], solarPermits.dateRange[1]]
      ]);
    }

    // System capacity filter
    if (solarPermits.capacityRange[0] !== 0 || solarPermits.capacityRange[1] !== 50) {
      filterArray.push([
        'all',
        ['>=', ['get', 'systemSize'], solarPermits.capacityRange[0]],
        ['<=', ['get', 'systemSize'], solarPermits.capacityRange[1]]
      ]);
    }

    // Status filter
    if (solarPermits.status !== 'all') {
      filterArray.push(['==', ['get', 'status'], solarPermits.status]);
    }

    // Battery filter
    if (solarPermits.hasBattery) {
      filterArray.push(['==', ['get', 'hasBattery'], true]);
    }

    // Installer filters
    const installerFilters = [];
    Object.entries(solarPermits.installers).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case 'allBankrupt':
            installerFilters.push(['==', ['get', 'installerStatus'], 'bankrupt']);
            break;
          case 'expiredBankrupt':
            installerFilters.push([
              'all',
              ['==', ['get', 'installerStatus'], 'bankrupt'],
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

    return filterArray;
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

  // Toggle layer visibility
  const toggleLayer = (layerId) => {
    if (!map.current) return;

    setActiveLayers(prev => {
      const newLayers = { ...prev, [layerId]: !prev[layerId] };
      
      // Update layer visibility in Mapbox
      const mapLayerId = `${layerId}-layer`;
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(
          mapLayerId,
          'visibility',
          newLayers[layerId] ? 'visible' : 'none'
        );

        // If this is a data layer, trigger a data refresh
        if (['solar-permits', 'ev-stations', 'utility-boundaries', 'move-ins'].includes(layerId)) {
          loadMapData();
        }
      }

      return newLayers;
    });
  };

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