import axios from 'axios'
import { API_CONFIG, handleApiError } from '../config/api'

// Massachusetts utility companies
const MA_UTILITIES = {
  'EVERSOURCE': {
    name: 'Eversource',
    color: '#4CAF50',
    borderColor: '#388E3C'
  },
  'NATIONAL_GRID': {
    name: 'National Grid',
    color: '#2196F3',
    borderColor: '#1976D2'
  },
  'UNITIL': {
    name: 'Unitil',
    color: '#FFC107',
    borderColor: '#FFA000'
  }
}

export const fetchUtilityData = async (bounds) => {
  try {
    // First try to get data from Mass.gov API
    const response = await axios.get(
      'https://opendata.arcgis.com/datasets/MADOER::massachusetts-electric-utility-service-territories.geojson'
    )

    // Transform the features
    const features = response.data.features.map(feature => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        ...feature.properties,
        name: MA_UTILITIES[feature.properties.COMPANY]?.name || feature.properties.COMPANY,
        color: MA_UTILITIES[feature.properties.COMPANY]?.color || '#808080',
        borderColor: MA_UTILITIES[feature.properties.COMPANY]?.borderColor || '#666666',
        stats: {
          totalCustomers: feature.properties.CUSTOMERS || 'N/A',
          avgBill: feature.properties.AVG_BILL || 'N/A',
          solarAdoption: feature.properties.SOLAR_ADOPTION || 'N/A'
        }
      }
    }))

    // Filter to bounds if provided
    const filteredFeatures = bounds ? features.filter(feature => {
      // Simple bounds check - could be enhanced with proper geometry intersection
      const coords = feature.geometry.coordinates[0]
      const inBounds = coords.some(coord => 
        coord[0] >= bounds.west &&
        coord[0] <= bounds.east &&
        coord[1] >= bounds.south &&
        coord[1] <= bounds.north
      )
      return inBounds
    }) : features

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    }
  } catch (error) {
    handleApiError(error, 'Utility Data')
    console.error('Error fetching utility data:', error)
    
    // Fallback to static data for Springfield area
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          name: 'Eversource',
          color: '#4CAF50',
          borderColor: '#388E3C',
          stats: {
            totalCustomers: '1.2M',
            avgBill: '$150',
            solarAdoption: '15%'
          }
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-72.7, 42.2],
            [-72.4, 42.2],
            [-72.4, 42.0],
            [-72.7, 42.0],
            [-72.7, 42.2]
          ]]
        }
      }]
    }
  }
}

// Helper function to get utility boundary style
export const getUtilityBoundaryStyle = (feature) => {
  return {
    fillColor: feature.properties.color || '#808080',
    color: feature.properties.borderColor || '#666666',
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.2
  }
} 