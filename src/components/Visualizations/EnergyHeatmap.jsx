import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { useApi } from '../../utils/apiUtils';

const EnergyHeatmap = ({ 
  data,
  width = '100%',
  height = 400,
  margin = { top: 60, right: 90, bottom: 60, left: 90 }
}) => {
  const formatData = (rawData) => {
    // Transform the raw data into the format required by Nivo HeatMap
    return rawData.map(region => ({
      region: region.name,
      ...region.hourlyUsage.reduce((acc, usage, hour) => ({
        ...acc,
        [`${hour}h`]: usage
      }), {})
    }));
  };

  if (!data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }

  const formattedData = formatData(data);

  return (
    <Box sx={{ height, width }}>
      <Typography variant="h6" gutterBottom>
        Energy Usage Intensity by Region
      </Typography>
      <Box sx={{ height: 'calc(100% - 32px)' }}>
        <ResponsiveHeatMap
          data={formattedData}
          keys={Array.from({ length: 24 }, (_, i) => `${i}h`)}
          indexBy="region"
          margin={margin}
          forceSquare={true}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: 'Hour of Day',
            legendPosition: 'middle',
            legendOffset: 46
          }}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: 'Hour of Day',
            legendPosition: 'middle',
            legendOffset: 46
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Region',
            legendPosition: 'middle',
            legendOffset: -72
          }}
          cellOpacity={1}
          cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
          defs={[
            {
              id: 'lines',
              type: 'patternLines',
              background: 'inherit',
              color: 'rgba(0, 0, 0, 0.1)',
              rotation: -45,
              lineWidth: 1,
              spacing: 8
            }
          ]}
          fill={[{ id: 'lines' }]}
          animate={true}
          motionStiffness={80}
          motionDamping={9}
          hoverTarget="cell"
          colors={{
            type: 'sequential',
            scheme: 'YlOrRd'
          }}
          tooltip={({ xKey, yKey, value }) => (
            <Box
              sx={{
                background: 'white',
                padding: 1,
                border: '1px solid #ccc',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                Region: {yKey}
              </Typography>
              <Typography variant="body2">
                Time: {xKey}
              </Typography>
              <Typography variant="body2">
                Usage: {value.toLocaleString()} kWh
              </Typography>
            </Box>
          )}
        />
      </Box>
    </Box>
  );
};

export default EnergyHeatmap; 