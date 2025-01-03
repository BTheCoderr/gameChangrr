import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Typography,
  Switch,
  Divider,
  IconButton
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LanguageIcon from '@mui/icons-material/Language';
import HouseIcon from '@mui/icons-material/House';
import ElectricCarIcon from '@mui/icons-material/ElectricCar';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

function Sidebar({ isOpen, onToggle, activeLayers, onLayerToggle }) {
  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'white',
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* Toggle Button */}
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          zIndex: 1
        }}
      >
        {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>

      {/* Map Type Section */}
      <Box sx={{ p: 2, pt: 6 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Map Type
        </Typography>
        <List disablePadding>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <MapIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Standard Map" />
            <Switch 
              size="small" 
              checked={activeLayers.standardMap}
              onChange={() => onLayerToggle('standardMap')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SatelliteAltIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Satellite View" />
            <Switch 
              size="small"
              checked={activeLayers.satelliteView}
              onChange={() => onLayerToggle('satelliteView')}
            />
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* Solar Data Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Solar Data
        </Typography>
        <List disablePadding>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <WbSunnyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Solar Installations" />
            <Switch 
              size="small"
              checked={activeLayers.solarInstallations}
              onChange={() => onLayerToggle('solarInstallations')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ShowChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Solar Potential" />
            <Switch 
              size="small"
              checked={activeLayers.solarPotential}
              onChange={() => onLayerToggle('solarPotential')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HomeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Property Boundaries" />
            <Switch 
              size="small"
              checked={activeLayers.propertyBoundaries}
              onChange={() => onLayerToggle('propertyBoundaries')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Solar Permits" />
            <Switch 
              size="small"
              checked={activeLayers.solarPermits}
              onChange={() => onLayerToggle('solarPermits')}
            />
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* Property Insights Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Property Insights
        </Typography>
        <List disablePadding>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BusinessIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Neighborhood Insights" />
            <Switch 
              size="small"
              checked={activeLayers.neighborhoodInsights}
              onChange={() => onLayerToggle('neighborhoodInsights')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HomeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Move Ins" />
            <Switch 
              size="small"
              checked={activeLayers.moveIns}
              onChange={() => onLayerToggle('moveIns')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Leads" />
            <Switch 
              size="small"
              checked={activeLayers.leads}
              onChange={() => onLayerToggle('leads')}
            />
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* Demographics & Boundaries Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Demographics & Boundaries
        </Typography>
        <List disablePadding>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ApartmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Utility Boundaries" />
            <Switch 
              size="small"
              checked={activeLayers.utilityBoundaries}
              onChange={() => onLayerToggle('utilityBoundaries')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LocationCityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="City Boundaries" />
            <Switch 
              size="small"
              checked={activeLayers.cityBoundaries}
              onChange={() => onLayerToggle('cityBoundaries')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LanguageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Spanish Speakers" />
            <Switch 
              size="small"
              checked={activeLayers.spanishSpeakers}
              onChange={() => onLayerToggle('spanishSpeakers')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HouseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Manufactured Homes" />
            <Switch 
              size="small"
              checked={activeLayers.manufacturedHomes}
              onChange={() => onLayerToggle('manufacturedHomes')}
            />
          </ListItem>
          <ListItem dense>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ElectricCarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="EV Owners" />
            <Switch 
              size="small"
              checked={activeLayers.evOwners}
              onChange={() => onLayerToggle('evOwners')}
            />
          </ListItem>
        </List>
      </Box>

      {/* Aerial Imagery Toggle */}
      <Box sx={{ 
        p: 2, 
        mt: 'auto',
        borderTop: '1px solid rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <WbSunnyOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          Use current aerial imagery
        </Typography>
        <Switch 
          size="small"
          checked={activeLayers.useCurrentAerial}
          onChange={() => onLayerToggle('useCurrentAerial')}
        />
      </Box>
    </Box>
  );
}

export default Sidebar; 