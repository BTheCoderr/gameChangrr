import React from 'react';
import { Box } from '@mui/material';
import LeafletMap from './LeafletMap';
import Sidebar from './Sidebar';

const MainLayout = ({ activeLayers, onLayerToggle }) => {
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
          width: 240,
          height: '100%',
          flexShrink: 0,
          bgcolor: 'white',
          borderRight: '1px solid rgba(0,0,0,0.12)',
          overflow: 'auto'
        }}
      >
        <Sidebar 
          activeLayers={activeLayers}
          onLayerToggle={onLayerToggle}
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
          onLayerToggle={onLayerToggle}
        />
      </Box>
    </Box>
  );
};

export default MainLayout;
