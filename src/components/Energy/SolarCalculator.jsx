import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, TextField,
  Button, Box, Slider, CircularProgress, Alert
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getUtilityRates } from '../../services/energyStarService';
import { cacheManager } from '../../utils/cacheUtils';
import { withRetry } from '../../utils/retryUtils';

const SYSTEM_COST_PER_WATT = 2.85; // Average cost per watt installed
const FEDERAL_TAX_CREDIT = 0.30; // 30% federal tax credit
const PANEL_WATTAGE = 400; // Watts per panel
const ANNUAL_DEGRADATION = 0.005; // 0.5% annual panel degradation

const SolarCalculator = ({ propertyData }) => {
  const [loading, setLoading] = useState(false);
  const [utilityRates, setUtilityRates] = useState(null);
  const [systemSize, setSystemSize] = useState(propertyData?.recommendedSize || 6); // kW
  const [calculations, setCalculations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUtilityRates = async () => {
      try {
        setLoading(true);
        const cachedRates = cacheManager.get('utilityRates', { zipCode: propertyData.zipCode });
        
        if (cachedRates) {
          setUtilityRates(cachedRates);
        } else {
          const response = await withRetry(() => 
            getUtilityRates({ zipCode: propertyData.zipCode })
          );
          cacheManager.set('utilityRates', { zipCode: propertyData.zipCode }, response);
          setUtilityRates(response);
        }
      } catch (error) {
        setError('Failed to fetch utility rates. Using default values.');
        setUtilityRates({ rate: 0.24 }); // Fallback rate
      } finally {
        setLoading(false);
      }
    };

    if (propertyData?.zipCode) {
      fetchUtilityRates();
    }
  }, [propertyData]);

  useEffect(() => {
    if (!utilityRates) return;

    const calculateSavings = () => {
      const systemWattage = systemSize * 1000;
      const numberOfPanels = Math.ceil(systemWattage / PANEL_WATTAGE);
      const systemCost = systemWattage * SYSTEM_COST_PER_WATT;
      const federalIncentive = systemCost * FEDERAL_TAX_CREDIT;
      const netCost = systemCost - federalIncentive;

      // Calculate production and savings over 25 years
      const yearlyData = Array.from({ length: 25 }, (_, year) => {
        const degradationFactor = 1 - (ANNUAL_DEGRADATION * year);
        const annualProduction = systemWattage * 1.4 * degradationFactor; // 1.4 kWh per watt per year (average)
        const annualSavings = annualProduction * utilityRates.rate;
        const cumulativeSavings = year === 0 ? annualSavings : 
          yearlyData[year - 1].cumulativeSavings + annualSavings;
        
        return {
          year: year + 1,
          production: annualProduction,
          savings: annualSavings,
          cumulativeSavings
        };
      });

      const paybackYear = yearlyData.find(data => data.cumulativeSavings >= netCost)?.year || 25;
      const roi = ((yearlyData[24].cumulativeSavings - netCost) / netCost) * 100;

      setCalculations({
        systemSize,
        numberOfPanels,
        systemCost,
        federalIncentive,
        netCost,
        yearlyData,
        paybackYear,
        roi,
        firstYearProduction: yearlyData[0].production,
        firstYearSavings: yearlyData[0].savings
      });
    };

    calculateSavings();
  }, [systemSize, utilityRates]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Solar System Calculator
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  System Configuration
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    System Size: {systemSize} kW
                  </Typography>
                  <Slider
                    value={systemSize}
                    onChange={(_, value) => setSystemSize(value)}
                    min={1}
                    max={20}
                    step={0.5}
                    marks={[
                      { value: 1, label: '1kW' },
                      { value: 10, label: '10kW' },
                      { value: 20, label: '20kW' }
                    ]}
                  />
                </Box>

                {calculations && (
                  <>
                    <Typography variant="body2" paragraph>
                      Number of Panels: {calculations.numberOfPanels}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Gross Cost: ${calculations.systemCost.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Federal Tax Credit: ${calculations.federalIncentive.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Net Cost: ${calculations.netCost.toLocaleString()}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  25-Year Savings Projection
                </Typography>
                
                {calculations && (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart data={calculations.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        <Area
                          type="monotone"
                          dataKey="cumulativeSavings"
                          stroke="#4CAF50"
                          fill="#4CAF50"
                          fillOpacity={0.3}
                          name="Cumulative Savings"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {calculations && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        First Year Production
                      </Typography>
                      <Typography variant="h6">
                        {Math.round(calculations.firstYearProduction).toLocaleString()} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Payback Period
                      </Typography>
                      <Typography variant="h6">
                        {calculations.paybackYear} years
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        25-Year ROI
                      </Typography>
                      <Typography variant="h6">
                        {calculations.roi.toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SolarCalculator; 