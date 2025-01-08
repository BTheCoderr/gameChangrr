import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SavingsProjectionGraph = ({
  initialSystemSize = 5,
  initialDegradation = 0.5,
  initialInflation = 3,
  yearsToProject = 25,
  currentBill = 200
}) => {
  const [systemSize, setSystemSize] = useState(initialSystemSize);
  const [degradationRate, setDegradationRate] = useState(initialDegradation);
  const [energyInflation, setEnergyInflation] = useState(initialInflation);
  const [projectionData, setProjectionData] = useState([]);

  const calculateProjection = () => {
    const monthlyProduction = systemSize * 1200; // Approximate monthly kWh per kW
    const monthlyBill = currentBill;
    
    const data = Array.from({ length: yearsToProject }, (_, year) => {
      const degradation = Math.pow(1 - degradationRate / 100, year);
      const inflation = Math.pow(1 + energyInflation / 100, year);
      const yearlyProduction = monthlyProduction * 12 * degradation;
      const yearlyBillWithoutSolar = monthlyBill * 12 * inflation;
      const yearlyBillWithSolar = Math.max(0, yearlyBillWithoutSolar - (yearlyProduction * 0.15)); // Assuming $0.15/kWh
      const yearlySavings = yearlyBillWithoutSolar - yearlyBillWithSolar;
      const cumulativeSavings = year === 0 
        ? yearlySavings 
        : data[year - 1].cumulativeSavings + yearlySavings;

      return {
        year: year + 1,
        annualSavings: Math.round(yearlySavings),
        cumulativeSavings: Math.round(cumulativeSavings),
        production: Math.round(yearlyProduction)
      };
    });

    setProjectionData(data);
  };

  useEffect(() => {
    calculateProjection();
  }, [systemSize, degradationRate, energyInflation]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Solar Savings Projection
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>System Size (kW)</Typography>
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
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Annual Degradation (%)</Typography>
            <Slider
              value={degradationRate}
              onChange={(_, value) => setDegradationRate(value)}
              min={0.1}
              max={1.0}
              step={0.1}
              marks={[
                { value: 0.1, label: '0.1%' },
                { value: 0.5, label: '0.5%' },
                { value: 1.0, label: '1.0%' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Energy Inflation (%)</Typography>
            <Slider
              value={energyInflation}
              onChange={(_, value) => setEnergyInflation(value)}
              min={0}
              max={6}
              step={0.5}
              marks={[
                { value: 0, label: '0%' },
                { value: 3, label: '3%' },
                { value: 6, label: '6%' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={projectionData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ 
                  value: 'Years', 
                  position: 'insideBottom', 
                  offset: -5 
                }}
              />
              <YAxis 
                yAxisId="left"
                label={{ 
                  value: 'Savings ($)', 
                  angle: -90, 
                  position: 'insideLeft'
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                label={{ 
                  value: 'Production (kWh)', 
                  angle: 90, 
                  position: 'insideRight' 
                }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'production') {
                    return [`${value.toLocaleString()} kWh`, 'Annual Production'];
                  }
                  return [formatCurrency(value), name === 'annualSavings' ? 'Annual Savings' : 'Cumulative Savings'];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="annualSavings"
                stroke="#8884d8"
                name="Annual Savings"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeSavings"
                stroke="#82ca9d"
                name="Cumulative Savings"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="production"
                stroke="#ffc658"
                name="Annual Production"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            * Projections are estimates based on current rates and typical system performance.
            Actual savings may vary based on weather conditions, energy usage patterns, and utility rates.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SavingsProjectionGraph; 