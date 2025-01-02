import { useState } from 'react';
import React from 'react';
import { 
  BrowserRouter as Router,
  UNSAFE_useScrollRestoration as useScrollRestoration,
  createRoutesFromChildren,
  matchRoutes,
  useNavigationType
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainLayout from './components/MainLayout';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [activeLayers, setActiveLayers] = useState({
    leads: false,
    neighborhoodInsights: false,
    utilityBoundaries: false,
    solarPermits: false,
    moveIns: false,
    cityBoundaries: false,
    manufacturedHomes: false,
    spanishSpeakers: false,
    evOwners: false,
    aerial: false
  });

  const handleLayerToggle = (layer) => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Router
          future={{ 
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <MainLayout 
            activeLayers={activeLayers}
            onLayerToggle={handleLayerToggle}
          />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
