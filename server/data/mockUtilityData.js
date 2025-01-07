export const mockUtilityBoundaries = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        utilityName: 'Eversource',
        serviceArea: 'Springfield Metro',
        rateType: 'Residential',
        solarRate: 0.12,
        provider: 'Eversource Energy',
        hasSolarProgram: true,
        totalCustomers: 150000,
        avgBill: 175,
        solarAdoption: 0.15,
        color: '#4CAF50',
        borderColor: '#388E3C'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.7242, 42.1718], // NW
          [-72.4771, 42.1718], // NE
          [-72.4771, 42.0824], // SE
          [-72.7242, 42.0824], // SW
          [-72.7242, 42.1718]  // NW (close polygon)
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        utilityName: 'National Grid',
        serviceArea: 'Holyoke Area',
        rateType: 'Residential',
        solarRate: 0.11,
        provider: 'National Grid USA',
        hasSolarProgram: true,
        totalCustomers: 85000,
        avgBill: 165,
        solarAdoption: 0.12,
        color: '#2196F3',
        borderColor: '#1976D2'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-72.7242, 42.2718],
          [-72.4771, 42.2718],
          [-72.4771, 42.1718],
          [-72.7242, 42.1718],
          [-72.7242, 42.2718]
        ]]
      }
    }
  ]
}; 