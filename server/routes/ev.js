import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// EV data API configuration
const NREL_API_KEY = process.env.NREL_API_KEY;
const NREL_API_URL = process.env.NREL_API_URL;

// Get EV charging stations within a bounding box
router.get('/stations', async (req, res) => {
  try {
    const { bounds, zoom } = req.query;
    const [west, south, east, north] = bounds.split(',').map(Number);

    // Fetch from NREL Alternative Fuel Stations API
    const response = await axios.get(`${NREL_API_URL}/alt-fuel-stations/v1.json`, {
      params: {
        api_key: NREL_API_KEY,
        fuel_type: 'ELEC',
        status: 'E',  // E for Available, P for Planned
        access: 'public',
        bbox: `${west},${south},${east},${north}`,
        limit: 500
      }
    });

    // Transform to GeoJSON format
    const features = response.data.fuel_stations.map(station => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [station.longitude, station.latitude]
      },
      properties: {
        id: station.id,
        name: station.station_name,
        status: station.status_code,
        numChargers: station.ev_connector_types?.length || 0,
        connectorTypes: station.ev_connector_types,
        network: station.ev_network,
        address: {
          street: station.street_address,
          city: station.city,
          state: station.state,
          zip: station.zip
        },
        openTime: station.access_days_time,
        pricing: station.ev_pricing,
        phone: station.station_phone
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error('Error fetching EV stations:', error);
    res.json({
      type: 'FeatureCollection',
      features: []
    });
  }
});

// Get EV station details
router.get('/stations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${NREL_API_URL}/alt-fuel-stations/v1/${id}.json`, {
      params: {
        api_key: NREL_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching EV station details:', error);
    res.status(500).json({ error: 'Failed to fetch station details' });
  }
});

// Get EV charging networks in an area
router.get('/networks', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    const response = await axios.get(`${NREL_API_URL}/alt-fuel-stations/v1.json`, {
      params: {
        api_key: NREL_API_KEY,
        fuel_type: 'ELEC',
        latitude: lat,
        longitude: lng,
        radius,
        limit: 500
      }
    });

    // Extract unique networks
    const networks = [...new Set(
      response.data.fuel_stations
        .map(station => station.ev_network)
        .filter(Boolean)
    )];

    res.json(networks);
  } catch (error) {
    console.error('Error fetching EV networks:', error);
    res.status(500).json({ error: 'Failed to fetch EV networks' });
  }
});

export const evRouter = router; 