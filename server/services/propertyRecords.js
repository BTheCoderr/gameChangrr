// Constants for Massachusetts bounds
const MASSACHUSETTS_BOUNDS = {
  west: -73.5082, // Western MA border
  south: 41.2377, // Southern MA border
  east: -69.9283, // Eastern MA border (Cape Cod)
  north: 42.8868  // Northern MA border
};

// Helper function to generate random coordinates within bounds
const generateRandomCoordinates = (bounds) => {
  const lng = bounds.west + (Math.random() * (bounds.east - bounds.west));
  const lat = bounds.south + (Math.random() * (bounds.north - bounds.south));
  return [lng, lat];
};

// Mock data generator for testing
const generateMockRecord = () => {
  const owner = Math.random() > 0.3 ? 'John Smith' : 'Property LLC';
  const [longitude, latitude] = generateRandomCoordinates(MASSACHUSETTS_BOUNDS);
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    latitude,
    longitude,
    address: `${Math.floor(Math.random() * 1000)} Main St`,
    zipCode: ['01234', '02108', '02110', '01103', '02115'][Math.floor(Math.random() * 5)], // MA zip codes
    propertyType: ['Single Family', 'Multi Family', 'Condo'][Math.floor(Math.random() * 3)],
    owner,
    ownerAddress: '123 Owner St',
    lastSale: {
      price: Math.floor(Math.random() * 500000) + 300000,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    },
    livingArea: Math.floor(Math.random() * 2000) + 1000,
    yearBuilt: Math.floor(Math.random() * 50) + 1960,
    previousAddress: '456 Previous St'
  };
};

export const fetchPropertyRecords = async ({ bounds, startDate, endDate }) => {
  // Generate some mock data within the bounds
  const records = [];
  const numRecords = 20;

  // Use provided bounds or default to Massachusetts bounds
  const searchBounds = bounds || MASSACHUSETTS_BOUNDS;

  for (let i = 0; i < numRecords; i++) {
    records.push(generateMockRecord());
  }

  // Filter by date if provided
  return records.filter(record => {
    const saleDate = new Date(record.lastSale.date);
    return (!startDate || saleDate >= startDate) && (!endDate || saleDate <= endDate);
  });
}; 