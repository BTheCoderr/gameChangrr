import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip as MuiTooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const IncentiveBreakdownChart = ({
  data = [],
  systemSize = 5,
  systemCost = 15000
}) => {
  const [viewType, setViewType] = useState('percentage');
  const [timeframe, setTimeframe] = useState('immediate');

  const calculateIncentiveValue = (incentive) => {
    const baseAmount = systemCost;
    
    switch (incentive.type) {
      case 'percentage':
        return baseAmount * (incentive.value / 100);
      case 'fixed':
        return incentive.value;
      case 'perWatt':
        return systemSize * 1000 * incentive.value;
      default:
        return 0;
    }
  };

  const processData = () => {
    const processedData = data
      .filter(incentive => {
        if (timeframe === 'immediate') {
          return incentive.timeframe === 'immediate';
        } else if (timeframe === 'future') {
          return incentive.timeframe === 'future';
        }
        return true;
      })
      .map(incentive => {
        const value = calculateIncentiveValue(incentive);
        return {
          name: incentive.name,
          value: viewType === 'percentage' 
            ? (value / systemCost) * 100 
            : value,
          category: incentive.category,
          description: incentive.description,
          requirements: incentive.requirements,
          timeline: incentive.timeline
        };
      });

    return processedData.sort((a, b) => b.value - a.value);
  };

  const formatValue = (value) => {
    if (viewType === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getBarFill = (category) => {
    const colors = {
      federal: '#2196f3',
      state: '#4caf50',
      utility: '#ff9800',
      local: '#9c27b0'
    };
    return colors[category.toLowerCase()] || '#757575';
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs>
            <Typography variant="h6">
              Available Incentives Breakdown
              <MuiTooltip title="Breakdown of all available incentives for your solar installation">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </MuiTooltip>
            </Typography>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel>View</InputLabel>
              <Select
                value={viewType}
                label="View"
                onChange={(e) => setViewType(e.target.value)}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="amount">Dollar Amount</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <MenuItem value="all">All Incentives</MenuItem>
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="future">Future/Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processData()}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                label={{ 
                  value: viewType === 'percentage' ? 'Percentage of System Cost' : 'Incentive Amount ($)',
                  angle: -90,
                  position: 'insideLeft'
                }}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  formatValue(value),
                  props.payload.name
                ]}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const data = payload[0].payload;
                  return (
                    <Card sx={{ p: 1, maxWidth: 300 }}>
                      <Typography variant="subtitle2">{data.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Value: {formatValue(data.value)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Category: {data.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Timeline: {data.timeline}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {data.description}
                      </Typography>
                      {data.requirements && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Requirements: {data.requirements}
                        </Typography>
                      )}
                    </Card>
                  );
                }}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill="#8884d8"
                name={viewType === 'percentage' ? 'Percentage' : 'Amount'}
                radius={[4, 4, 0, 0]}
              >
                {processData().map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={getBarFill(entry.category)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            * Incentive values are estimates based on current rates and programs.
            Actual amounts may vary based on final system configuration and program availability.
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">
              System Details:
            </Typography>
            <Typography variant="body2">
              Size: {systemSize} kW
            </Typography>
            <Typography variant="body2">
              Estimated Cost: {formatValue(systemCost)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">
              Total Incentives:
            </Typography>
            <Typography variant="body2">
              Amount: {formatValue(processData().reduce((sum, item) => 
                viewType === 'percentage' ? sum : sum + item.value, 0
              ))}
            </Typography>
            <Typography variant="body2">
              Percentage: {formatValue(processData().reduce((sum, item) => 
                viewType === 'percentage' ? sum + item.value : sum, 0
              ))}% of system cost
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default IncentiveBreakdownChart; 