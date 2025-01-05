// Layer utility functions for Mapbox GL JS

export const createMoveInsLayer = (map, source) => {
  if (!map.getSource('move-ins')) {
    map.addSource('move-ins', {
      type: 'geojson',
      data: source,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
  }

  // Add clusters layer
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'move-ins',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        5,
        '#f1f075',
        10,
        '#f28cb1'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        5,
        30,
        10,
        40
      ]
    }
  });

  // Add cluster count layer
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'move-ins',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  });

  // Add unclustered point layer
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'move-ins',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#4CAF50',
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  });
};

export const createNeighborhoodsLayer = (map, source) => {
  if (!map.getSource('neighborhoods')) {
    map.addSource('neighborhoods', {
      type: 'geojson',
      data: source
    });
  }

  map.addLayer({
    id: 'neighborhood-boundaries',
    type: 'fill',
    source: 'neighborhoods',
    paint: {
      'fill-color': '#1976d2',
      'fill-opacity': 0.1,
      'fill-outline-color': '#1976d2'
    }
  });
};

export const createSolarInstallationsLayer = (map, source) => {
  if (!map.getSource('solar-installations')) {
    map.addSource('solar-installations', {
      type: 'geojson',
      data: source
    });
  }

  map.addLayer({
    id: 'solar-installations',
    type: 'circle',
    source: 'solar-installations',
    paint: {
      'circle-color': '#f57c00',
      'circle-radius': 6,
      'circle-opacity': 0.7
    }
  });
};