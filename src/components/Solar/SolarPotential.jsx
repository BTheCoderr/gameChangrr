import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Box } from '@mui/material';
import { getSolarPotential, getSystemSizeRecommendation, calculateSolarSavings } from '../../services/nrelService';

const SolarPotential = ({ lat, lon, roofArea }) => {
  const [solarData, setSolarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSolarData = async () => {
      try {
        setLoading(true);
        
        // Get system size recommendation based on roof area
        const recommendation = getSystemSizeRecommendation(roofArea);
        
        // Get solar potential data for recommended system size
        const potential = await getSolarPotential(
          lat,
          lon,
          recommendation.recommendedSize
        );

        if (potential) {
          // Calculate financial metrics
          const savings = calculateSolarSavings(potential.annualOutput);
          
          setSolarData({
            ...potential,
            ...recommendation,
            ...savings
          });
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch solar potential data');
        console.error('Solar data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon && roofArea) {
      fetchSolarData();
    }
  }, [lat, lon, roofArea]);

  if (loading) {
    return (
      <Card>
        <CardContent style={{ textAlign: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!solarData) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Solar Potential</Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">System Recommendation</Typography>
              <Typography>
                Size: {solarData.recommendedSize.toFixed(1)} kW
              </Typography>
              <Typography>
                Panels: {solarData.numberOfPanels} ({solarData.estimatedArea.toFixed(0)} sq ft)
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Annual Production</Typography>
              <Typography>
                {Math.round(solarData.annualOutput).toLocaleString()} kWh/year
              </Typography>
              <Typography>
                Performance Ratio: {(solarData.performanceRatio * 100).toFixed(1)}%
              </Typography>
              <Typography>
                Capacity Factor: {(solarData.capacityFactor * 100).toFixed(1)}%
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Financial Analysis</Typography>
              <Typography>
                Annual Savings: ${Math.round(solarData.annualSavings).toLocaleString()}
              </Typography>
              <Typography>
                Net System Cost: ${Math.round(solarData.netSystemCost).toLocaleString()}
              </Typography>
              <Typography>
                Payback Period: {solarData.paybackPeriod.toFixed(1)} years
              </Typography>
              <Typography>
                25-Year ROI: {Math.round(solarData.roi)}%
              </Typography>
              <Typography>
                Lifetime Savings: ${Math.round(solarData.lifetimeSavings).toLocaleString()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Monthly Production (kWh)</Typography>
              <Grid container spacing={1}>
                {solarData.monthlyOutput.map((output, index) => (
                  <Grid item xs={4} key={index}>
                    <Typography variant="body2">
                      {new Date(2024, index).toLocaleString('default', { month: 'short' })}: {Math.round(output)}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SolarPotential; 