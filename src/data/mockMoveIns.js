// Constants for move-in categories
export const MOVE_IN_CATEGORIES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  CORPORATE: 'corporate'
};

// Constants for property types
export const PROPERTY_TYPES = {
  SINGLE_FAMILY: 'single_family',
  MULTI_FAMILY: 'multi_family',
  CONDO: 'condo',
  COMMERCIAL: 'commercial'
};

// Filter categories
export const MOVE_IN_FILTERS = {
  DATE_RANGE: 'dateRange',
  PRICE_RANGE: 'priceRange',
  PROPERTY_TYPE: 'propertyType',
  OWNERSHIP_TYPE: 'ownershipType'
};

// Generate mock move-in data
const generateMockMoveIns = () => {
  const features = [];
  const springfieldCenter = [-72.589811, 42.102535];
  
  // Helper to generate random coordinates within Springfield
  const randomCoord = () => [
    springfieldCenter[0] + (Math.random() - 0.5) * 0.1,
    springfieldCenter[1] + (Math.random() - 0.5) * 0.1
  ];

  // Generate 30 move-ins with various properties
  for (let i = 0; i < 30; i++) {
    const propertyType = Object.values(PROPERTY_TYPES)[Math.floor(Math.random() * Object.values(PROPERTY_TYPES).length)];
    const category = propertyType === PROPERTY_TYPES.COMMERCIAL ? 
      MOVE_IN_CATEGORIES.COMMERCIAL : 
      MOVE_IN_CATEGORIES.RESIDENTIAL;
    
    const coords = randomCoord();
    const moveInDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Within last year
    
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords
      },
      properties: {
        id: `movein-${i + 1}`,
        address: `${Math.floor(Math.random() * 1000)} ${['Main', 'Oak', 'Maple', 'State', 'Roosevelt'][Math.floor(Math.random() * 5)]} St`,
        purchaseDate: moveInDate.toISOString(),
        propertyType: propertyType,
        category: category,
        price: Math.floor(Math.random() * 400000) + 200000, // $200k-$600k
        sqft: Math.floor(Math.random() * 2000) + 1000, // 1000-3000 sqft
        bedrooms: Math.floor(Math.random() * 3) + 2, // 2-4 bedrooms
        bathrooms: Math.floor(Math.random() * 2) + 1.5, // 1.5-3.5 bathrooms
        yearBuilt: Math.floor(Math.random() * 70) + 1950, // 1950-2020
        corporateOwned: Math.random() > 0.8, // 20% chance of corporate ownership
        tags: [
          category.toLowerCase(),
          propertyType.toLowerCase(),
          Math.random() > 0.8 ? 'investment_property' : null,
          Math.random() > 0.9 ? 'cash_purchase' : null
        ].filter(Boolean)
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

export const mockMoveIns = generateMockMoveIns();

// Helper functions for filtering and styling
export const isRecentMoveIn = (date, monthsThreshold = 12) => {
  const moveInDate = new Date(date);
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - monthsThreshold);
  return moveInDate >= threshold;
};

export const getMoveInStyle = (feature) => {
  const { category, corporateOwned } = feature.properties;
  
  // Base style
  const style = {
    radius: 8,
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.6
  };

  // Style based on category and ownership
  if (corporateOwned) {
    return {
      ...style,
      color: '#FF9800', // Orange for corporate owned
      fillColor: '#FFE0B2'
    };
  } else if (category === MOVE_IN_CATEGORIES.COMMERCIAL) {
    return {
      ...style,
      color: '#2196F3', // Blue for commercial
      fillColor: '#BBDEFB'
    };
  } else {
    return {
      ...style,
      color: '#4CAF50', // Green for residential
      fillColor: '#C8E6C9'
    };
  }
}; 