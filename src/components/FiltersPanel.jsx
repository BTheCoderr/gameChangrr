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
  Divider
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
import MapIcon from '@mui/icons-material/Map'
import SatelliteIcon from '@mui/icons-material/Satellite'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import ApartmentIcon from '@mui/icons-material/Apartment'

const layerStyles = {
  // Map Type
  standardMap: {
    color: '#1976D2',
    icon: MapIcon,
    description: 'Standard street map view'
  },
  satelliteView: {
    color: '#1976D2',
    icon: SatelliteIcon,
    description: 'Satellite imagery view'
  },
  // Solar Data
  solarInstallations: {
    color: '#FFC107',
    icon: SolarPowerIcon,
    description: 'View existing solar installations'
  },
  solarPotential: {
    color: '#FF9800',
    icon: WbSunnyIcon,
    description: 'View solar potential areas'
  },
  propertyBoundaries: {
    color: '#4CAF50',
    icon: ApartmentIcon,
    description: 'View property boundaries'
  },
  solarPermits: {
    color: '#FFC107',
    icon: SolarPowerIcon,
    description: 'View solar permit applications'
  },
  // Property Insights
  neighborhoodInsights: {
    color: '#ED6C02',
    icon: TerrainIcon,
    description: 'View demographic and housing data'
  },
  moveIns: {
    color: '#4CAF50',
    icon: HomeIcon,
    description: 'View recent move-ins'
  },
  leads: {
    color: '#4A90E2',
    icon: LocationOnIcon,
    description: 'View potential solar leads'
  },
  // Demographics & Boundaries
  utilityBoundaries: {
    color: '#1976D2',
    icon: BusinessIcon,
    description: 'Show utility service areas'
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
  }
};

const categories = [
  {
    title: 'Map Type',
    layers: ['standardMap', 'satelliteView']
  },
  {
    title: 'Solar Data',
    layers: ['solarInstallations', 'solarPotential', 'propertyBoundaries', 'solarPermits']
  },
  {
    title: 'Property Insights',
    layers: ['neighborhoodInsights', 'moveIns', 'leads']
  },
  {
    title: 'Demographics & Boundaries',
    layers: ['utilityBoundaries', 'cityBoundaries', 'manufacturedHomes', 'spanishSpeakers']
  }
];

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
                <Typography variant="body2" sx={{ color: '#000' }}>
                  {label || layer.replace(/([A-Z])/g, ' $1').trim()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
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
        backgroundColor: '#fff',
        boxShadow: '0px 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Typography variant="h6" sx={{ color: '#000' }}>Layers</Typography>
        <IconButton onClick={() => setOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {categories.map((category, index) => (
        <React.Fragment key={category.title}>
          {index > 0 && <Divider />}
          <Box sx={{ px: 2, py: 1, backgroundColor: '#fff' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 1, 
                fontWeight: 500,
                color: '#000'
              }}
            >
              {category.title}
            </Typography>
            {category.layers.map(layer => (
              <LayerToggle key={layer} layer={layer} />
            ))}
          </Box>
        </React.Fragment>
      ))}
    </Paper>
  );
}

FiltersPanel.propTypes = {
  activeLayers: PropTypes.object.isRequired,
  onLayersChange: PropTypes.func.isRequired
};

export default FiltersPanel;
