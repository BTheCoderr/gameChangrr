import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import LayerControls from './LayerControls';
import Filters from './Filters';

const Sidebar = ({ activeLayers, onLayerToggle }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: 280,
        height: '100%',
        overflowY: 'auto',
        p: 2,
        backgroundColor: 'white',
        borderRadius: '0 8px 8px 0',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
          '&:hover': {
            background: '#666',
          },
        },
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Layers
        </Typography>
        <LayerControls 
          activeLayers={activeLayers}
          onLayerToggle={onLayerToggle}
        />
      </Box>
      
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Filters
        </Typography>
        <Filters />
      </Box>
    </Paper>
  );
};

export default Sidebar; 