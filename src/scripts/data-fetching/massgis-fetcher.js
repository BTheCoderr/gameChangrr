import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const MASSGIS_REST_ENDPOINT = 'https://gis-prod.digital.mass.gov/geoserver/wfs';

async function fetchMassGISBoundaries() {
    try {
        const params = {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'massgis:GISDATA.TOWNS_POLY',
            outputFormat: 'application/json',
            srsName: 'EPSG:4326',
            propertyName: 'town,town_id,pop2010,fips_stco,fourcolor,shape'
        };

        console.log('Fetching MassGIS data...');
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${MASSGIS_REST_ENDPOINT}?${queryString}`);

        if (response.data && response.data.features) {
            // Transform the data to match our application's format with enhanced metadata
            const transformedData = response.data.features
                .filter((feature, index, self) => 
                    index === self.findIndex(f => f.properties.town === feature.properties.town)
                )
                .map(feature => {
                    // Validate geometry
                    if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length === 0) {
                        console.warn(`Invalid geometry for town: ${feature.properties.town}`);
                        return null;
                    }

                    // Calculate center point for the city (useful for labels and markers)
                    const bounds = calculateBounds(feature.geometry.coordinates[0]);
                    const center = [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2];

                    return {
                        name: feature.properties.town,
                        type: 'city',
                        id: feature.properties.town_id,
                        metadata: {
                            population: feature.properties.pop2010,
                            fipsCode: feature.properties.fips_stco,
                            region: determineRegion(center)
                        },
                        display: {
                            color: feature.properties.fourcolor,
                            center: center
                        },
                        boundaries: feature.geometry,
                        source: {
                            name: 'MassGIS',
                            date: new Date().toISOString().split('T')[0],
                            url: 'https://www.mass.gov/info-details/massgis-data-layers'
                        }
                    };
                }).filter(Boolean);

            // Sort cities by population (largest first)
            transformedData.sort((a, b) => (b.metadata.population || 0) - (a.metadata.population || 0));

            // Add regional grouping information
            const regions = groupCitiesByRegion(transformedData);

            const finalData = {
                metadata: {
                    totalCities: transformedData.length,
                    totalPopulation: transformedData.reduce((sum, city) => sum + (city.metadata.population || 0), 0),
                    regions: regions,
                    lastUpdated: new Date().toISOString(),
                    source: {
                        name: 'MassGIS',
                        url: 'https://www.mass.gov/info-details/massgis-data-layers',
                        dataYear: 2010
                    }
                },
                cities: transformedData
            };

            // Save the transformed data
            const outputPath = path.resolve(process.cwd(), '../../data/ma-boundaries.json');
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, JSON.stringify(finalData, null, 2));
            console.log(`Successfully saved ${transformedData.length} city boundaries to ma-boundaries.json`);
            console.log('Data quality metrics:');
            console.log(`- Cities with population data: ${transformedData.filter(c => c.metadata.population).length}`);
            console.log(`- Total population (2010 Census): ${finalData.metadata.totalPopulation.toLocaleString()}`);
            console.log(`- Number of regions: ${Object.keys(regions).length}`);
        }
    } catch (error) {
        console.error('Error fetching MassGIS data:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
}

function calculateBounds(coordinates) {
    return coordinates.reduce((bounds, point) => ({
        minLat: Math.min(bounds.minLat, point[1]),
        maxLat: Math.max(bounds.maxLat, point[1]),
        minLng: Math.min(bounds.minLng, point[0]),
        maxLng: Math.max(bounds.maxLng, point[0])
    }), {
        minLat: Infinity,
        maxLat: -Infinity,
        minLng: Infinity,
        maxLng: -Infinity
    });
}

function determineRegion([lng, lat]) {
    // Define regions based on approximate coordinates
    if (lat > 42.5 && lng < -71) return 'North Shore';
    if (lat > 42.5 && lng > -71) return 'Merrimack Valley';
    if (lat < 42 && lng < -71) return 'South Shore';
    if (lat < 41.75) return 'Cape and Islands';
    if (lng < -72) return 'Western Mass';
    if (lng < -71.5) return 'Central Mass';
    if (lng > -71 && lat < 42.5) return 'Metro Boston';
    return 'Greater Boston';
}

function groupCitiesByRegion(cities) {
    return cities.reduce((regions, city) => {
        const region = city.metadata.region;
        if (!regions[region]) {
            regions[region] = {
                count: 0,
                population: 0,
                cities: []
            };
        }
        regions[region].count++;
        regions[region].population += city.metadata.population || 0;
        regions[region].cities.push(city.name);
        return regions;
    }, {});
}

// Execute the fetch
fetchMassGISBoundaries(); 