import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MapboxMap from './components/Map/MapboxMap';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2879b9',
    },
    secondary: {
      main: '#08306b',
    },
    background: {
      default: '#ffffff',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ height: '100vh', width: '100vw' }}>
        <MapboxMap />
      </div>
    </ThemeProvider>
  );
}

export default App;
