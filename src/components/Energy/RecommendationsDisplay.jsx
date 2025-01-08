import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, CircularProgress,
  Tabs, Tab, Box, Chip, Button, Accordion, AccordionSummary,
  AccordionDetails, LinearProgress, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { getEfficiencyRecommendations } from '../../services/energyStarService';
import { cacheManager } from '../../utils/cacheUtils';
import { withRetry } from '../../utils/retryUtils';

const COLORS = ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0'];
const LOCAL_RATE_PER_KWH = 0.24; // Default rate, should be fetched from utility API
const EMISSION_FACTOR = 0.92; // kg CO2 per kWh (example value, should be location-specific)

const RecommendationsDisplay = ({ propertyId, energyScore }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [predictiveData, setPredictiveData] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedData = cacheManager.get('recommendations', { propertyId });
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch with retry logic
        const response = await withRetry(() => 
          getEfficiencyRecommendations({
            propertyId,
            energyScore,
            includeSolar: true,
            filters: {
              categories: ['HVAC', 'Building_Envelope', 'Solar_Integration'],
              maxPayback: 10
            }
          })
        );

        // Cache the response
        cacheManager.set('recommendations', { propertyId }, response);
        setData(response);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [propertyId, energyScore]);

  useEffect(() => {
    const calculatePredictiveData = (data) => {
      if (!data) return null;

      const annualUsage = data.potentialImpact.annualUsage || 12000; // Default if not provided
      const solarOffset = data.solarIntegration?.annualProduction || annualUsage * 0.7; // Estimate 70% offset if not provided
      const totalSystemCost = data.solarIntegration?.systemCost || 20000; // Default if not provided

      const monthlyBillBefore = (annualUsage * LOCAL_RATE_PER_KWH) / 12;
      const monthlyBillAfter = ((annualUsage - solarOffset) * LOCAL_RATE_PER_KWH) / 12;
      const carbonOffset = solarOffset * EMISSION_FACTOR;
      const annualSavings = (solarOffset * LOCAL_RATE_PER_KWH);
      const roi = totalSystemCost / annualSavings;

      return {
        monthlyBillBefore,
        monthlyBillAfter,
        carbonOffset,
        annualSavings,
        roi,
        paybackPeriod: roi,
        twentyYearSavings: annualSavings * 20 - totalSystemCost
      };
    };

    if (data) {
      setPredictiveData(calculatePredictiveData(data));
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading recommendations...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={() => cacheManager.clear('recommendations')}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderSavingsChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.recommendations.map(r => ({
        name: r.category,
        savings: r.measures.reduce((sum, m) => sum + m.savings.costAnnual, 0)
      }))}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="savings" fill="#4CAF50" name="Annual Savings" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderROIChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data.prioritizedMeasures.map((measure, index) => ({
            name: measure.name,
            value: measure.implementation.roi
          }))}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.prioritizedMeasures.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value.toFixed(1)}% ROI`} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderMeasureDetails = (measure) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        {measure.name}
        <Chip
          size="small"
          label={measure.implementation.difficulty}
          color={measure.implementation.difficulty === 'easy' ? 'success' : 
                 measure.implementation.difficulty === 'moderate' ? 'warning' : 'error'}
          sx={{ ml: 1 }}
        />
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Annual Savings: ${measure.savings.costAnnual.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Energy Reduction: {measure.savings.energyPercent}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CO₂ Reduction: {measure.savings.carbonReduction} tons/year
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Implementation Time: {measure.implementation.timeframe}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Payback Period: {measure.implementation.paybackPeriod} years
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ROI: {measure.implementation.roi}%
          </Typography>
        </Grid>

        {measure.solarIntegration && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Solar Integration Benefits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Additional Savings: ${measure.solarIntegration.additionalSavings.toLocaleString()}/year
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Combined Payback: {measure.solarIntegration.combinedPayback} years
            </Typography>
            <LinearProgress
              variant="determinate"
              value={measure.solarIntegration.compatibilityScore}
              sx={{ mt: 1 }}
              color={measure.solarIntegration.compatibilityScore > 75 ? 'success' : 'warning'}
            />
            <Typography variant="caption" color="text.secondary">
              Solar Compatibility: {measure.solarIntegration.compatibilityScore}%
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderPredictiveAnalysis = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Predictive Analysis</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Monthly Bill Impact</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Current Bill</Typography>
                    <Typography variant="h6" color="error">
                      ${predictiveData.monthlyBillBefore.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">After Solar</Typography>
                    <Typography variant="h6" color="success.main">
                      ${predictiveData.monthlyBillAfter.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                <LinearProgress
                  variant="determinate"
                  value={(1 - predictiveData.monthlyBillAfter / predictiveData.monthlyBillBefore) * 100}
                  sx={{ mt: 2 }}
                  color="success"
                />
                <Typography variant="caption" color="text.secondary">
                  {((1 - predictiveData.monthlyBillAfter / predictiveData.monthlyBillBefore) * 100).toFixed(1)}% Reduction
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Environmental Impact</Typography>
                <Typography variant="h6">
                  {(predictiveData.carbonOffset / 1000).toFixed(1)} metric tons
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Annual CO₂ Reduction
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Equivalent to:
                  </Typography>
                  <Typography variant="body2">
                    🌳 {Math.round(predictiveData.carbonOffset / 21.7)} trees planted
                  </Typography>
                  <Typography variant="body2">
                    🚗 {Math.round(predictiveData.carbonOffset / 4.6)} fewer cars on the road
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Financial Analysis</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Annual Savings</Typography>
                    <Typography variant="h6">
                      ${predictiveData.annualSavings.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Payback Period</Typography>
                    <Typography variant="h6">
                      {predictiveData.paybackPeriod.toFixed(1)} years
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">20-Year Savings</Typography>
                    <Typography variant="h6">
                      ${(predictiveData.twentyYearSavings / 1000).toFixed(1)}k
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Return on Investment (ROI)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((1 / predictiveData.roi) * 100, 100)}
                    sx={{ mt: 1 }}
                    color="primary"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {((1 / predictiveData.roi) * 100).toFixed(1)}% over system lifetime
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {predictiveData && renderPredictiveAnalysis()}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Summary Impact</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Total Annual Savings</Typography>
              <Typography variant="h4">
                ${data.potentialImpact.totalCostSavings.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Energy Reduction</Typography>
              <Typography variant="h4">
                {data.potentialImpact.totalEnergySavings.toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Carbon Reduction</Typography>
              <Typography variant="h4">
                {data.potentialImpact.carbonReduction} tons
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Average Payback</Typography>
              <Typography variant="h4">
                {data.potentialImpact.averagePayback.toFixed(1)} years
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Savings Analysis" />
            <Tab label="ROI Comparison" />
            <Tab label="Detailed Measures" />
          </Tabs>

          {activeTab === 0 && renderSavingsChart()}
          {activeTab === 1 && renderROIChart()}
          {activeTab === 2 && (
            <div>
              {data.recommendations.map((category, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{category.category}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {category.measures.map((measure, mIndex) => (
                      <Box key={mIndex} sx={{ mb: mIndex !== category.measures.length - 1 ? 3 : 0 }}>
                        {renderMeasureDetails(measure)}
                        {mIndex !== category.measures.length - 1 && (
                          <Box sx={{ my: 2, borderBottom: 1, borderColor: 'divider' }} />
                        )}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsDisplay; 