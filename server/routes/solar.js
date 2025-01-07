import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { mockSolarData } from '../data/mockSolarData.js';

dotenv.config();

const router = express.Router();

// Helper function to validate bounds
const validateBounds = (bounds) => {
  if (!bounds) return false;
  const [west, south, east, north] = bounds.split(',').map(Number);
  return !isNaN(west) && !isNaN(south) && !isNaN(east) && !isNaN(north) &&
         west >= -180 && west <= 180 && east >= -180 && east <= 180 &&
         south >= -90 && south <= 90 && north >= -90 && north <= 90;
};

// Helper function to check if a permit is expired
const isPermitExpired = (permit) => {
  if (!permit.permit_expiration) return false;
  return new Date(permit.permit_expiration) < new Date();
};

// Get solar installations within a bounding box
router.get('/installations', async (req, res) => {
  try {
    const { bounds, zoom, includeExpired = 'true', includeBankrupt = 'true' } = req.query;

    // Validate bounds
    if (!validateBounds(bounds)) {
      return res.status(400).json({ 
        error: 'Invalid bounds format',
        message: 'Bounds should be in format: west,south,east,north'
      });
    }

    const [west, south, east, north] = bounds.split(',').map(Number);

    // Fetch from NREL OpenPV API
    try {
      const nrelResponse = await axios.get('https://developer.nrel.gov/api/solar/open_pv/installs/index', {
        params: {
          api_key: process.env.VITE_NREL_API_KEY,
          bbox: `${south},${west},${north},${east}`,
          mindate: '2020-01-01',
          maxdate: new Date().toISOString().split('T')[0],
          format: 'json'
        }
      });

      if (nrelResponse.data && nrelResponse.data.outputs) {
        console.log('NREL OpenPV API Response:', {
          count: nrelResponse.data.outputs.length,
          sample: nrelResponse.data.outputs[0]
        });

        // Transform to GeoJSON and add status tags
        const features = nrelResponse.data.outputs.map(install => {
          const tags = [];
          const permitExpiration = new Date(install.install_date);
          permitExpiration.setMonth(permitExpiration.getMonth() + 6);

          if (permitExpiration < new Date()) {
            tags.push('expired_permit');
          }

          // Check against known bankrupt installers
          if (mockSolarData.metadata.bankruptInstallers.some(
            bi => bi.name.toLowerCase() === (install.installer_name || '').toLowerCase()
          )) {
            tags.push('bankrupt_installer');
          }

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [install.lon, install.lat]
            },
            properties: {
              id: install.install_id,
              description: `${install.size_kw.toFixed(1)}kW Solar Installation`,
              capacity: install.size_kw,
              date_installed: install.install_date,
              system_type: install.sector || 'Residential',
              status: 'completed',
              address: install.address || `${install.city}, ${install.state} ${install.zip}`,
              installer: install.installer_name || 'N/A',
              installer_status: tags.includes('bankrupt_installer') ? 'bankrupt' : 'active',
              has_battery: false,
              cost: install.cost_per_watt ? (install.cost_per_watt * install.size_kw * 1000).toFixed(0) : null,
              incentive_program: install.incentive_prog_names || null,
              permit_number: `SOL-${new Date(install.install_date).getFullYear()}-${install.install_id}`,
              permit_status: tags.includes('expired_permit') ? 'Expired' : 'Approved',
              permit_date: install.install_date,
              permit_expiration: permitExpiration.toISOString().split('T')[0],
              tags
            }
          };
        });

        // Filter based on query parameters
        const filteredFeatures = features.filter(feature => {
          if (includeExpired === 'false' && feature.properties.tags.includes('expired_permit')) {
            return false;
          }
          if (includeBankrupt === 'false' && feature.properties.tags.includes('bankrupt_installer')) {
            return false;
          }
          return true;
        });

        return res.json({
          type: 'FeatureCollection',
          features: filteredFeatures,
          metadata: {
            source: 'NREL OpenPV',
            count: filteredFeatures.length,
            bounds: { west, south, east, north },
            query_date: new Date().toISOString(),
            bankruptInstallers: mockSolarData.metadata.bankruptInstallers,
            expiredPermits: {
              total: filteredFeatures.filter(f => f.properties.tags.includes('expired_permit')).length,
              bankruptInstallations: filteredFeatures.filter(f => f.properties.tags.includes('bankrupt_installer')).length
            }
          }
        });
      }
    } catch (nrelError) {
      console.warn('Failed to fetch NREL OpenPV data:', nrelError.message);
    }

    // If NREL API fails, use mock data
    const filteredFeatures = mockSolarData.features.filter(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const inBounds = lng >= west && lng <= east && lat >= south && lat <= north;
      
      if (!inBounds) return false;
      if (includeExpired === 'false' && feature.properties.tags?.includes('expired_permit')) {
        return false;
      }
      if (includeBankrupt === 'false' && feature.properties.tags?.includes('bankrupt_installer')) {
        return false;
      }
      return true;
    });

    res.json({
      type: 'FeatureCollection',
      features: filteredFeatures,
      metadata: {
        source: 'Mock Data',
        count: filteredFeatures.length,
        bounds: { west, south, east, north },
        query_date: new Date().toISOString(),
        bankruptInstallers: mockSolarData.metadata.bankruptInstallers,
        expiredPermits: mockSolarData.metadata.expiredPermits
      }
    });
  } catch (error) {
    console.error('Error in solar installations endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch solar installations',
      details: error.message,
      type: 'FeatureCollection',
      features: []
    });
  }
});

// Get expired permits
router.get('/expired-permits', async (req, res) => {
  try {
    const { bounds } = req.query;

    // Filter mock data for expired permits
    const expiredPermits = mockSolarData.features.filter(feature => {
      if (!bounds) return feature.properties.permit_status === 'Expired';
      
      const [west, south, east, north] = bounds.split(',').map(Number);
      const [lng, lat] = feature.geometry.coordinates;
      return feature.properties.permit_status === 'Expired' &&
             lng >= west && lng <= east && lat >= south && lat <= north;
    });

    res.json({
      type: 'FeatureCollection',
      features: expiredPermits,
      metadata: {
        count: expiredPermits.length,
        expiredPermits: mockSolarData.metadata.expiredPermits
      }
    });
  } catch (error) {
    console.error('Error fetching expired permits:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expired permits',
      details: error.message
    });
  }
});

// Get bankrupt installers
router.get('/bankrupt-installers', async (req, res) => {
  try {
    const { bounds } = req.query;

    // Filter mock data for bankrupt installers
    const bankruptInstallations = mockSolarData.features.filter(feature => {
      if (!bounds) return feature.properties.installer_status === 'bankrupt';
      
      const [west, south, east, north] = bounds.split(',').map(Number);
      const [lng, lat] = feature.geometry.coordinates;
      return feature.properties.installer_status === 'bankrupt' &&
             lng >= west && lng <= east && lat >= south && lat <= north;
    });

    res.json({
      type: 'FeatureCollection',
      features: bankruptInstallations,
      metadata: {
        count: bankruptInstallations.length,
        bankruptInstallers: mockSolarData.metadata.bankruptInstallers
      }
    });
  } catch (error) {
    console.error('Error fetching bankrupt installers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bankrupt installers',
      details: error.message
    });
  }
});

// Get solar installation details
router.get('/installations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Installation ID is required' });
    }

    // First try to find in test data
    const testInstallation = testData.features.find(
      feature => feature.properties.id === id
    );

    if (testInstallation) {
      return res.json(testInstallation);
    }

    // If not found in test data, try NREL API
    try {
      const nrelResponse = await axios.get(`https://developer.nrel.gov/api/solar/open_pv/installs/show`, {
        params: {
          api_key: process.env.VITE_NREL_API_KEY,
          install_id: id,
          format: 'json'
        }
      });

      if (nrelResponse.data && nrelResponse.data.outputs) {
        const install = nrelResponse.data.outputs[0];
        return res.json({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [install.lon, install.lat]
          },
          properties: {
            id: install.install_id,
            description: `${install.size_kw.toFixed(1)}kW Solar Installation`,
            capacity: install.size_kw,
            date_installed: install.install_date,
            system_type: install.sector || 'Residential',
            status: 'completed',
            address: install.address || `${install.city}, ${install.state} ${install.zip}`,
            installer: install.installer_name || 'N/A',
            has_battery: false,
            cost: install.cost_per_watt ? (install.cost_per_watt * install.size_kw * 1000).toFixed(0) : null,
            incentive_program: install.incentive_prog_names || null,
            permit_number: `SOL-${new Date(install.install_date).getFullYear()}-${install.install_id}`,
            permit_status: 'Approved',
            permit_date: new Date(install.install_date).toISOString().split('T')[0]
          }
        });
      }
    } catch (nrelError) {
      console.warn('Failed to fetch installation details from NREL:', nrelError.message);
    }

    res.status(404).json({ error: 'Installation not found' });
  } catch (error) {
    console.error('Error fetching solar installation details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch installation details',
      details: error.message
    });
  }
});

// Get solar potential for an address
router.get('/potential', async (req, res) => {
  try {
    const { lat, lng, roof_area } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!roof_area || isNaN(roof_area)) {
      return res.status(400).json({ error: 'Valid roof area is required' });
    }

    const response = await axios.get(`https://developer.nrel.gov/api/pvwatts/v6.json`, {
      params: {
        api_key: process.env.VITE_NREL_API_KEY,
        lat,
        lon: lng,
        system_capacity: (parseFloat(roof_area) * 0.15).toFixed(1), // Rough estimate based on roof area
        module_type: 1,
        array_type: 1,
        tilt: 20,
        azimuth: 180,
        losses: 14
      }
    });

    if (!response.data || !response.data.outputs) {
      throw new Error('Invalid response from NREL PVWatts API');
    }

    res.json({
      annual_production: response.data.outputs.ac_annual,
      monthly_production: response.data.outputs.ac_monthly,
      capacity: response.data.inputs.system_capacity,
      estimated_area: parseFloat(roof_area),
      metadata: {
        source: 'NREL PVWatts V6',
        query_date: new Date().toISOString(),
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        }
      }
    });
  } catch (error) {
    console.error('Error calculating solar potential:', error);
    res.status(500).json({ 
      error: 'Failed to calculate solar potential',
      details: error.message
    });
  }
});

export const solarRouter = router; 