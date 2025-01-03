import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const CENSUS_API_ENDPOINT = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query';

async function fetchCensusBoundaries(state = 'MA') {
    try {
        const params = {
            where: `STATE_FIPS='25'`, // 25 is Massachusetts
            outFields: '*',
            returnGeometry: true,
            geometryType: 'esriGeometryPolygon',
            spatialRel: 'esriSpatialRelIntersects',
            outSR: '4326', // WGS84
            f: 'json'
        };

        console.log('Fetching Census data...');
        console.log('URL:', `${CENSUS_API_ENDPOINT}?${new URLSearchParams(params).toString()}`);
        
        const response = await axios.get(`${CENSUS_API_ENDPOINT}?${new URLSearchParams(params).toString()}`);
        
        console.log('Response status:', response.status);
        console.log('Response type:', typeof response.data);
        
        if (response.data.error) {
            throw new Error(`Census API Error: ${JSON.stringify(response.data.error)}`);
        }

        if (!response.data || !response.data.features) {
            throw new Error(`Invalid response format: ${JSON.stringify(response.data)}`);
        }

        // Transform the data to match our application's format
        const transformedData = response.data.features.map(feature => {
            if (!feature.geometry || !feature.geometry.rings) {
                console.warn('Invalid feature geometry:', feature);
                return null;
            }

            // Convert ESRI JSON to GeoJSON
            const coordinates = feature.geometry.rings.map(ring => 
                ring.map(point => [point[0], point[1]])
            );

            return {
                name: feature.attributes.BASENAME || feature.attributes.NAME,
                type: 'city',
                boundaries: {
                    type: 'Polygon',
                    coordinates: coordinates
                }
            };
        }).filter(Boolean);

        console.log(`Transformed ${transformedData.length} features`);

        // Save the transformed data
        const outputPath = path.join(process.cwd(), 'src', 'data', 'census-boundaries.json');
        await fs.writeFile(outputPath, JSON.stringify(transformedData, null, 2));
        console.log(`Successfully saved ${transformedData.length} city boundaries to census-boundaries.json`);
    } catch (error) {
        if (error.response) {
            console.error('Census API Error Response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        console.error('Error fetching Census data:', error.message);
        throw error;
    }
}

// Execute the fetch
fetchCensusBoundaries(); 