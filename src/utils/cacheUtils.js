const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000 // 24 hours
};

const PREFERENCES_KEY = 'gamechangrr_preferences';
const LAYER_CACHE_PREFIX = 'layer_cache_';

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), CACHE_DURATION.MEDIUM);
    this.loadPreferences();
  }

  generateKey(type, bounds, filters = {}) {
    const boundsKey = bounds ? bounds.join(',') : 'all';
    const filtersKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');
    return `${type}:${boundsKey}:${filtersKey}`;
  }

  set(type, bounds, filters, data, duration = CACHE_DURATION.SHORT) {
    const key = this.generateKey(type, bounds, filters);
    this.cache.set(key, {
      data,
      expires: Date.now() + duration
    });
  }

  get(type, bounds, filters) {
    const key = this.generateKey(type, bounds, filters);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    if (cached.expires <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  // User preferences management
  loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      this.preferences = saved ? JSON.parse(saved) : this.getDefaultPreferences();
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      layers: {
        moveIns: false,
        solarPermits: false,
        utilityBoundaries: false,
        evStations: false
      },
      filters: {
        solarPermits: {
          dateRange: [null, null],
          capacityRange: [0, 50],
          status: 'all',
          hasBattery: false,
          showExpired: true,
          showBankrupt: true
        },
        moveIns: {
          dateRange: [null, null],
          propertyType: 'all',
          priceRange: [0, 1000000]
        }
      },
      mapStyle: 'satellite',
      layerOpacities: {
        'solar-permits': 1,
        'utility-boundaries': 0.7,
        'move-ins': 1,
        'ev-stations': 1
      }
    };
  }

  savePreferences(preferences) {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      this.preferences = preferences;
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  getPreferences() {
    return this.preferences;
  }

  updatePreferences(updates) {
    const newPreferences = {
      ...this.preferences,
      ...updates
    };
    this.savePreferences(newPreferences);
    return newPreferences;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

const cacheManager = new CacheManager();

export const cacheData = (type, bounds, filters, data, duration) => {
  cacheManager.set(type, bounds, filters, data, duration);
};

export const getCachedData = (type, bounds, filters) => {
  return cacheManager.get(type, bounds, filters);
};

export const clearCache = () => {
  cacheManager.clear();
};

export const saveUserPreferences = (preferences) => {
  return cacheManager.savePreferences(preferences);
};

export const loadUserPreferences = () => {
  return cacheManager.getPreferences();
};

export const updateUserPreferences = (updates) => {
  return cacheManager.updatePreferences(updates);
};

export const getCacheDuration = (type) => {
  switch (type) {
    case 'utility-boundaries':
      return CACHE_DURATION.LONG;
    case 'solar-permits':
    case 'move-ins':
      return CACHE_DURATION.MEDIUM;
    default:
      return CACHE_DURATION.SHORT;
  }
}; 