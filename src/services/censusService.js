import axios from 'axios'
import { API_CONFIG, getHeaders, handleApiError, CACHE_CONFIG } from '../config/api'

// Census API Variables
const CENSUS_VARIABLES = {
  TOTAL_POPULATION: 'B01003_001E',
  MEDIAN_HOUSEHOLD_INCOME: 'B19013_001E',
  MEDIAN_HOME_VALUE: 'B25077_001E',
  TOTAL_HOUSING_UNITS: 'B25001_001E',
  OWNER_OCCUPIED: 'B25003_002E',
  RENTER_OCCUPIED: 'B25003_003E',
  SOLAR_ENERGY: 'B25040_010E',
  SPANISH_SPEAKERS: 'B16001_003E',
  MEDIAN_AGE: 'B01002_001E',
  EDUCATION_BACHELORS_OR_HIGHER: 'B15003_022E'
}

const cache = new Map()
let lastRequestTime = 0
const REQUEST_DELAY = 1000 // 1 second delay between requests

// Helper function to check if cache is valid
const isCacheValid = (key) => {
  const cached = cache.get(key)
  if (!cached) return false
  return (Date.now() - cached.timestamp) < CACHE_CONFIG.censusData.duration
}

// Rate limiting function
const waitForRateLimit = async () => {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

// Convert lat/lng to Census Block FIPS with retries
export const getFipsFromCoords = async (lat, lng, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await waitForRateLimit()
      
      const url = `${API_CONFIG.census.baseUrl}/geocoder/geographies/coordinates`
      const response = await axios.get(url, {
        params: {
          x: lng,
          y: lat,
          benchmark: 'Public_AR_Census2020',
          vintage: 'Census2020_Census2020',
          layers: 'all',
          format: 'json',
          key: API_CONFIG.census.token
        },
        headers: getHeaders('census')
      })

      const result = response.data.result
      return {
        state: result.states[0].GEOID,
        county: result.counties[0].GEOID,
        tract: result.census_tracts[0].GEOID,
        block: result.census_blocks[0].GEOID
      }
    } catch (error) {
      if (i === retries - 1) {
        handleApiError(error, 'Census Geocoding')
        return null
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Fetch demographic data with fallback to cached data
export const fetchDemographicData = async (bounds) => {
  try {
    const cacheKey = JSON.stringify(bounds)
    if (isCacheValid(cacheKey)) {
      console.log('Using cached census data')
      return cache.get(cacheKey).data
    }

    // In development, use mock data to avoid CORS issues
    if (import.meta.env.DEV) {
      console.log('Using mock census data in development')
      return {
        type: 'FeatureCollection',
        features: []
      }
    }

    await waitForRateLimit()

    // Get FIPS codes for the center of the viewport
    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.west + bounds.east) / 2
    const fips = await getFipsFromCoords(centerLat, centerLng)

    if (!fips) {
      console.warn('Could not determine location FIPS codes, using mock data')
      return {
        type: 'FeatureCollection',
        features: []
      }
    }

    // Fetch demographic data using FIPS codes
    const url = `${API_CONFIG.census.baseUrl}/2020/acs/acs5`
    const variables = Object.values(CENSUS_VARIABLES).join(',')
    
    const response = await axios.get(url, {
      params: {
        get: variables,
        for: `tract:*`,
        in: `state:${fips.state} county:${fips.county}`,
        key: API_CONFIG.census.token
      },
      headers: getHeaders('census')
    })

    const [headers, ...data] = response.data
    
    // Transform into GeoJSON
    const result = {
      type: 'FeatureCollection',
      features: data.map(row => ({
        type: 'Feature',
        properties: {
          totalPopulation: parseInt(row[headers.indexOf(CENSUS_VARIABLES.TOTAL_POPULATION)]) || 0,
          medianIncome: parseInt(row[headers.indexOf(CENSUS_VARIABLES.MEDIAN_HOUSEHOLD_INCOME)]) || 0,
          medianHomeValue: parseInt(row[headers.indexOf(CENSUS_VARIABLES.MEDIAN_HOME_VALUE)]) || 0,
          totalHousingUnits: parseInt(row[headers.indexOf(CENSUS_VARIABLES.TOTAL_HOUSING_UNITS)]) || 0,
          ownerOccupied: parseInt(row[headers.indexOf(CENSUS_VARIABLES.OWNER_OCCUPIED)]) || 0,
          renterOccupied: parseInt(row[headers.indexOf(CENSUS_VARIABLES.RENTER_OCCUPIED)]) || 0,
          solarEnergy: parseInt(row[headers.indexOf(CENSUS_VARIABLES.SOLAR_ENERGY)]) || 0,
          spanishSpeakers: parseInt(row[headers.indexOf(CENSUS_VARIABLES.SPANISH_SPEAKERS)]) || 0,
          medianAge: parseFloat(row[headers.indexOf(CENSUS_VARIABLES.MEDIAN_AGE)]) || 0,
          educationBachelorsOrHigher: parseInt(row[headers.indexOf(CENSUS_VARIABLES.EDUCATION_BACHELORS_OR_HIGHER)]) || 0,
          tract: row[headers.indexOf('tract')],
          county: row[headers.indexOf('county')],
          state: row[headers.indexOf('state')]
        }
      }))
    }

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.warn('Error fetching Census data, using empty dataset:', error)
    return {
      type: 'FeatureCollection',
      features: []
    }
  }
}

// Fetch specific demographic indicators
export const fetchDemographicIndicators = async (state, county, variables) => {
  try {
    const url = `${API_CONFIG.census.baseUrl}/2020/acs/acs5`
    const response = await axios.get(url, {
      params: {
        get: variables.join(','),
        for: `county:${county}`,
        in: `state:${state}`,
        key: API_CONFIG.census.token
      },
      headers: getHeaders('census')
    })

    const [headers, data] = response.data
    
    // Transform into key-value pairs
    return variables.reduce((acc, variable, index) => {
      acc[variable] = parseInt(data[headers.indexOf(variable)])
      return acc
    }, {})
  } catch (error) {
    handleApiError(error, 'Census Indicators')
    return {}
  }
}

// Clear cache
export const clearCache = () => {
  cache.clear()
} 