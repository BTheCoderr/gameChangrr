import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MASSGIS_REST_ENDPOINT = 'https://gis-prod.digital.mass.gov/geoserver/wfs';

async function fetchMassGISBoundaries() {
    try {
        const params = {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'massgis:GISDATA.TOWNSSURVEY_POLYM',
            outputFormat: 'application/json',
            srsName: 'EPSG:4326'
        };

        console.log('Fetching MassGIS data...');
        const queryString = new URLSearchParams(params).toString();
        
        // Create a custom axios instance with certificate validation disabled and required headers
        const instance = axios.create({
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            }),
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://gis-prod.digital.mass.gov',
                'Referer': 'https://gis-prod.digital.mass.gov'
            }
        });
        
        const response = await instance.get(`${MASSGIS_REST_ENDPOINT}?${queryString}`);

        if (response.data && response.data.features) {
            // Transform the data to match our application's format
            const transformedData = response.data.features
                .filter(feature => feature.properties.town_id)
                .map(feature => {
                    // Validate geometry
                    if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length === 0) {
                        console.warn(`Invalid geometry for town: ${feature.properties.town}`);
                        return null;
                    }

                    return {
                        name: feature.properties.town,
                        type: 'city',
                        id: feature.properties.town_id,
                        metadata: {
                            population: feature.properties.pop2020 || feature.properties.pop2010,
                            region: determineRegion(feature.geometry)
                        },
                        boundaries: feature.geometry
                    };
                }).filter(Boolean);

            const finalData = {
                metadata: {
                    totalCities: transformedData.length,
                    lastUpdated: new Date().toISOString(),
                    source: {
                        name: 'MassGIS',
                        url: 'https://www.mass.gov/info-details/massgis-data-layers'
                    }
                },
                cities: transformedData
            };

            // Save the transformed data
            const outputPath = path.resolve(__dirname, '../../data/ma-boundaries.json');
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, JSON.stringify(finalData, null, 2));
            console.log(`Successfully saved ${transformedData.length} city boundaries to ma-boundaries.json`);
        }
    } catch (error) {
        console.error('Error fetching MassGIS data:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
}

function determineRegion(geometry) {
    // Calculate centroid of the geometry
    const coordinates = geometry.coordinates[0][0];
    const centroid = coordinates.reduce(
        (acc, coord) => ({
            lng: acc.lng + coord[0] / coordinates.length,
            lat: acc.lat + coord[1] / coordinates.length
        }),
        { lng: 0, lat: 0 }
    );

    // Define regions based on approximate coordinates
    if (centroid.lat > 42.5 && centroid.lng < -71) return 'North Shore';
    if (centroid.lat > 42.5 && centroid.lng > -71) return 'Merrimack Valley';
    if (centroid.lat < 42 && centroid.lng < -71) return 'South Shore';
    if (centroid.lat < 41.75) return 'Cape and Islands';
    if (centroid.lng < -72) return 'Western Mass';
    if (centroid.lng < -71.5) return 'Central Mass';
    if (centroid.lng > -71 && centroid.lat < 42.5) return 'Metro Boston';
    return 'Greater Boston';
}

// Execute the fetch
fetchMassGISBoundaries(); 