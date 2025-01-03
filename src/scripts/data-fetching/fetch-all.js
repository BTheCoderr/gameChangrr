import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function runAllFetchers() {
    try {
        console.log('Starting data fetch from all sources...');

        // Run all fetchers in parallel
        const fetchers = [
            execAsync('node src/scripts/data-fetching/massgis-fetcher.js').catch(error => {
                console.error('MassGIS fetcher error:', error.message);
                return null;
            }),
            execAsync('node src/scripts/data-fetching/census-fetcher.js').catch(error => {
                console.error('Census fetcher error:', error.message);
                return null;
            }),
            execAsync('node src/scripts/data-fetching/osm-fetcher.js').catch(error => {
                console.error('OSM fetcher error:', error.message);
                return null;
            })
        ];

        await Promise.all(fetchers);

        // Compare results
        const files = ['ma-boundaries.json', 'census-boundaries.json', 'osm-boundaries.json'];
        const results = await Promise.all(
            files.map(async file => {
                try {
                    const content = await fs.readFile(path.join(process.cwd(), 'src', 'data', file), 'utf8');
                    return JSON.parse(content);
                } catch (error) {
                    console.error(`Error reading ${file}:`, error.message);
                    return null;
                }
            })
        );

        const [massGIS, census, osm] = results;

        console.log('\nResults comparison:');
        console.log('------------------');
        console.log(`MassGIS cities: ${massGIS ? massGIS.length : 'Failed to fetch'}`);
        console.log(`Census cities: ${census ? census.length : 'Failed to fetch'}`);
        console.log(`OSM cities: ${osm ? osm.length : 'Failed to fetch'}`);

        // Compare city names across datasets
        if (massGIS && census && osm) {
            const cityNames = {
                massGIS: new Set(massGIS.map(c => c.name.toLowerCase())),
                census: new Set(census.map(c => c.name.toLowerCase())),
                osm: new Set(osm.map(c => c.name.toLowerCase()))
            };

            console.log('\nCity name overlap:');
            console.log('------------------');
            console.log(`Cities in all datasets: ${
                [...cityNames.massGIS].filter(name => 
                    cityNames.census.has(name) && cityNames.osm.has(name)
                ).length
            }`);

            // Save the most complete dataset as our primary source
            const primarySource = [massGIS, census, osm].reduce((a, b) => 
                (a && b) ? (a.length > b.length ? a : b) : (a || b)
            );

            if (primarySource) {
                await fs.writeFile(
                    path.join(process.cwd(), 'src', 'data', 'city-boundaries.json'),
                    JSON.stringify(primarySource, null, 2)
                );

                console.log('\nPrimary dataset saved to city-boundaries.json');
                console.log(`Total cities in primary dataset: ${primarySource.length}`);
            } else {
                console.error('No valid datasets available to use as primary source');
            }
        } else {
            console.log('\nUnable to compare city names due to missing datasets');
            
            // Use any available dataset as primary
            const primarySource = results.find(r => r !== null);
            if (primarySource) {
                await fs.writeFile(
                    path.join(process.cwd(), 'src', 'data', 'city-boundaries.json'),
                    JSON.stringify(primarySource, null, 2)
                );

                console.log('\nPrimary dataset saved using available data');
                console.log(`Total cities in primary dataset: ${primarySource.length}`);
            } else {
                console.error('No valid datasets available to use as primary source');
            }
        }

    } catch (error) {
        console.error('Error running fetchers:', error);
    }
}

runAllFetchers(); 