export const mockMoveIns = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5898, 42.1015]
      },
      properties: {
        id: 'move-in-1',
        address: '1007 Roosevelt Ave',
        zipCode: '01109',
        propertyType: 'Single Family',
        corporateOwned: false,
        ownerInfo: {
          name: 'Malcolm E Freeman',
          previousAddress: '123 Old St, Boston, MA'
        },
        equity: 75000,
        income: '$80k-95k',
        squareFeet: 1800,
        purchaseDate: 'June 2023',
        yearBuilt: 1950,
        owners: [{
          name: 'Malcolm E Freeman',
          age: 45,
          email: 'mfreeman@email.com'
        }]
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.5700, 42.1100]
      },
      properties: {
        id: 'move-in-2',
        address: '456 Maple St',
        zipCode: '01105',
        propertyType: 'Multi Family',
        corporateOwned: true,
        ownerInfo: {
          companyName: 'Springfield Properties LLC',
          address: '789 Business Ave, Springfield, MA'
        },
        equity: 120000,
        income: '$150k-180k',
        squareFeet: 3200,
        purchaseDate: 'September 2023',
        yearBuilt: 1935,
        owners: [{
          name: 'Springfield Properties LLC',
          email: 'contact@springfieldproperties.com'
        }]
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-72.6200, 42.0950]
      },
      properties: {
        id: 'move-in-3',
        address: '789 Oak Dr',
        zipCode: '01108',
        propertyType: 'Single Family',
        corporateOwned: false,
        ownerInfo: {
          name: 'Sarah Johnson',
          previousAddress: '456 Former Ln, Hartford, CT'
        },
        equity: 95000,
        income: '$90k-110k',
        squareFeet: 2100,
        purchaseDate: 'October 2023',
        yearBuilt: 1965,
        owners: [{
          name: 'Sarah Johnson',
          age: 38,
          email: 'sjohnson@email.com'
        }]
      }
    }
  ]
}; 