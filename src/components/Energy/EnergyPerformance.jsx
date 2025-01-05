import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Box, Chip } from '@mui/material';
import { getBuildingPerformance, getEfficiencyRecommendations } from '../../services/energyStarService';

const EnergyPerformance = ({ propertyType, squareFootage, yearBuilt }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [performance, recs] = await Promise.all([
          getBuildingPerformance({ propertyType, squareFootage, yearBuilt }),
          getEfficiencyRecommendations({ 
            propertyType, 
            squareFootage, 
            yearBuilt,
            energyScore: 75 // Default score for initial recommendations
          })
        ]);

        setPerformanceData(performance);
        setRecommendations(recs);
        setError(null);
      } catch (err) {
        setError('Failed to fetch energy performance data');
        console.error('Energy data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (propertyType && squareFootage && yearBuilt) {
      fetchData();
    }
  }, [propertyType, squareFootage, yearBuilt]);

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

  if (!performanceData) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Energy Performance</Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2">ENERGY STAR Score</Typography>
              <Chip
                label={`${performanceData.energyScore}/100`}
                color={getScoreColor(performanceData.energyScore)}
                size="large"
                sx={{ mt: 1, fontSize: '1.2rem' }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Annual Energy Use</Typography>
              <Typography>
                Electricity: {performanceData.annualEnergyUse.electricity.toLocaleString()} kWh
              </Typography>
              <Typography>
                Natural Gas: {performanceData.annualEnergyUse.naturalGas.toLocaleString()} therms
              </Typography>
              <Typography>
                Energy Intensity: {performanceData.energyIntensity.toFixed(1)} kBtu/sqft
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Recommended Improvements</Typography>
              {performanceData.recommendations.map((rec, index) => (
                <Box key={index} sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {rec.measure}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Potential Savings: {rec.savingsPotential}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Cost: ${rec.estimatedCost.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>

            {recommendations && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Additional Recommendations</Typography>
                {recommendations.map((category, index) => (
                  <Box key={index} sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {category.category}
                    </Typography>
                    {category.measures.map((measure, mIndex) => (
                      <Box key={mIndex} sx={{ ml: 2, mt: 0.5 }}>
                        <Typography variant="body2">
                          {measure.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Savings: {measure.savings} | Cost: {measure.cost} | Payback: {measure.payback}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EnergyPerformance; 