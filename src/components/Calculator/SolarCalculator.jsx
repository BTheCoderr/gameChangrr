import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Slider,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  SOLAR_CONSTANTS,
  validateCalculatorInputs,
  calculateSystemProduction,
  calculateFinancials,
  validateSystemSize
} from '../../utils/solarCalculatorUtils';

const SolarCalculator = ({ propertyData, onCalculate }) => {
  const [inputs, setInputs] = useState({
    systemSize: 5,
    roofArea: propertyData?.roofData?.usableArea || 1000,
    monthlyBill: propertyData?.utilityData?.bills?.[0]?.total || 150,
    utilityRate: propertyData?.utilityData?.rates?.base || 0.15,
    propertyType: 'RESIDENTIAL',
    state: propertyData?.state || 'CA',
    shading: propertyData?.roofData?.shading?.annual || 0,
    roofPitch: propertyData?.roofData?.pitch || 30,
    orientation: propertyData?.roofData?.orientation || 'South',
    incentives: []
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [alerts, setAlerts] = useState([]);

  // Calculate results when inputs change
  useEffect(() => {
    calculateResults();
  }, [inputs]);

  const calculateResults = async () => {
    try {
      // Clear previous errors
      setErrors({});

      // Validate inputs
      const validatedInputs = validateCalculatorInputs(inputs);

      // Validate system size against roof area
      const sizeValidation = validateSystemSize(
        validatedInputs.systemSize,
        validatedInputs.roofArea
      );

      // Calculate production and financials
      const production = calculateSystemProduction(validatedInputs);
      const financials = calculateFinancials(validatedInputs, production);

      // Update results and alerts
      setResults({
        ...production,
        ...financials,
        systemDetails: sizeValidation
      });
      setAlerts(financials.alerts);

      // Notify parent component
      onCalculate?.({
        inputs: validatedInputs,
        production,
        financials,
        systemDetails: sizeValidation
      });

    } catch (error) {
      console.error('Calculation error:', error);
      if (error.name === 'ValidationError') {
        setErrors(error.errors);
        setAlerts([{
          type: 'error',
          message: 'Please correct the input errors',
          details: error.message
        }]);
      }
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;

    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSliderChange = (field) => (_, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Grid item xs={12}>
              {alerts.map((alert, index) => (
                <Alert 
                  key={index} 
                  severity={alert.type}
                  sx={{ mb: 1 }}
                >
                  <AlertTitle>{alert.message}</AlertTitle>
                  {alert.details}
                </Alert>
              ))}
            </Grid>
          )}

          {/* Input Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              System Configuration
            </Typography>

            {/* System Size Slider */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                System Size (kW)
              </Typography>
              <Slider
                value={inputs.systemSize}
                onChange={handleSliderChange('systemSize')}
                min={SOLAR_CONSTANTS.MIN_SYSTEM_SIZE}
                max={Math.min(
                  SOLAR_CONSTANTS.MAX_SYSTEM_SIZE,
                  inputs.roofArea / SOLAR_CONSTANTS.AVG_PANEL_AREA * 
                    SOLAR_CONSTANTS.PANEL_WATTAGE / 1000
                )}
                step={0.1}
                marks
                valueLabelDisplay="auto"
                error={!!errors.systemSize}
              />
              {errors.systemSize && (
                <Typography color="error" variant="caption">
                  {errors.systemSize}
                </Typography>
              )}
            </Box>

            {/* Property Type Select */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Property Type</InputLabel>
              <Select
                value={inputs.propertyType}
                onChange={handleInputChange('propertyType')}
                error={!!errors.propertyType}
              >
                <MenuItem value="RESIDENTIAL">Residential</MenuItem>
                <MenuItem value="COMMERCIAL">Commercial</MenuItem>
              </Select>
            </FormControl>

            {/* Orientation Select */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Roof Orientation</InputLabel>
              <Select
                value={inputs.orientation}
                onChange={handleInputChange('orientation')}
                error={!!errors.orientation}
              >
                {['South', 'Southwest', 'Southeast', 'East', 'West', 'North', 'Northwest', 'Northeast']
                  .map(orientation => (
                    <MenuItem key={orientation} value={orientation}>
                      {orientation}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Roof Pitch Slider */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Roof Pitch (degrees)
              </Typography>
              <Slider
                value={inputs.roofPitch}
                onChange={handleSliderChange('roofPitch')}
                min={0}
                max={45}
                step={1}
                marks
                valueLabelDisplay="auto"
                error={!!errors.roofPitch}
              />
            </Box>

            {/* Shading Slider */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Shading Factor
              </Typography>
              <Slider
                value={inputs.shading}
                onChange={handleSliderChange('shading')}
                min={0}
                max={1}
                step={0.01}
                marks
                valueLabelDisplay="auto"
                error={!!errors.shading}
              />
            </Box>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              System Performance
            </Typography>

            {results && (
              <>
                {/* Production Estimates */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Energy Production
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Annual Production
                      </Typography>
                      <Typography variant="h6">
                        {results.annualProduction.toLocaleString()} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Average
                      </Typography>
                      <Typography variant="h6">
                        {results.monthlyAverage.toLocaleString()} kWh
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Financial Metrics */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Financial Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Installation Cost
                      </Typography>
                      <Typography variant="h6">
                        ${results.installationCost.net.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Savings
                      </Typography>
                      <Typography variant="h6">
                        ${results.savings.monthly.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Payback Period
                      </Typography>
                      <Typography variant="h6">
                        {results.roi.paybackPeriod} years
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        IRR
                      </Typography>
                      <Typography variant="h6">
                        {(results.roi.irr * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* System Details */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    System Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Number of Panels
                      </Typography>
                      <Typography variant="h6">
                        {results.systemDetails.panelCount}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Required Roof Area
                      </Typography>
                      <Typography variant="h6">
                        {results.systemDetails.requiredArea} sq ft
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SolarCalculator; 