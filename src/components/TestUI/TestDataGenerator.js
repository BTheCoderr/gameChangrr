import React, { useState } from 'react';

const generateRandomValue = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

export const TestDataGenerator = () => {
  const [generatedData, setGeneratedData] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateSolarInstallation = () => {
    const systemTypes = ['Residential', 'Commercial', 'Industrial', 'Community'];
    const installers = ['SunPower Co.', 'Tesla Solar', 'Local Solar LLC', 'Green Energy Inc.'];
    const streets = ['Roosevelt Ave', 'Main St', 'State St', 'Wilbraham Rd', 'Boston Rd', 'Dwight St'];
    
    // Center coordinates from the map
    const centerLat = 42.1015;
    const centerLng = -72.5898;
    
    // Generate a point within ~1 mile radius
    const radius = 0.02; // roughly 1 mile
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    
    const lat = centerLat + (distance * Math.cos(angle));
    const lng = centerLng + (distance * Math.sin(angle));
    
    const streetNumber = generateRandomValue(1, 999);
    const street = streets[Math.floor(Math.random() * streets.length)];
    const systemType = systemTypes[Math.floor(Math.random() * systemTypes.length)];
    const installer = installers[Math.floor(Math.random() * installers.length)];
    const capacity = generateRandomValue(5, 50) / 2; // More realistic system sizes
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `${systemType} Solar Installation`,
        capacity: capacity,
        date_installed: generateRandomDate(new Date('2020-01-01'), new Date()),
        system_type: systemType,
        status: 'completed',
        address: `${streetNumber} ${street}, Springfield, MA 01109`,
        installer: installer,
        has_battery: Math.random() > 0.7, // 30% chance of having battery
        cost: Math.round(capacity * 3000), // Approximate $3000 per kW
        annual_production: Math.round(capacity * 1200), // Approximate 1200 kWh per kW per year
        permit_number: `SP-${generateRandomValue(2020, 2024)}-${generateRandomValue(1000, 9999)}`,
        owner: `${['John', 'Jane', 'Robert', 'Maria', 'James'][Math.floor(Math.random() * 5)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
        roof_type: ['Asphalt Shingle', 'Metal', 'Tile'][Math.floor(Math.random() * 3)],
        panel_count: Math.round(capacity * 3.3), // Approximate 330W per panel
        panel_manufacturer: ['LG', 'SunPower', 'REC', 'QCells', 'Canadian Solar'][Math.floor(Math.random() * 5)]
      }
    };
  };

  const generateUtilityBoundary = () => {
    const utilityNames = ['Springfield Electric', 'Pioneer Valley Power', 'Mass Energy Co.'];
    const rateTypes = ['Fixed', 'Time-of-Use', 'Demand-Based'];
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.5898 + (Math.random() * 0.1 - 0.05), 42.1015 + (Math.random() * 0.1 - 0.05)],
          [-72.5798 + (Math.random() * 0.1 - 0.05), 42.1115 + (Math.random() * 0.1 - 0.05)],
          [-72.5698 + (Math.random() * 0.1 - 0.05), 42.1015 + (Math.random() * 0.1 - 0.05)],
          [-72.5898 + (Math.random() * 0.1 - 0.05), 42.1015 + (Math.random() * 0.1 - 0.05)]
        ]]
      },
      properties: {
        utilityName: utilityNames[Math.floor(Math.random() * utilityNames.length)],
        serviceArea: 'Springfield Metropolitan Area',
        rateType: rateTypes[Math.floor(Math.random() * rateTypes.length)],
        solarRate: `$${(Math.random() * 0.5 + 0.1).toFixed(2)}/kWh`,
        provider: 'Sample Utility Provider',
        hasSolarProgram: Math.random() > 0.3
      }
    };
  };

  const handleGenerateTestData = async () => {
    setGenerating(true);
    try {
      // Generate more sample data points
      const solarInstallations = Array(15).fill(null).map(generateSolarInstallation);
      const utilityBoundaries = Array(3).fill(null).map(generateUtilityBoundary);

      const testData = {
        solarInstallations: {
          type: 'FeatureCollection',
          features: solarInstallations
        },
        utilityBoundaries: {
          type: 'FeatureCollection',
          features: utilityBoundaries
        }
      };

      // Save to localStorage for persistence
      localStorage.setItem('testData', JSON.stringify(testData));
      setGeneratedData(testData);

      // Optional: Send to your backend
      try {
        const response = await fetch('/api/test/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save test data to server');
        }
      } catch (error) {
        console.warn('Could not save test data to server:', error);
      }
    } catch (error) {
      console.error('Error generating test data:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleClearTestData = () => {
    localStorage.removeItem('testData');
    setGeneratedData(null);
  };

  return (
    <section className="test-data-generator">
      <h3>Test Data Generator</h3>
      <div className="generator-controls">
        <button
          onClick={handleGenerateTestData}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Test Data'}
        </button>
        <button
          onClick={handleClearTestData}
          disabled={generating || !generatedData}
          className="clear-button"
        >
          Clear Test Data
        </button>
      </div>
      
      {generatedData && (
        <div className="generated-data-summary">
          <h4>Generated Data Summary</h4>
          <ul>
            <li>Solar Installations: {generatedData.solarInstallations.features.length} records</li>
            <li>Utility Boundaries: {generatedData.utilityBoundaries.features.length} records</li>
          </ul>
          <div className="data-preview">
            <pre>{JSON.stringify(generatedData, null, 2)}</pre>
          </div>
        </div>
      )}
    </section>
  );
}; 