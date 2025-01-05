import axios from 'axios'
import { API_CONFIG, getHeaders, handleApiError, CACHE_CONFIG } from '../config/api'

const cache = new Map()

const isCacheValid = (key) => {
  const cached = cache.get(key)
  if (!cached) return false
  return (Date.now() - cached.timestamp) < CACHE_CONFIG.propertyData.duration
}

export const getPropertyData = async (lat, lng) => {
  try {
    const cacheKey = `${lat},${lng}`
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey).data
    }

    const response = await axios.get(`${API_CONFIG.regrid.baseUrl}/parcels/point`, {
      params: {
        lat,
        lon: lng
      },
      headers: getHeaders('regrid')
    })

    const parcel = response.data.results[0]
    if (!parcel) return null

    const result = {
      parcelId: parcel.parcel_id,
      address: parcel.address,
      ownerName: parcel.owner_name,
      landUse: parcel.land_use,
      zoning: parcel.zoning,
      lotSize: parcel.lot_size_sqft,
      yearBuilt: parcel.year_built,
      lastSale: {
        date: parcel.last_sale_date,
        price: parcel.last_sale_price
      },
      geometry: parcel.geometry
    }

    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    handleApiError(error, 'Regrid Property')
    return null
  }
}

export const searchProperties = async (bounds, filters = {}) => {
  try {
    const cacheKey = JSON.stringify({ bounds, filters })
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey).data
    }

    const response = await axios.get(`${API_CONFIG.regrid.baseUrl}/parcels/search`, {
      params: {
        bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
        ...filters
      },
      headers: getHeaders('regrid')
    })

    const result = {
      type: 'FeatureCollection',
      features: response.data.results.map(parcel => ({
        type: 'Feature',
        geometry: parcel.geometry,
        properties: {
          parcelId: parcel.parcel_id,
          address: parcel.address,
          ownerName: parcel.owner_name,
          landUse: parcel.land_use,
          zoning: parcel.zoning,
          lotSize: parcel.lot_size_sqft,
          yearBuilt: parcel.year_built,
          lastSaleDate: parcel.last_sale_date,
          lastSalePrice: parcel.last_sale_price
        }
      }))
    }

    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    handleApiError(error, 'Regrid Search')
    return null
  }
}

/**
 * Fetches property boundaries within the specified bounding box and filters
 * @param {Object} boundingBox - The geographic bounds to fetch properties within
 * @param {Object} filters - The filters to apply to the property search
 * @returns {Promise<GeoJSON>} A GeoJSON object containing property boundaries
 */
export const fetchPropertyBoundaries = async (boundingBox, filters) => {
  try {
    const cacheKey = JSON.stringify({ boundingBox, filters })
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey).data
    }

    const response = await axios.get(`${API_CONFIG.regrid.baseUrl}/parcels/search`, {
      params: {
        bbox: `${boundingBox.west},${boundingBox.south},${boundingBox.east},${boundingBox.north}`,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        minYear: filters.yearBuilt[0],
        maxYear: filters.yearBuilt[1],
        propertyType: filters.propertyType !== 'all' ? filters.propertyType : undefined,
        startDate: filters.dateRange[0],
        endDate: filters.dateRange[1]
      },
      headers: getHeaders('regrid')
    })

    const result = {
      type: 'FeatureCollection',
      features: response.data.results.map(parcel => ({
        type: 'Feature',
        geometry: parcel.geometry,
        properties: {
          parcelId: parcel.parcel_id,
          address: parcel.address,
          price: parcel.last_sale_price,
          yearBuilt: parcel.year_built,
          propertyType: parcel.land_use,
          sqft: parcel.lot_size_sqft
        }
      }))
    }

    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error('Error fetching property boundaries:', error)
    return {
      type: 'FeatureCollection',
      features: []
    }
  }
};

/**
 * Fetches city boundaries within the specified bounding box
 * @param {Object} boundingBox - The geographic bounds to fetch boundaries within
 * @returns {Promise<GeoJSON>} A GeoJSON object containing city boundaries
 */
export const fetchCityBoundaries = async (boundingBox) => {
  try {
    const cacheKey = JSON.stringify({ type: 'city-boundaries', boundingBox });
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey).data;
    }

    const response = await axios.get(`${API_CONFIG.regrid.baseUrl}/boundaries/cities`, {
      params: {
        bbox: `${boundingBox.west},${boundingBox.south},${boundingBox.east},${boundingBox.north}`
      },
      headers: getHeaders('regrid')
    });

    const result = {
      type: 'FeatureCollection',
      features: response.data.results.map(city => ({
        type: 'Feature',
        geometry: city.geometry,
        properties: {
          cityId: city.city_id,
          name: city.name,
          state: city.state,
          population: city.population
        }
      }))
    };

    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Error fetching city boundaries:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}; 