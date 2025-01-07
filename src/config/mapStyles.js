// Color palettes
export const COLORS = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1'
  },
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20'
  },
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100'
  }
};

// Layer style configurations
export const LAYER_STYLES = {
  boundaries: {
    fill: {
      'fill-color': [
        'match',
        ['get', 'utilityName'],
        'Massachusetts Electric Co', COLORS.primary[500],
        'NSTAR Electric Company', COLORS.warning[500],
        'Western Massachusetts Electric Company', COLORS.success[500],
        COLORS.primary[200] // Default color
      ],
      'fill-opacity': 0.6
    },
    line: {
      'line-color': '#666666',
      'line-width': 1,
      'line-opacity': 0.8
    },
    highlight: {
      'fill-opacity': 0.8,
      'line-width': 2,
      'line-opacity': 1
    }
  },
  permits: {
    circle: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'systemSize'],
        5, 5,
        15, 15
      ],
      'circle-color': COLORS.success[500],
      'circle-opacity': 0.8,
      'circle-stroke-color': COLORS.success[700],
      'circle-stroke-width': 1
    },
    cluster: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        COLORS.success[300],
        10, COLORS.success[500],
        50, COLORS.success[700]
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        10, 30,
        50, 40
      ]
    }
  },
  solarPotential: {
    fill: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'annualGeneration'],
        6000, COLORS.primary[50],
        7000, COLORS.primary[200],
        8000, COLORS.primary[400],
        9000, COLORS.primary[600],
        10000, COLORS.primary[800]
      ],
      'fill-opacity': 0.7
    },
    line: {
      'line-color': '#666666',
      'line-width': 1,
      'line-opacity': 0.5
    }
  },
  heatmap: {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'point_count'],
      0, 0,
      10, 1
    ],
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      9, 3
    ],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.2, COLORS.primary[200],
      0.4, COLORS.primary[400],
      0.6, COLORS.primary[600],
      0.8, COLORS.primary[700],
      1, COLORS.primary[900]
    ],
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 2,
      9, 20
    ],
    'heatmap-opacity': 0.7
  }
};

// Popup configurations
export const POPUP_CONFIG = {
  offset: [0, -10],
  closeButton: false,
  closeOnClick: true,
  className: 'map-popup'
};

// Layer interaction states
export const INTERACTION_STATES = {
  hover: {
    cursor: 'pointer',
    fillOpacity: 0.8,
    lineWidth: 2
  },
  click: {
    fillOpacity: 0.9,
    lineWidth: 3
  }
};

// Legend configurations
export const LEGEND_CONFIG = {
  solarPotential: {
    title: 'Solar Generation Potential',
    items: [
      { label: 'Very High (>10,000 kWh)', color: COLORS.primary[800] },
      { label: 'High (9,000-10,000 kWh)', color: COLORS.primary[600] },
      { label: 'Medium (8,000-9,000 kWh)', color: COLORS.primary[400] },
      { label: 'Low (7,000-8,000 kWh)', color: COLORS.primary[200] },
      { label: 'Very Low (<7,000 kWh)', color: COLORS.primary[50] }
    ]
  },
  utilities: {
    title: 'Utility Companies',
    items: [
      { label: 'Massachusetts Electric Co', color: COLORS.primary[500] },
      { label: 'NSTAR Electric Company', color: COLORS.warning[500] },
      { label: 'Western Massachusetts Electric', color: COLORS.success[500] }
    ]
  },
  permits: {
    title: 'Solar Installations',
    items: [
      { label: 'Large System (>10 kW)', size: 15, color: COLORS.success[500] },
      { label: 'Medium System (7-10 kW)', size: 10, color: COLORS.success[500] },
      { label: 'Small System (<7 kW)', size: 5, color: COLORS.success[500] }
    ]
  }
}; 