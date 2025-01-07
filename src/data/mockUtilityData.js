export const mockUtilityBoundaries = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'western_mass_electric',
        name: 'Western Massachusetts Electric Company',
        serviceArea: 'Western Massachusetts',
        color: '#FFA000',
        borderColor: '#FF6F00',
        opacity: 0.4,
        rateType: 'Residential',
        solarRate: '0.22',
        totalCustomers: 210000,
        avgBill: 175,
        solarAdoption: '14%',
        hasSolarProgram: true,
        programDetails: 'Connected Solutions Program'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.0, 42.5],
          [-72.6, 42.5],
          [-72.6, 42.2],
          [-73.0, 42.2],
          [-73.0, 42.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'mass_electric',
        name: 'Massachusetts Electric Co',
        serviceArea: 'Central Massachusetts',
        color: '#F57C00',
        borderColor: '#E65100',
        opacity: 0.4,
        rateType: 'Time-of-Use',
        solarRate: '0.24',
        totalCustomers: 320000,
        avgBill: 165,
        solarAdoption: '12%',
        hasSolarProgram: true,
        programDetails: 'Solar Rewards Program'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.6, 42.5],
          [-72.2, 42.5],
          [-72.2, 42.2],
          [-72.6, 42.2],
          [-72.6, 42.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'nstar_electric',
        name: 'NSTAR Electric Company',
        serviceArea: 'Eastern Massachusetts',
        color: '#FB8C00',
        borderColor: '#EF6C00',
        opacity: 0.4,
        rateType: 'Residential',
        solarRate: '0.23',
        totalCustomers: 450000,
        avgBill: 180,
        solarAdoption: '15%',
        hasSolarProgram: true,
        programDetails: 'Solar Massachusetts Renewable Target'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.2, 42.5],
          [-71.8, 42.5],
          [-71.8, 42.2],
          [-72.2, 42.2],
          [-72.2, 42.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'chicopee',
        name: 'City of Chicopee (MA)',
        serviceArea: 'Chicopee Metropolitan Area',
        color: '#FF5252',
        borderColor: '#D32F2F',
        opacity: 0.4,
        rateType: 'Municipal',
        solarRate: '0.21',
        totalCustomers: 25000,
        avgBill: 155,
        solarAdoption: '8%',
        hasSolarProgram: true,
        programDetails: 'Municipal Solar Initiative'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.6, 42.2],
          [-72.5, 42.2],
          [-72.5, 42.1],
          [-72.6, 42.1],
          [-72.6, 42.2]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'farmington_river',
        name: 'Farmington River Power Company',
        serviceArea: 'Farmington River Valley',
        color: '#9E9E9E',
        borderColor: '#616161',
        opacity: 0.4,
        rateType: 'Standard',
        solarRate: '0.20',
        totalCustomers: 15000,
        avgBill: 160,
        solarAdoption: '6%',
        hasSolarProgram: false
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.0, 42.2],
          [-72.6, 42.2],
          [-72.6, 41.9],
          [-73.0, 41.9],
          [-73.0, 42.2]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'connecticut_light',
        name: 'Connecticut Light & Power Co',
        serviceArea: 'Northern Connecticut',
        color: '#757575',
        borderColor: '#424242',
        opacity: 0.4,
        rateType: 'Standard',
        solarRate: '0.19',
        totalCustomers: 280000,
        avgBill: 170,
        solarAdoption: '10%',
        hasSolarProgram: true,
        programDetails: 'CT Solar Home Program'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.6, 41.9],
          [-72.2, 41.9],
          [-72.2, 41.6],
          [-72.6, 41.6],
          [-72.6, 41.9]
        ]]
      }
    }
  ]
};

export const mockSolarPrograms = [
  {
    id: 'solar_rewards',
    utilityId: 'eversource_springfield',
    name: 'Solar Rewards Program',
    incentiveRate: 0.05,
    maxCapacity: 10,
    requirements: ['Residential property', 'South-facing roof', 'No shade'],
    enrollmentStatus: 'Open'
  },
  {
    id: 'connected_solutions',
    utilityId: 'national_grid_east',
    name: 'ConnectedSolutions',
    incentiveRate: 0.06,
    maxCapacity: 12,
    requirements: ['Smart inverter', 'Internet connection'],
    enrollmentStatus: 'Limited'
  }
];

export const mockUtilityRates = [
  {
    id: 'r1',
    utilityId: 'eversource_springfield',
    name: 'Residential Basic',
    baseRate: 0.22,
    peakRate: 0.28,
    offPeakRate: 0.18,
    demandCharge: 0,
    minimumBill: 15
  },
  {
    id: 'r2',
    utilityId: 'national_grid_east',
    name: 'Residential TOU',
    baseRate: 0.24,
    peakRate: 0.32,
    offPeakRate: 0.16,
    demandCharge: 5,
    minimumBill: 20
  }
]; 