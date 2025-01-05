import React from 'react';
import { Box, Typography, Switch, Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const categories = [
  {
    title: 'Map Type',
    icon: MapIcon,
    layers: [
      { id: 'standardMap', label: 'Standard Map' },
      { id: 'satelliteView', label: 'Satellite View' }
    ]
  },
  {
    title: 'Solar Data',
    icon: SolarPowerIcon,
    layers: [
      { id: 'solarInstallations', label: 'Solar Installations' },
      { id: 'solarPotential', label: 'Solar Potential' },
      { id: 'recentPermits', label: 'Recent Permits' }
    ]
  },
  {
    title: 'Property Insights',
    icon: HomeIcon,
    layers: [
      { id: 'neighborhoodInsights', label: 'Neighborhood Insights' },
      { id: 'moveIns', label: 'Move Ins' },
      { id: 'propertyValues', label: 'Property Values' }
    ]
  },
  {
    title: 'Demographics & Boundaries',
    icon: PeopleIcon,
    layers: [
      { id: 'cityBoundaries', label: 'City Boundaries' },
      { id: 'incomeData', label: 'Income Data' },
      { id: 'populationDensity', label: 'Population Density' }
    ]
  }
];

const LayerControls = ({ activeLayers, onLayerToggle }) => {
  const [expandedCategories, setExpandedCategories] = React.useState(
    categories.reduce((acc, cat) => ({ ...acc, [cat.title]: true }), {})
  );

  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <Box>
      {categories.map(({ title, icon: Icon, layers }) => (
        <Box key={title} sx={{ mb: 2 }}>
          <Box
            onClick={() => handleCategoryToggle(title)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              py: 1,
              px: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <Icon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            {expandedCategories[title] ? <ExpandLess /> : <ExpandMore />}
          </Box>

          <Collapse in={expandedCategories[title]}>
            <Box sx={{ ml: 4, mt: 1 }}>
              {layers.map(({ id, label }) => (
                <Box
                  key={id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.5
                  }}
                >
                  <Typography variant="body2">{label}</Typography>
                  <Switch
                    size="small"
                    checked={!!activeLayers[id]}
                    onChange={() => onLayerToggle(id)}
                    color="primary"
                  />
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      ))}
    </Box>
  );
};

export default LayerControls; 