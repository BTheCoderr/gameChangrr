const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:5173',
    'https://game-changer-map.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Google Maps API proxy
app.get('/api/maps/js', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query);
    params.set('key', process.env.GOOGLE_MAPS_API_KEY); // Use backend API key
    
    const response = await axios.get(`https://maps.googleapis.com/maps/api/js?${params.toString()}`);
    res.set('Content-Type', 'application/javascript');
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying Google Maps API:', error);
    res.status(500).send('Error loading Google Maps');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// NREL API endpoint
app.get('/api/nrel/stations', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    const response = await axios.get('https://developer.nrel.gov/api/alt-fuel-stations/v1.json', {
      params: {
        api_key: process.env.NREL_API_KEY,
        fuel_type: 'ELEC',
        status: 'E',
        access: 'public',
        bounded_by: `${minLat},${minLng},${maxLat},${maxLng}`,
        limit: 100
      }
    });
    
    res.json(response.data.fuel_stations);
  } catch (error) {
    console.error('Error fetching NREL data:', error);
    res.status(500).json({ error: 'Failed to fetch charging stations' });
  }
});

// Utility boundaries endpoint
app.get('/api/utility/boundaries', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    // Validate input parameters
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['minLat', 'maxLat', 'minLng', 'maxLng']
      });
    }

    const bbox = {
      xmin: parseFloat(minLng),
      ymin: parseFloat(minLat),
      xmax: parseFloat(maxLng),
      ymax: parseFloat(maxLat),
      spatialReference: { wkid: 4326 }
    };

    try {
      const response = await axios.post(
        'https://maps.env.mass.gov/arcgisserver/rest/services/energy/utilities/MapServer/0/query',
        new URLSearchParams({
          f: 'geojson',
          geometry: JSON.stringify(bbox),
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: true
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000 // Reduced timeout to 5 seconds
        }
      );

      if (!response.data || !response.data.features) {
        console.warn('No utility boundaries found for bbox:', bbox);
        return res.json({
          type: 'FeatureCollection',
          features: []
        });
      }

      res.json(response.data);
    } catch (axiosError) {
      // Handle connection errors gracefully
      console.warn('Mass.gov maps service unavailable, using fallback data');
      return res.json({
        type: 'FeatureCollection',
        features: []
      });
    }
  } catch (error) {
    console.error('Error in utility boundaries endpoint:', error.message);
    res.json({ 
      type: 'FeatureCollection',
      features: []
    });
  }
});

// Census API endpoints
app.get('/api/census/fips', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const response = await axios.get(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates`,
      {
        params: {
          x: longitude,
          y: latitude,
          benchmark: 'Public_AR_Current',
          vintage: 'Current_Current',
          layers: 'all',
          format: 'json'
        }
      }
    );

    const result = response.data.result;
    if (!result || !result.geographies) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const fips = {
      state: result.geographies.States[0].GEOID,
      county: result.geographies.Counties[0].GEOID
    };

    res.json(fips);
  } catch (error) {
    console.error('Error getting FIPS codes:', error);
    res.status(500).json({ error: 'Failed to get FIPS codes' });
  }
});

app.get('/api/census/demographics', async (req, res) => {
  try {
    const { state, county } = req.query;
    
    // Validate input parameters
    if (!state || !county) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['state', 'county']
      });
    }

    const response = await axios.get(
      'https://api.census.gov/data/2020/acs/acs5',
      {
        params: {
          get: 'B16001_001E,B16001_004E', // Total population and Spanish speakers
          for: `county:${county}`,
          in: `state:${state}`,
          key: process.env.CENSUS_API_KEY
        }
      }
    );

    // Check if response data is in expected format
    if (!Array.isArray(response.data) || response.data.length < 2) {
      console.warn('Invalid Census API response format, using fallback data');
      return res.json({
        spanishSpeakers: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {
              totalPopulation: 0,
              spanishSpeakers: 0
            }
          }]
        }
      });
    }

    const [headers, data] = response.data;
    const totalPopIndex = headers.indexOf('B16001_001E');
    const spanishIndex = headers.indexOf('B16001_004E');

    // Validate indices
    if (totalPopIndex === -1 || spanishIndex === -1) {
      console.warn('Census API response missing required fields, using fallback data');
      return res.json({
        spanishSpeakers: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {
              totalPopulation: 0,
              spanishSpeakers: 0
            }
          }]
        }
      });
    }

    const result = {
      spanishSpeakers: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            totalPopulation: parseInt(data[totalPopIndex]) || 0,
            spanishSpeakers: parseInt(data[spanishIndex]) || 0
          }
        }]
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching Census data:', error);
    // Return empty data structure on error
    res.json({
      spanishSpeakers: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            totalPopulation: 0,
            spanishSpeakers: 0
          }
        }]
      }
    });
  }
});

// EV Owners endpoints
app.get('/api/ev-owners', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    // Fetch EV registration data from Mass Vehicle Registry API
    const response = await axios.get('https://mass-api.example.com/ev-registrations', {
      params: {
        api_key: process.env.MASS_DATA_API_KEY,
        bounds: `${minLat},${minLng},${maxLat},${maxLng}`
      }
    });

    // Transform and return the data
    const evOwners = response.data.map(record => ({
      id: record.registration_id,
      position: {
        lat: record.latitude,
        lng: record.longitude
      },
      make: record.vehicle_make,
      model: record.vehicle_model,
      year: record.vehicle_year
    }));

    res.json(evOwners);
  } catch (error) {
    console.error('Error fetching EV owners:', error);
    res.status(500).json({ error: 'Failed to fetch EV owners data' });
  }
});

app.get('/api/ev-statistics', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    // Fetch EV statistics from Mass Data Portal
    const response = await axios.get('https://mass-api.example.com/ev-statistics', {
      params: {
        api_key: process.env.MASS_DATA_API_KEY,
        bounds: `${minLat},${minLng},${maxLat},${maxLng}`
      }
    });

    res.json({
      totalEVs: response.data.total_evs,
      percentageGrowth: response.data.year_over_year_growth,
      popularModels: response.data.top_models,
      chargingStations: response.data.nearby_stations
    });
  } catch (error) {
    console.error('Error fetching EV statistics:', error);
    res.status(500).json({ error: 'Failed to fetch EV statistics' });
  }
});

// Boundary endpoints
app.get('/api/boundaries/cities', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    // Fetch city boundaries from Mass GIS
    const response = await axios.get(
      'https://maps.env.mass.gov/arcgisserver/rest/services/base/municipalities/MapServer/0/query',
      {
        params: {
          f: 'geojson',
          geometry: JSON.stringify({
            xmin: minLng,
            ymin: minLat,
            xmax: maxLng,
            ymax: maxLat,
            spatialReference: { wkid: 4326 }
          }),
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: true
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching city boundaries:', error);
    res.status(500).json({ error: 'Failed to fetch city boundaries' });
  }
});

app.get('/api/boundaries/neighborhoods', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    console.log('Fetching neighborhoods for bounds:', { minLat, maxLat, minLng, maxLng });

    // Validate input parameters
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['minLat', 'maxLat', 'minLng', 'maxLng']
      });
    }

    // Construct Overpass QL query for neighborhoods
    const overpassQuery = `
      [out:json][timeout:25];
      (
        // Get neighborhoods and administrative boundaries
        way["boundary"="administrative"]
          (${minLat},${minLng},${maxLat},${maxLng});
        relation["boundary"="administrative"]
          (${minLat},${minLng},${maxLat},${maxLng});
        // Get districts, suburbs, and neighborhoods
        way["place"~"neighbourhood|suburb|district|quarter"]
          (${minLat},${minLng},${maxLat},${maxLng});
        relation["place"~"neighbourhood|suburb|district|quarter"]
          (${minLat},${minLng},${maxLat},${maxLng});
        // Get named areas
        way["name"]["landuse"~"residential|commercial"]
          (${minLat},${minLng},${maxLat},${maxLng});
      );
      out body;
      >;
      out skel qt;
    `;

    console.log('Sending Overpass query:', overpassQuery);

    // Fetch data from Overpass API
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      overpassQuery,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
        timeout: 30000
      }
    );

    console.log('Received response:', {
      status: response.status,
      elementCount: response.data?.elements?.length || 0
    });

    if (!response.data || !response.data.elements) {
      console.warn('No neighborhood boundaries found in OpenStreetMap');
      return res.json({
        type: 'FeatureCollection',
        features: []
      });
    }

    // Transform OSM data to GeoJSON
    const nodes = new Map();
    const features = [];

    // First, collect all nodes
    response.data.elements
      .filter(elem => elem.type === 'node')
      .forEach(node => {
        nodes.set(node.id, [node.lon, node.lat]);
      });

    console.log('Collected nodes:', nodes.size);

    // Then process ways and relations
    response.data.elements
      .filter(elem => elem.type === 'way' || elem.type === 'relation')
      .forEach(elem => {
        if (elem.type === 'way' && elem.nodes && elem.tags) {
          const coordinates = elem.nodes.map(nodeId => nodes.get(nodeId));
          if (coordinates[0] && coordinates[coordinates.length - 1]) {
            // Close the polygon if it's not closed
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
              coordinates.push(coordinates[0]);
            }
            features.push({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
              },
              properties: {
                name: elem.tags.name || elem.tags.place || 'Unnamed Area',
                type: 'neighborhood',
                source: 'OpenStreetMap',
                population: 0,
                median_income: 0,
                tags: elem.tags // Include all tags for debugging
              }
            });
          }
        } else if (elem.type === 'relation' && elem.tags) {
          // For relations, we need to process their members
          const outerWays = response.data.elements
            .filter(e => e.type === 'way' && elem.members?.some(m => m.type === 'way' && m.role === 'outer' && m.ref === e.id));
          
          if (outerWays.length > 0) {
            // Process each outer way
            outerWays.forEach(way => {
              if (way.nodes) {
                const coordinates = way.nodes.map(nodeId => nodes.get(nodeId));
                if (coordinates[0] && coordinates[coordinates.length - 1]) {
                  // Close the polygon if it's not closed
                  if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                      coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                    coordinates.push(coordinates[0]);
                  }
                  features.push({
                    type: 'Feature',
                    geometry: {
                      type: 'Polygon',
                      coordinates: [coordinates]
                    },
                    properties: {
                      name: elem.tags.name || elem.tags.place || 'Unnamed Area',
                      type: 'neighborhood',
                      source: 'OpenStreetMap',
                      population: 0,
                      median_income: 0,
                      tags: elem.tags // Include all tags for debugging
                    }
                  });
                }
              }
            });
          }
        }
      });

    console.log('Generated features:', features.length);

    const result = {
      type: 'FeatureCollection',
      features: features
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching neighborhood boundaries:', error);
    res.status(500).json({ error: 'Failed to fetch neighborhood boundaries' });
  }
});

app.get('/api/boundaries/zipcodes', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    // Validate input parameters
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['minLat', 'maxLat', 'minLng', 'maxLng']
      });
    }

    // Construct Overpass QL query for ZIP codes
    const overpassQuery = `
      [out:json][timeout:25];
      (
        // Get postal code areas
        way["boundary"="postal_code"]
          (${minLat},${minLng},${maxLat},${maxLng});
        relation["boundary"="postal_code"]
          (${minLat},${minLng},${maxLat},${maxLng});
      );
      out body;
      >;
      out skel qt;
    `;

    // Fetch data from Overpass API
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      overpassQuery,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
        timeout: 30000
      }
    );

    if (!response.data || !response.data.elements) {
      console.warn('No ZIP code boundaries found in OpenStreetMap');
      return res.json({
        type: 'FeatureCollection',
        features: []
      });
    }

    // Transform OSM data to GeoJSON
    const nodes = new Map();
    const features = [];

    // First, collect all nodes
    response.data.elements
      .filter(elem => elem.type === 'node')
      .forEach(node => {
        nodes.set(node.id, [node.lon, node.lat]);
      });

    // Then process ways and relations
    response.data.elements
      .filter(elem => elem.type === 'way' || elem.type === 'relation')
      .forEach(elem => {
        if (elem.type === 'way' && elem.nodes) {
          const coordinates = elem.nodes.map(nodeId => nodes.get(nodeId));
          if (coordinates[0] && coordinates[coordinates.length - 1]) {
            // Close the polygon if it's not closed
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
              coordinates.push(coordinates[0]);
            }
            features.push({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
              },
              properties: {
                zipcode: elem.tags.postal_code || elem.tags['addr:postcode'] || 'Unknown',
                name: `${elem.tags.name || elem.tags.postal_code || 'Unknown ZIP'}`,
                type: 'zipcode',
                source: 'OpenStreetMap',
                population: 0,
                median_income: 0
              }
            });
          }
        }
      });

    res.json({
      type: 'FeatureCollection',
      features: features
    });
  } catch (error) {
    console.error('Error fetching ZIP code boundaries:', error);
    res.status(500).json({ error: 'Failed to fetch ZIP code boundaries' });
  }
});

app.get('/api/boundaries/zoning', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    // Fetch zoning boundaries from Mass GIS
    const response = await axios.get(
      'https://maps.env.mass.gov/arcgisserver/rest/services/zoning/zoningComposite/MapServer/0/query',
      {
        params: {
          f: 'geojson',
          geometry: JSON.stringify({
            xmin: minLng,
            ymin: minLat,
            xmax: maxLng,
            ymax: maxLat,
            spatialReference: { wkid: 4326 }
          }),
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: true
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching zoning boundaries:', error);
    res.status(500).json({ error: 'Failed to fetch zoning boundaries' });
  }
});

// Root endpoint with HTML response
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>GameChanger Backend</title>
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background-color: #1a1a1a;
            color: #ffffff;
          }
          .status {
            padding: 20px;
            background-color: #2d2d2d;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #3d3d3d;
          }
          .endpoints {
            background-color: #2d2d2d;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #3d3d3d;
          }
          .method {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            margin-right: 8px;
          }
          .get { background-color: #4CAF50; }
          .post { background-color: #2196F3; }
          h1 { margin-top: 0; }
          a { color: #64B5F6; }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="status">
          <h1>🟢 Backend Server is Running</h1>
          <p>Server is up and running on port ${process.env.PORT || 3000}</p>
        </div>
        <div class="endpoints">
          <h2>Available Endpoints:</h2>
          <ul>
            <li><span class="method get">GET</span>/api/census - Census data endpoints</li>
            <li><span class="method get">GET</span>/api/nrel - NREL data endpoints</li>
            <li><span class="method get">GET</span>/api/property - Property data endpoints</li>
            <li><span class="method get">GET</span>/health - Server health check</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

const startServer = async (port) => {
  try {
    await app.listen(port);
    console.log(`Server running on port ${port}`);
    
    // Log environment status
    console.log('Environment variables loaded:');
    console.log('- GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? '✓' : '✗');
    console.log('- NREL_API_KEY:', process.env.NREL_API_KEY ? '✓' : '✗');
    console.log('- CENSUS_API_KEY:', process.env.CENSUS_API_KEY ? '✓' : '✗');
    console.log('- ATTOM_API_KEY:', process.env.ATTOM_API_KEY ? '✓' : '✗');
    
    return true;
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying next port...`);
      return false;
    }
    throw error;
  }
};

const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (port < startPort + 10) {
    if (await startServer(port)) {
      return;
    }
    port++;
  }
  throw new Error('No available ports found');
};

// Start server on first available port
findAvailablePort(process.env.PORT || 3000).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 