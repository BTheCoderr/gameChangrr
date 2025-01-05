import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const Filters = () => {
  const [filters, setFilters] = React.useState({
    propertyValue: [0, 1000000],
    propertyType: 'all',
    yearBuilt: [1900, 2023],
    solarPotential: [0, 100],
    income: [0, 200000]
  });

  const handleReset = () => {
    setFilters({
      propertyValue: [0, 1000000],
      propertyType: 'all',
      yearBuilt: [1900, 2023],
      solarPotential: [0, 100],
      income: [0, 200000]
    });
  };

  const handleSliderChange = (name) => (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSelectChange = (event) => {
    setFilters(prev => ({
      ...prev,
      propertyType: event.target.value
    }));
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Filter Properties
        </Typography>
        <Button
          startIcon={<RestartAltIcon />}
          size="small"
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Property Value</Typography>
        <Slider
          value={filters.propertyValue}
          onChange={handleSliderChange('propertyValue')}
          valueLabelDisplay="auto"
          min={0}
          max={1000000}
          step={50000}
          valueLabelFormat={(value) => formatValue(value, 'currency')}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {formatValue(filters.propertyValue[0], 'currency')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatValue(filters.propertyValue[1], 'currency')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Property Type</InputLabel>
          <Select
            value={filters.propertyType}
            onChange={handleSelectChange}
            label="Property Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="single">Single Family</MenuItem>
            <MenuItem value="multi">Multi Family</MenuItem>
            <MenuItem value="commercial">Commercial</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Year Built</Typography>
        <Slider
          value={filters.yearBuilt}
          onChange={handleSliderChange('yearBuilt')}
          valueLabelDisplay="auto"
          min={1900}
          max={2023}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {filters.yearBuilt[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filters.yearBuilt[1]}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Solar Potential</Typography>
        <Slider
          value={filters.solarPotential}
          onChange={handleSliderChange('solarPotential')}
          valueLabelDisplay="auto"
          min={0}
          max={100}
          valueLabelFormat={(value) => formatValue(value, 'percentage')}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {formatValue(filters.solarPotential[0], 'percentage')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatValue(filters.solarPotential[1], 'percentage')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Household Income</Typography>
        <Slider
          value={filters.income}
          onChange={handleSliderChange('income')}
          valueLabelDisplay="auto"
          min={0}
          max={200000}
          step={10000}
          valueLabelFormat={(value) => formatValue(value, 'currency')}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {formatValue(filters.income[0], 'currency')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatValue(filters.income[1], 'currency')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Filters; 