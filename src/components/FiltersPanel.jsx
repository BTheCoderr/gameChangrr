import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import TerrainIcon from '@mui/icons-material/Terrain'
import BusinessIcon from '@mui/icons-material/Business'
import SolarPowerIcon from '@mui/icons-material/SolarPower'
import HomeIcon from '@mui/icons-material/Home'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import TranslateIcon from '@mui/icons-material/Translate'
import ElectricCarIcon from '@mui/icons-material/ElectricCar'
import HomeWorkIcon from '@mui/icons-material/HomeWork'

const layerStyles = {
  leads: {
    color: '#4A90E2',
    icon: LocationOnIcon,
    description: 'View potential solar leads'
  },
  neighborhoodInsights: {
    color: '#ED6C02',
    icon: TerrainIcon,
    description: 'View demographic and housing data'
  },
  utilityBoundaries: {
    color: '#1976D2',
    icon: BusinessIcon,
    description: 'Show utility service areas'
  },
  solarPermits: {
    color: '#FFC107',
    icon: SolarPowerIcon,
    description: 'View solar permit applications'
  },
  moveIns: {
    color: '#4CAF50',
    icon: HomeIcon,
    description: 'View recent move-ins'
  },
  cityBoundaries: {
    color: '#2E7D32',
    icon: LocationCityIcon,
    description: 'View city boundaries'
  },
  manufacturedHomes: {
    color: '#9C27B0',
    icon: HomeWorkIcon,
    description: 'View manufactured home locations'
  },
  spanishSpeakers: {
    color: '#FF5722',
    icon: TranslateIcon,
    description: 'View Spanish-speaking households'
  },
  evOwners: {
    color: '#00BCD4',
    icon: ElectricCarIcon,
    description: 'View electric vehicle owners'
  }
};

function FiltersPanel({ activeLayers, onLayersChange }) {
  const [open, setOpen] = useState(false);

  const handleLayerChange = (layer) => (event) => {
    const newLayers = {
      ...activeLayers,
      [layer]: event.target.checked
    };
    onLayersChange(newLayers);
  };

  const LayerToggle = ({ layer, label }) => {
    const style = layerStyles[layer];
    return (
      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={activeLayers[layer]}
              onChange={handleLayerChange(layer)}
              sx={{
                color: style.color,
                '&.Mui-checked': {
                  color: style.color,
                },
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <style.icon sx={{ color: style.color, mr: 1 }} />
              <Box>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {style.description}
                </Typography>
              </Box>
            </Box>
          }
        />
      </Box>
    );
  };

  if (!open) {
    return (
      <Tooltip title="Show Layers">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'white',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1200,
            width: '40px',
            height: '40px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0px 4px 8px rgba(0,0,0,0.2)'
            }
          }}
        >
          <FilterListIcon sx={{ color: '#1976d2' }} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 20,
        left: 20,
        width: 320,
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'auto',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Layers</Typography>
        <IconButton onClick={() => setOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <LayerToggle layer="leads" label="Leads" />
        <LayerToggle layer="neighborhoodInsights" label="Neighborhood Insights" />
        <LayerToggle layer="utilityBoundaries" label="Utility Boundaries" />
        <LayerToggle layer="solarPermits" label="Solar Permits" />
        <LayerToggle layer="moveIns" label="Move Ins" />
        <LayerToggle layer="cityBoundaries" label="City Boundaries" />
        <LayerToggle layer="manufacturedHomes" label="Manufactured Homes" />
        <LayerToggle layer="spanishSpeakers" label="Spanish Speakers" />
        <LayerToggle layer="evOwners" label="EV Owners" />
      </Box>

      {/* Map Type Toggle */}
      <Box sx={{ p: 2, pt: 0 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={activeLayers.aerial}
              onChange={handleLayerChange('aerial')}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Use current aerial imagery</Typography>
              <Typography variant="caption" color="text.secondary">
                Toggle between aerial and map view
              </Typography>
            </Box>
          }
        />
      </Box>
    </Paper>
  );
}

FiltersPanel.propTypes = {
  activeLayers: PropTypes.object.isRequired,
  onLayersChange: PropTypes.func.isRequired
};

export default FiltersPanel;
