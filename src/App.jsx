import React, { useState } from 'react';
import { Box } from '@mui/material';
import MainLayout from './components/MainLayout';

function App() {
  const [activeLayers, setActiveLayers] = useState({
    standardMap: false,
    satelliteView: true,
    solarInstallations: false,
    solarPotential: false,
    propertyBoundaries: false,
    solarPermits: false,
    neighborhoodInsights: false,
    moveIns: false,
    leads: false,
    utilityBoundaries: false,
    cityBoundaries: false,
    manufacturedHomes: false,
    spanishSpeakers: false,
    evOwners: false,
    aerial: false
  });

  const handleLayerToggle = (layerId, value) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: value !== undefined ? value : !prev[layerId]
    }));
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <MainLayout 
        activeLayers={activeLayers} 
        onLayerToggle={handleLayerToggle}
      />
    </Box>
  );
}

export default App;
