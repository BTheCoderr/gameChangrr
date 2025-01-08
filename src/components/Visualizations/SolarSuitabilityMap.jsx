import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Switch,
  Slider,
  Grid
} from '@mui/material';
import { GoogleMap, Circle, HeatmapLayer } from '@react-google-maps/api';

const SolarSuitabilityMap = ({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 12,
  data = [],
  mapStyle = 'satellite'
}) => {
  const [map, setMap] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacityLevel, setOpacityLevel] = useState(0.6);
  const [radiusSize, setRadiusSize] = useState(50);

  const mapOptions = {
    mapTypeId: mapStyle,
    tilt: 0,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: true,
    fullscreenControl: true
  };

  const heatmapData = data.map(point => ({
    location: new google.maps.LatLng(point.lat, point.lng),
    weight: point.suitabilityScore
  }));

  const heatmapOptions = {
    data: heatmapData,
    dissipating: true,
    radius: radiusSize,
    opacity: opacityLevel,
    gradient: [
      'rgba(0, 255, 0, 0)',
      'rgba(0, 255, 0, 1)',
      'rgba(255, 255, 0, 1)',
      'rgba(255, 128, 0, 1)',
      'rgba(255, 0, 0, 1)'
    ]
  };

  const onLoad = (map) => {
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Solar Suitability Map
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  name="showHeatmap"
                />
              }
              label="Show Heatmap"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Opacity</Typography>
            <Slider
              value={opacityLevel}
              onChange={(_, value) => setOpacityLevel(value)}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: '0%' },
                { value: 0.5, label: '50%' },
                { value: 1, label: '100%' }
              ]}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Radius</Typography>
            <Slider
              value={radiusSize}
              onChange={(_, value) => setRadiusSize(value)}
              min={20}
              max={100}
              marks={[
                { value: 20, label: 'Small' },
                { value: 60, label: 'Medium' },
                { value: 100, label: 'Large' }
              ]}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            height: 500,
            width: '100%',
            position: 'relative',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%'
            }}
            center={center}
            zoom={zoom}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {showHeatmap && (
              <HeatmapLayer options={heatmapOptions} />
            )}

            {data.map((point, index) => (
              <Circle
                key={index}
                center={{ lat: point.lat, lng: point.lng }}
                options={{
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '#FF0000',
                  fillOpacity: 0.35,
                  radius: 100,
                  visible: !showHeatmap
                }}
              />
            ))}
          </GoogleMap>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            * Solar suitability is calculated based on roof orientation, shading,
            and historical weather patterns. Areas in red indicate highest potential.
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="subtitle2" color="success.main">
                High Potential
              </Typography>
              <Typography variant="body2">
                Optimal conditions for solar installation
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2" color="warning.main">
                Medium Potential
              </Typography>
              <Typography variant="body2">
                Good conditions with some limitations
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2" color="error.main">
                Low Potential
              </Typography>
              <Typography variant="body2">
                Significant limitations present
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SolarSuitabilityMap; 