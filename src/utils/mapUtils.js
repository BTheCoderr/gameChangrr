import { validateApiRequest, ValidationError } from './validationUtils';

// Constants for map markers and styling
const MAP_CONSTANTS = {
  defaultCenter: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  defaultZoom: 12,
  clusterRadius: 50,
  maxClusterZoom: 14,
  markerColors: {
    HIGH: '#28a745',
    MEDIUM: '#ffc107',
    LOW: '#dc3545',
    DEFAULT: '#6c757d'
  },
  loadingStates: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
  }
};

// Validate and process property data for map markers
export const processPropertyMarkers = (properties) => {
  if (!Array.isArray(properties)) {
    throw new ValidationError('Invalid properties data', { 
      message: 'Properties must be an array' 
    });
  }

  return properties.map(property => {
    try {
      // Extract required fields with fallbacks
      const {
        id = generateFallbackId(),
        address = {},
        propertyType = 'Unknown',
        energyStarScore = 0,
        leadPriority = { level: 'LOW' }
      } = property;

      // Validate and normalize coordinates
      const coordinates = extractCoordinates(property, address);

      // Generate marker properties
      return {
        id,
        position: coordinates,
        title: formatAddress(address),
        propertyType,
        energyScore: energyStarScore,
        priority: leadPriority.level,
        icon: generateMarkerIcon(leadPriority.level),
        isValid: true
      };
    } catch (error) {
      console.warn(`Invalid property data for marker: ${error.message}`, property);
      return generateFallbackMarker(property);
    }
  }).filter(marker => marker !== null);
};

// Extract and validate coordinates
const extractCoordinates = (property, address) => {
  // Try different possible locations for coordinates
  const lat = property.lat || property.latitude || address.latitude;
  const lng = property.lng || property.longitude || address.longitude;

  if (!isValidCoordinate(lat, lng)) {
    throw new ValidationError('Invalid coordinates', { lat, lng });
  }

  return { lat, lng };
};

// Validate coordinate pair
const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// Format address with fallbacks
const formatAddress = (address) => {
  if (typeof address === 'string') return address;

  const {
    street = 'Unknown Street',
    city = 'Unknown City',
    state = 'XX',
    zipCode = ''
  } = address;

  return `${street}, ${city}, ${state} ${zipCode}`.trim();
};

// Generate marker icon based on priority
const generateMarkerIcon = (priority) => {
  const color = MAP_CONSTANTS.markerColors[priority] || MAP_CONSTANTS.markerColors.DEFAULT;
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: color,
    fillOpacity: 0.9,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 1.5
  };
};

// Generate fallback marker for invalid data
const generateFallbackMarker = (property) => {
  try {
    return {
      id: property.id || generateFallbackId(),
      position: MAP_CONSTANTS.defaultCenter,
      title: 'Invalid Property Data',
      propertyType: 'Unknown',
      energyScore: 0,
      priority: 'LOW',
      icon: generateMarkerIcon('DEFAULT'),
      isValid: false
    };
  } catch (error) {
    console.error('Failed to generate fallback marker:', error);
    return null;
  }
};

// Generate unique fallback ID
const generateFallbackId = () => {
  return `fallback-${Math.random().toString(36).substr(2, 9)}`;
};

// Handle map layer loading states
export class MapLayerManager {
  constructor() {
    this.layers = new Map();
    this.loadingState = MAP_CONSTANTS.loadingStates.IDLE;
    this.errors = [];
  }

  setLayerLoading(layerId) {
    this.layers.set(layerId, MAP_CONSTANTS.loadingStates.LOADING);
    this.updateLoadingState();
  }

  setLayerLoaded(layerId) {
    this.layers.set(layerId, MAP_CONSTANTS.loadingStates.SUCCESS);
    this.updateLoadingState();
  }

  setLayerError(layerId, error) {
    this.layers.set(layerId, MAP_CONSTANTS.loadingStates.ERROR);
    this.errors.push({ layerId, error });
    this.updateLoadingState();
  }

  updateLoadingState() {
    const states = Array.from(this.layers.values());
    
    if (states.includes(MAP_CONSTANTS.loadingStates.LOADING)) {
      this.loadingState = MAP_CONSTANTS.loadingStates.LOADING;
    } else if (states.includes(MAP_CONSTANTS.loadingStates.ERROR)) {
      this.loadingState = MAP_CONSTANTS.loadingStates.ERROR;
    } else if (states.every(state => state === MAP_CONSTANTS.loadingStates.SUCCESS)) {
      this.loadingState = MAP_CONSTANTS.loadingStates.SUCCESS;
    } else {
      this.loadingState = MAP_CONSTANTS.loadingStates.IDLE;
    }
  }

  isLoading() {
    return this.loadingState === MAP_CONSTANTS.loadingStates.LOADING;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

// Cluster configuration for multiple markers
export const getClusterConfig = (markers) => {
  return {
    maxZoom: MAP_CONSTANTS.maxClusterZoom,
    radius: MAP_CONSTANTS.clusterRadius,
    reducer: (cluster) => ({
      ...cluster,
      priority: calculateClusterPriority(cluster.markers),
      icon: generateClusterIcon(cluster)
    })
  };
};

// Calculate priority for a cluster of markers
const calculateClusterPriority = (markers) => {
  const priorities = markers.map(marker => marker.priority);
  const highCount = priorities.filter(p => p === 'HIGH').length;
  const mediumCount = priorities.filter(p => p === 'MEDIUM').length;
  
  if (highCount > markers.length / 3) return 'HIGH';
  if (mediumCount > markers.length / 2) return 'MEDIUM';
  return 'LOW';
};

// Generate icon for marker clusters
const generateClusterIcon = (cluster) => {
  const count = cluster.markers.length;
  const priority = calculateClusterPriority(cluster.markers);
  const color = MAP_CONSTANTS.markerColors[priority];

  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: color,
    fillOpacity: 0.9,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    scale: 2,
    label: {
      text: count.toString(),
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 'bold'
    }
  };
};

// Map event handlers with error boundaries
export const createMapEventHandlers = (callbacks) => {
  return {
    onLoad: (map) => {
      try {
        callbacks.onLoad?.(map);
      } catch (error) {
        console.error('Error in map load handler:', error);
      }
    },
    onClick: (event) => {
      try {
        callbacks.onClick?.(event);
      } catch (error) {
        console.error('Error in map click handler:', error);
      }
    },
    onIdle: () => {
      try {
        callbacks.onIdle?.();
      } catch (error) {
        console.error('Error in map idle handler:', error);
      }
    },
    onBoundsChanged: () => {
      try {
        callbacks.onBoundsChanged?.();
      } catch (error) {
        console.error('Error in bounds changed handler:', error);
      }
    }
  };
};

// Map viewport state manager
export class MapViewportManager {
  constructor(initialCenter = MAP_CONSTANTS.defaultCenter, initialZoom = MAP_CONSTANTS.defaultZoom) {
    this.center = initialCenter;
    this.zoom = initialZoom;
    this.bounds = null;
  }

  updateViewport(center, zoom, bounds) {
    this.center = center || this.center;
    this.zoom = zoom || this.zoom;
    this.bounds = bounds || this.bounds;
  }

  fitMarkers(markers) {
    if (!markers || markers.length === 0) {
      return {
        center: this.center,
        zoom: this.zoom
      };
    }

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
      if (marker.position && isValidCoordinate(marker.position.lat, marker.position.lng)) {
        bounds.extend(marker.position);
      }
    });

    return {
      center: bounds.getCenter().toJSON(),
      zoom: this.calculateZoomLevel(bounds)
    };
  }

  calculateZoomLevel(bounds) {
    // Implementation depends on your specific needs
    // This is a simple example
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const latFraction = (ne.lat() - sw.lat()) / 180;
    const lngFraction = (ne.lng() - sw.lng()) / 360;

    const latZoom = Math.floor(Math.log(WORLD_DIM.height / latFraction) / Math.LN2);
    const lngZoom = Math.floor(Math.log(WORLD_DIM.width / lngFraction) / Math.LN2);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  }
}; 