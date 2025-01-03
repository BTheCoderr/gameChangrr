import { Box } from '@mui/material'
import { useState } from 'react'
import LeafletMap from './LeafletMap'
import Sidebar from './Sidebar'

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeLayers, setActiveLayers] = useState({
    // Map Type
    standardMap: true,
    satelliteView: false,
    // Solar Data
    solarInstallations: false,
    solarPotential: false,
    propertyBoundaries: false,
    solarPermits: false,
    // Property Insights
    neighborhoodInsights: false,
    moveIns: false,
    leads: false,
    // Demographics & Boundaries
    utilityBoundaries: false,
    cityBoundaries: true,
    // Additional Layers
    spanishSpeakers: false,
    manufacturedHomes: false,
    evOwners: false,
    useCurrentAerial: false
  });

  const handleLayerToggle = (layerId) => {
    setActiveLayers(prev => {
      // Handle map type toggles specially
      if (layerId === 'standardMap' || layerId === 'satelliteView') {
        return {
          ...prev,
          standardMap: layerId === 'standardMap',
          satelliteView: layerId === 'satelliteView'
        };
      }
      // Handle other layers
      return {
        ...prev,
        [layerId]: !prev[layerId]
      };
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      bgcolor: '#f5f5f5'
    }}>
      {/* Sidebar */}
      <Box 
        sx={{ 
          width: isSidebarOpen ? 240 : 0,
          height: '100%',
          transition: 'width 0.3s ease',
          flexShrink: 0,
          bgcolor: 'white',
          borderRight: '1px solid rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}
      >
        <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          activeLayers={activeLayers}
          onLayerToggle={handleLayerToggle}
        />
      </Box>

      {/* Map Container */}
      <Box 
        sx={{ 
          flexGrow: 1,
          height: '100%',
          position: 'relative'
        }}
      >
        <LeafletMap 
          activeLayers={activeLayers}
          onLayerToggle={handleLayerToggle}
        />
      </Box>
    </Box>
  )
}

export default MainLayout
