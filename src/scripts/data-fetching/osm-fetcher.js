import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const OVERPASS_API_ENDPOINT = 'https://overpass-api.de/api/interpreter';

async function fetchOSMBoundaries() {
    try {
        // Query for all cities/towns in Massachusetts
        const query = `
            [out:json][timeout:90];
            area["name"="Massachusetts"]["admin_level"="4"]->.massachusetts;
            (
              way["boundary"="administrative"]["admin_level"="8"](area.massachusetts);
              relation["boundary"="administrative"]["admin_level"="8"](area.massachusetts);
            );
            out body;
            >;
            out skel qt;
        `;

        const response = await axios.post(OVERPASS_API_ENDPOINT, query, {
            headers: { 'Content-Type': 'text/plain' }
        });

        if (response.data && response.data.elements) {
            // First, collect all ways and their nodes
            const nodes = new Map();
            const ways = new Map();
            
            response.data.elements.forEach(element => {
                if (element.type === 'node') {
                    nodes.set(element.id, [element.lon, element.lat]);
                } else if (element.type === 'way') {
                    ways.set(element.id, element);
                }
            });

            // Transform the data to GeoJSON
            const transformedData = response.data.elements
                .filter(element => element.type === 'relation' && element.tags && element.tags.name)
                .map(element => {
                    const coordinates = [];
                    if (element.members) {
                        element.members.forEach(member => {
                            if (member.type === 'way') {
                                const way = ways.get(member.ref);
                                if (way && way.nodes) {
                                    const wayCoords = way.nodes.map(nodeId => nodes.get(nodeId)).filter(Boolean);
                                    if (wayCoords.length > 0) {
                                        coordinates.push(wayCoords);
                                    }
                                }
                            }
                        });
                    }

                    return {
                        name: element.tags.name,
                        type: 'city',
                        boundaries: {
                            type: 'MultiPolygon',
                            coordinates: coordinates.length > 0 ? [coordinates] : []
                        }
                    };
                })
                .filter(city => city.boundaries.coordinates.length > 0);

            // Save the transformed data
            const outputPath = path.join(process.cwd(), 'src', 'data', 'osm-boundaries.json');
            await fs.writeFile(outputPath, JSON.stringify(transformedData, null, 2));
            console.log(`Successfully saved ${transformedData.length} city boundaries to osm-boundaries.json`);
        }
    } catch (error) {
        console.error('Error fetching OSM data:', error.message);
        throw error;
    }
}

// Execute the fetch
fetchOSMBoundaries(); 