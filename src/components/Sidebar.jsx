import { Box, List, ListItem, ListItemIcon, ListItemText, Switch, Typography, IconButton } from '@mui/material';
import PropTypes from 'prop-types';
import GridViewIcon from '@mui/icons-material/GridView';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import RvHookupIcon from '@mui/icons-material/RvHookup';
import TranslateIcon from '@mui/icons-material/Translate';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

function Sidebar({ activeLayers, onLayerToggle, isOpen, onToggle }) {
  return (
    <Box sx={{ 
      width: isOpen ? 240 : 60,
      height: '100vh',
      backgroundColor: 'white',
      borderRight: '1px solid rgba(0, 0, 0, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Toggle Button */}
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'absolute',
          right: isOpen ? 8 : 8,
          top: 8,
          transition: 'right 0.3s ease',
          backgroundColor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          color: '#1976d2',
          width: '32px',
          height: '32px',
          zIndex: 1300,
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            boxShadow: '0px 4px 8px rgba(0,0,0,0.1)'
          }
        }}
      >
        {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>

      {/* Navigation */}
      <List sx={{ mt: 5 }}>
        <ListItem 
          component="button"
          onClick={() => window.location.href = '/'}
          sx={{ 
            border: 'none',
            background: 'none',
            width: '100%',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 40, 
            color: '#1976d2',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <GridViewIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary={<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>Dashboard</Typography>}
            sx={{ 
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }} 
          />
        </ListItem>
        <ListItem 
          component="button"
          onClick={() => window.location.href = '/map'}
          sx={{ 
            border: 'none',
            background: 'none',
            width: '100%',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 40, 
            color: '#1976d2',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <MapIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary={<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>Map</Typography>}
            sx={{ 
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }} 
          />
        </ListItem>
      </List>

      {/* Layers Section */}
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
        Layers
      </Typography>
      <List>
        {[
          { icon: PersonIcon, label: 'Leads', id: 'leads', color: '#FFD700' },
          { icon: TrendingUpIcon, label: 'Neighborhood Insights', id: 'neighborhoodInsights', color: '#2196F3' },
          { icon: BusinessIcon, label: 'Utility Boundaries', id: 'utilityBoundaries', color: '#1976d2' },
          { icon: WbSunnyIcon, label: 'Solar Permits', id: 'solarPermits', color: '#4CAF50' },
          { icon: HomeIcon, label: 'Move Ins', id: 'moveIns', color: '#2196F3' },
          { icon: LocationCityIcon, label: 'City Boundaries', id: 'cityBoundaries', color: '#2196F3' },
          { icon: RvHookupIcon, label: 'Manufactured Homes', id: 'manufacturedHomes', color: '#2196F3' },
          { icon: TranslateIcon, label: 'Spanish Speakers', id: 'spanishSpeakers', color: '#2196F3' },
          { icon: DirectionsCarIcon, label: 'EV Owners', id: 'evOwners', color: '#2196F3' }
        ].map(({ icon: Icon, label, id, color }) => (
          <ListItem key={id}>
            <ListItemIcon>
              <Icon sx={{ color, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{label}</Typography>}
            />
            <Switch
              edge="end"
              size="small"
              checked={activeLayers[id] || false}
              onChange={() => onLayerToggle(id)}
            />
          </ListItem>
        ))}
      </List>

      {/* Aerial Imagery Toggle */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
        <ListItem>
          <ListItemText 
            primary={<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>Use current aerial imagery</Typography>}
          />
          <Switch
            edge="end"
            size="small"
            checked={activeLayers.aerial || false}
            onChange={() => onLayerToggle('aerial')}
          />
        </ListItem>
      </Box>
    </Box>
  );
}

Sidebar.propTypes = {
  activeLayers: PropTypes.object.isRequired,
  onLayerToggle: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default Sidebar; 