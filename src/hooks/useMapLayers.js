import { useState, useCallback } from 'react';

const initialLayers = {
  standardMap: true,
  satelliteView: false,
  solarInstallations: false,
  solarPotential: false,
  recentPermits: false,
  neighborhoodInsights: false,
  moveIns: false,
  propertyValues: false,
  cityBoundaries: false,
  incomeData: false,
  populationDensity: false
};

export const useMapLayers = () => {
  const [activeLayers, setActiveLayers] = useState(initialLayers);

  const handleLayerToggle = useCallback((layerId) => {
    setActiveLayers(prev => {
      // For map type layers, ensure only one is active at a time
      if (layerId === 'standardMap' || layerId === 'satelliteView') {
        return {
          ...prev,
          standardMap: layerId === 'standardMap',
          satelliteView: layerId === 'satelliteView'
        };
      }
      
      // For other layers, simply toggle the state
      return {
        ...prev,
        [layerId]: !prev[layerId]
      };
    });
  }, []);

  return {
    activeLayers,
    handleLayerToggle
  };
}; 