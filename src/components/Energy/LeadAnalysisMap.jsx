import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, Box, Drawer,
  List, ListItem, ListItemText, IconButton, Button,
  TextField, Slider, FormControlLabel, Switch,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmailIcon from '@mui/icons-material/Email';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getPropertyAnalytics } from '../../services/energyStarService';
import { cacheManager } from '../../utils/cacheUtils';
import { withRetry } from '../../utils/retryUtils';

const SCORE_THRESHOLD = 75; // Properties below this are considered high-potential leads
const SAVINGS_THRESHOLD = 1000; // Monthly savings threshold in dollars

const LeadAnalysisMap = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    maxEnergyScore: 100,
    minPotentialSavings: 0,
    solarCompatible: true,
    highPriority: false
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const cachedData = cacheManager.get('propertyAnalytics', {});
        
        if (cachedData) {
          setProperties(cachedData);
        } else {
          const response = await withRetry(() => getPropertyAnalytics());
          cacheManager.set('propertyAnalytics', {}, response);
          setProperties(response);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter(property => {
      const meetsScoreFilter = property.energyStarScore <= filters.maxEnergyScore;
      const meetsSavingsFilter = property.potentialSavings >= filters.minPotentialSavings;
      const meetsSolarFilter = !filters.solarCompatible || property.solarCompatible;
      const meetsHighPriorityFilter = !filters.highPriority || 
        (property.energyStarScore < SCORE_THRESHOLD && 
         property.potentialSavings > SAVINGS_THRESHOLD);
      
      return meetsScoreFilter && meetsSavingsFilter && 
             meetsSolarFilter && meetsHighPriorityFilter;
    });

    setFilteredProperties(filtered);
  }, [properties, filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = (property) => {
    // Implementation for generating PDF report
    console.log('Generating report for:', property);
    setReportDialogOpen(true);
  };

  const sendLeadEmail = (property) => {
    // Implementation for sending automated email
    console.log('Sending lead email for:', property);
  };

  const renderPropertyPopup = (property) => (
    <Box sx={{ minWidth: 200 }}>
      <Typography variant="h6" gutterBottom>
        {property.address}
        {property.energyStarScore < SCORE_THRESHOLD && (
          <Chip 
            size="small" 
            color="error" 
            label="High Potential" 
            sx={{ ml: 1 }} 
          />
        )}
      </Typography>
      
      <List dense>
        <ListItem>
          <ListItemText 
            primary={`Energy STAR Score: ${property.energyStarScore}`}
            secondary={property.energyStarScore < SCORE_THRESHOLD ? 'Below Average' : 'Good'}
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary={`Current Usage: ${property.currentEnergyUsage.toLocaleString()} kWh/year`}
            secondary="Based on utility data"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary={`Potential Savings: $${property.potentialSavings.toLocaleString()}/year`}
            secondary={`ROI: ${property.roi}%`}
          />
        </ListItem>
      </List>

      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => generateReport(property)}
        >
          Report
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<EmailIcon />}
          onClick={() => sendLeadEmail(property)}
        >
          Contact
        </Button>
      </Box>
    </Box>
  );

  const renderFilterDrawer = () => (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 300, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Properties
        </Typography>

        <Box sx={{ my: 3 }}>
          <Typography gutterBottom>
            Max Energy STAR Score
          </Typography>
          <Slider
            value={filters.maxEnergyScore}
            onChange={(_, value) => handleFilterChange('maxEnergyScore', value)}
            valueLabelDisplay="auto"
            min={0}
            max={100}
          />
        </Box>

        <Box sx={{ my: 3 }}>
          <Typography gutterBottom>
            Min Annual Savings ($)
          </Typography>
          <TextField
            type="number"
            value={filters.minPotentialSavings}
            onChange={(e) => handleFilterChange('minPotentialSavings', Number(e.target.value))}
            fullWidth
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={filters.solarCompatible}
              onChange={(e) => handleFilterChange('solarCompatible', e.target.checked)}
            />
          }
          label="Solar Compatible Only"
        />

        <FormControlLabel
          control={
            <Switch
              checked={filters.highPriority}
              onChange={(e) => handleFilterChange('highPriority', e.target.checked)}
            />
          }
          label="High-Priority Leads Only"
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Showing {filteredProperties.length} of {properties.length} properties
        </Typography>
      </Box>
    </Drawer>
  );

  const renderReportDialog = () => (
    <Dialog
      open={reportDialogOpen}
      onClose={() => setReportDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Generate Property Report
      </DialogTitle>
      <DialogContent>
        {selectedProperty && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                Property Details
              </Typography>
              {/* Add report configuration options */}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setReportDialogOpen(false)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => {
          // Implementation for downloading report
          setReportDialogOpen(false);
        }}>
          Download Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <div>
      <Box sx={{ position: 'relative', height: 600 }}>
        <IconButton
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
          onClick={() => setDrawerOpen(true)}
        >
          <FilterListIcon />
        </IconButton>

        <MapContainer
          center={[37.7749, -122.4194]} // Default to San Francisco
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredProperties.map(property => (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              eventHandlers={{
                click: () => setSelectedProperty(property)
              }}
            >
              <Popup>
                {renderPropertyPopup(property)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

      {renderFilterDrawer()}
      {renderReportDialog()}
    </div>
  );
};

export default LeadAnalysisMap; 