import React from 'react';
import { Paper, Typography, Box, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WeatherInfo from '../Weather/WeatherInfo';
import SolarPotential from '../Solar/SolarPotential';
import EnergyPerformance from '../Energy/EnergyPerformance';

const PropertyCard = ({ property, onClose }) => {
  if (!property) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 350,
        backgroundColor: 'white',
        borderRadius: 2,
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1
      }}>
        <Typography variant="h6">Property Details</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {property.address}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.city}, MA {property.zip}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <DetailRow label="Property Type" value={property.propertyType || 'Single Family'} />
          <DetailRow label="Owner" value={property.owner || 'N/A'} />
          <DetailRow label="Equity" value={`$${(property.equity || 0).toLocaleString()}`} />
          <DetailRow label="Income" value={`$${(property.income || 0).toLocaleString()}`} />
          <DetailRow label="Square Footage" value={`${(property.squareFootage || 0).toLocaleString()} sq ft`} />
          <DetailRow label="Year Built" value={property.yearBuilt || 'N/A'} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Weather Information</Typography>
          <WeatherInfo lat={property.lat} lon={property.lng} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Solar Potential</Typography>
          <SolarPotential 
            lat={property.lat} 
            lon={property.lng} 
            roofArea={property.squareFootage * 0.5} // Estimate roof area as 50% of total square footage
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Energy Performance</Typography>
          <EnergyPerformance 
            propertyType={property.propertyType || 'SingleFamily'}
            squareFootage={property.squareFootage}
            yearBuilt={property.yearBuilt}
          />
        </Box>

        <Box sx={{ display: 'grid', gap: 1 }}>
          <Button variant="outlined" color="error" fullWidth>
            Not Interested
          </Button>
          <Button variant="outlined" color="primary" fullWidth>
            To Visit
          </Button>
          <Button variant="outlined" color="warning" fullWidth>
            Go Back
          </Button>
          <Button variant="contained" color="success" fullWidth>
            Appointment Set
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

const DetailRow = ({ label, value }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between',
    py: 0.5
  }}>
    <Typography variant="body2" color="text.secondary">
      {label}:
    </Typography>
    <Typography variant="body2">
      {value}
    </Typography>
  </Box>
);

export default PropertyCard; 