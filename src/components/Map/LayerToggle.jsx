import React from 'react';
import {
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Slider,
  Box,
  Typography
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import InsightsIcon from '@mui/icons-material/Insights';
import './LayerToggle.css';

const layerIcons = {
  utilityBoundaries: <ElectricBoltIcon />,
  cityBoundaries: <LocationCityIcon />,
  solarPermits: <WbSunnyIcon />,
  neighborhoodInsights: <InsightsIcon />
};

const layerDescriptions = {
  utilityBoundaries: 'View utility service territories and their coverage areas',
  cityBoundaries: 'Display city and town boundaries',
  solarPermits: 'Show active and expired solar installation permits',
  neighborhoodInsights: 'View solar potential and demographic insights by neighborhood'
};

const LayerToggle = ({ 
  label, 
  layerId, 
  checked, 
  opacity = 1,
  onChange, 
  onOpacityChange 
}) => {
  return (
    <div className="layer-toggle">
      <div className="layer-toggle-header">
        <FormControlLabel
          control={
            <Switch
              checked={checked}
              onChange={(e) => onChange(layerId, e.target.checked)}
              color="primary"
            />
          }
          label={
            <div className="layer-label">
              <span className="layer-icon">
                {layerIcons[layerId]}
              </span>
              {label}
            </div>
          }
        />
        <Tooltip title={layerDescriptions[layerId]} placement="right">
          <IconButton size="small" className="info-button">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      
      {checked && onOpacityChange && (
        <Box className="opacity-slider">
          <Typography variant="caption" color="textSecondary">
            Opacity
          </Typography>
          <Slider
            value={opacity}
            onChange={(_, value) => onOpacityChange(layerId, value)}
            min={0}
            max={1}
            step={0.1}
            size="small"
            aria-label="Layer opacity"
          />
        </Box>
      )}
    </div>
  );
};

export default LayerToggle; 