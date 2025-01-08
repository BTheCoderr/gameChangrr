import React from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Typography,
  Button,
  Grid
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useApi, api } from '../utils/apiUtils';

const UtilityDataLoader = ({ propertyId, onDataLoaded }) => {
  const {
    data: utilityData,
    error,
    loading,
    execute: fetchUtilityData,
    reset
  } = useApi(
    async () => {
      const response = await api.get(`/api/properties/${propertyId}/utility-data`);
      return response.data;
    },
    {
      fallbackMessage: 'Unable to load utility data. Please try again later.',
      onError: (error) => {
        console.error('Utility data fetch error:', error);
      }
    }
  );

  // Load data on mount
  React.useEffect(() => {
    fetchUtilityData();
  }, [propertyId]);

  // Notify parent when data is loaded
  React.useEffect(() => {
    if (utilityData) {
      onDataLoaded?.(utilityData);
    }
  }, [utilityData]);

  // Handle retry button click
  const handleRetry = () => {
    reset();
    fetchUtilityData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Retry
          </Button>
        }
      >
        <AlertTitle>Error Loading Data</AlertTitle>
        {error.message}
        {error.retry && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Attempted {error.retryCount} retries
          </Typography>
        )}
      </Alert>
    );
  }

  if (!utilityData) {
    return (
      <Alert severity="info">
        No utility data available
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Utility Data
        </Typography>
        
        {/* Monthly Usage */}
        <Box mb={3}>
          <Typography variant="subtitle1" color="text.secondary">
            Monthly Usage
          </Typography>
          <Typography variant="h4">
            {utilityData.monthlyUsage.toLocaleString()} kWh
          </Typography>
        </Box>

        {/* Rate Information */}
        <Box mb={3}>
          <Typography variant="subtitle1" color="text.secondary">
            Current Rate
          </Typography>
          <Typography variant="h4">
            ${utilityData.rate.toFixed(2)}/kWh
          </Typography>
        </Box>

        {/* Bill Details */}
        <Box>
          <Typography variant="subtitle1" color="text.secondary">
            Last Bill
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h6">
                ${utilityData.lastBill.amount.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="h6">
                {new Date(utilityData.lastBill.dueDate).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Historical Data */}
        {utilityData.historicalUsage && (
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Historical Usage
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={utilityData.historicalUsage}>
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('default', { month: 'short' })}
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#8884d8" 
                  name="Usage (kWh)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Peak Usage Times */}
        {utilityData.peakUsage && (
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Peak Usage Times
            </Typography>
            <Grid container spacing={2}>
              {utilityData.peakUsage.map((peak, index) => (
                <Grid item xs={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {peak.timeRange}
                      </Typography>
                      <Typography variant="h6">
                        {peak.usage.toLocaleString()} kWh
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UtilityDataLoader; 