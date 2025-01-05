import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchDemographicData } from '../../services/censusService';
import { fetchNeighborhoods, fetchSolarInstallations, fetchMoveIns } from '../../services/solarscoutService';
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
  const [mapBounds, setMapBounds] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    leads: true,
    houses: false,
    neighborhoodInsights: false,
    utilityBoundaries: false,
    solarPermits: true,
    roofPermits: false,
    hvacPermits: false,
    poolPermits: false,
    moveIns: true,
    cityBoundaries: true,
    solarPotentialAI: false,
    manufacturedHomes: false,
    hoas: false,
    spanishSpeakers: false,
    zipcodeStats: false,
    sgip: false,
    adRespondents: false,
    evOwners: false
  });
  const [filters, setFilters] = useState({
    propertyType: 'all',
    priceRange: [0, 1000000],
    yearBuilt: [1900, 2024],
    dateRange: [
      '2024-10-07',
      '2025-01-05'
    ],
    capacityRange: [0, 50],
    expiredPermits: false,
    recentPermits: false,
    hasBattery: false,
    bankruptInstallers: false,
    expiredBankruptPermits: false,
    lumio: false,
    titanSolar: false,
    sunpower: false
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [visiblePanels, setVisiblePanels] = useState({
    filters: false,
    leads: false,
    stats: false,
    propertyDetails: false
  });
  const [mapStyle, setMapStyle] = useState('satellite');

  const initializeLayers = (map) => {
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

    // Improved hover effects using feature state
    let hoveredStateId = null;
    const hoverableLayers = ['move-ins-layer', 'solar-installations-layer', 'neighborhoods-layer'];
    
    hoverableLayers.forEach(layerId => {
      map.on('mousemove', layerId, (e) => {
        if (e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: layerId.replace('-layer', ''), id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id;
          map.setFeatureState(
            { source: layerId.replace('-layer', ''), id: hoveredStateId },
            { hover: true }
          );
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', layerId, () => {
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: layerId.replace('-layer', ''), id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        map.getCanvas().style.cursor = '';
      });
    });

    // Enhanced popup styling with icons
    const createPopupContent = (feature, type) => {
      const { properties } = feature;
      const icons = {
        price: '💰',
        year: '🏗️',
        size: '📏',
        capacity: '⚡',
        date: '📅',
        type: '🏠'
      };
      
      let content = '';
      
      if (type === 'move-in') {
        content = `
          <div class="popup-content">
            <h4>${properties.address}</h4>
            <div class="popup-details">
              <div class="popup-detail">
                <span class="label">${icons.price} Price:</span>
                <span class="value">$${properties.price.toLocaleString()}</span>
              </div>
              <div class="popup-detail">
                <span class="label">${icons.year} Year Built:</span>
                <span class="value">${properties.yearBuilt}</span>
              </div>
              <div class="popup-detail">
                <span class="label">${icons.size} Size:</span>
                <span class="value">${properties.squareFeet.toLocaleString()} sq ft</span>
              </div>
            </div>
          </div>
        `;
      } else if (type === 'solar') {
        content = `
          <div class="popup-content">
            <h4>${properties.address}</h4>
            <div class="popup-details">
              <div class="popup-detail">
                <span class="label">${icons.capacity} Capacity:</span>
                <span class="value">${properties.capacity} kW</span>
              </div>
              <div class="popup-detail">
                <span class="label">${icons.date} Install Date:</span>
                <span class="value">${properties.installDate}</span>
              </div>
              <div class="popup-detail">
                <span class="label">${icons.type} Type:</span>
                <span class="value">${properties.systemType}</span>
              </div>
            </div>
          </div>
        `;
      }
      
      return content;
    };

    // Add click handlers with enhanced popups
    map.on('click', 'move-ins-layer', (e) => {
      if (!e.features.length) return;
      
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      
      new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px',
        className: 'custom-popup'
      })
        .setLngLat(coordinates)
        .setHTML(createPopupContent(feature, 'move-in'))
        .addTo(map);
    });

    map.on('click', 'solar-installations-layer', (e) => {
      if (!e.features.length) return;
      
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      
      new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px',
        className: 'custom-popup'
      })
        .setLngLat(coordinates)
        .setHTML(createPopupContent(feature, 'solar'))
        .addTo(map);
    });
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
  useEffect(() => {
    const loadMapData = async () => {
      if (!map.current || !mapBounds) return;

      try {
        // Load solar permits data if layer is active
        if (activeLayers.solarPermits) {
          const solarData = await fetchSolarInstallations(mapBounds, filters);
          if (map.current.getSource('solar-installations')) {
            map.current.getSource('solar-installations').setData(solarData);
          }
        }

        // Load move-ins data if layer is active
        if (activeLayers.moveIns) {
          const moveInsData = await fetchMoveIns(mapBounds, filters);
          if (map.current.getSource('move-ins')) {
            map.current.getSource('move-ins').setData(moveInsData);
          }
        }

        // Load neighborhoods data if layer is active
        if (activeLayers.neighborhoodInsights) {
          const neighborhoodsData = await fetchNeighborhoods(mapBounds);
          if (map.current.getSource('neighborhoods')) {
            map.current.getSource('neighborhoods').setData(neighborhoodsData);
          }
        }

        // Load city boundaries if layer is active
        if (activeLayers.cityBoundaries) {
          const cityData = await fetchCityBoundaries(mapBounds);
          if (map.current.getSource('city-boundaries')) {
            map.current.getSource('city-boundaries').setData(cityData);
          }
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    loadMapData();
  }, [mapBounds, activeLayers, filters]);

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
    setVisiblePanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // Handle property selection
  const handlePropertyClick = (feature) => {
    setSelectedProperty(feature.properties);
    setVisiblePanels(prev => ({
      ...prev,
      propertyDetails: true
    }));
  };

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
      {mapLoaded && (
        <>
          <MapControls onTogglePanel={setActivePanel} />
          <div className="panel-container">
            <LayersPanel
              visible={activePanel === 'layers'}
              activeLayers={activeLayers}
              onLayerToggle={toggleLayer}
              onClose={() => setActivePanel(null)}
              className={`panel layers-panel ${activePanel === 'layers' ? 'visible' : ''}`}
            />
            <LeadsPanel 
              visible={activePanel === 'leads'}
              onClose={() => setActivePanel(null)}
              className={`panel leads-panel ${activePanel === 'leads' ? 'visible' : ''}`}
            />
            <FiltersPanel
              visible={activePanel === 'filters'}
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setActivePanel(null)}
              className={`panel filters-panel ${activePanel === 'filters' ? 'visible' : ''}`}
            />
            <SolarPermitsPanel
              visible={activePanel === 'solar-permits'}
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setActivePanel(null)}
              className={`panel solar-permits-panel ${activePanel === 'solar-permits' ? 'visible' : ''}`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MapboxMap; 