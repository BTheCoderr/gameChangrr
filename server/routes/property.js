import express from 'express';
import { fetchPropertyRecords } from '../services/propertyRecords.js';

const router = express.Router();

router.get('/records', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const records = await fetchPropertyRecords(address);
    res.json({ records });
  } catch (error) {
    console.error('Error fetching property records:', error);
    res.status(500).json({ error: 'Failed to fetch property records' });
  }
});

router.get('/move-ins', async (req, res) => {
  try {
    const { bounds, startDate, endDate } = req.query;
    let boundsParsed;
    
    if (bounds) {
      const [west, south, east, north] = bounds.split(',').map(Number);
      if (isNaN(west) || isNaN(south) || isNaN(east) || isNaN(north)) {
        return res.status(400).json({ error: 'Invalid bounds format' });
      }
      boundsParsed = { south, west, north, east };
    }
    
    // Get property records from the service
    const records = await fetchPropertyRecords({
      bounds: boundsParsed,
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default to last 90 days
      endDate: endDate ? new Date(endDate) : new Date()
    });

    // Transform records into move-ins format
    const moveIns = records.map(record => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [record.longitude, record.latitude]
      },
      properties: {
        id: record.id,
        address: record.address,
        zipCode: record.zipCode,
        propertyType: record.propertyType,
        corporateOwned: record.owner.toLowerCase().includes('llc') || record.owner.toLowerCase().includes('inc'),
        ownerInfo: {
          companyName: record.owner,
          address: record.ownerAddress || ''
        },
        equity: Math.round(record.lastSale.price * 0.25), // Estimated equity
        income: `$${Math.floor(record.lastSale.price * 0.0025)}k-${Math.ceil(record.lastSale.price * 0.003)}k income`,
        squareFeet: record.livingArea,
        purchaseDate: new Date(record.lastSale.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        yearBuilt: record.yearBuilt,
        previousAddress: record.previousAddress || 'Unknown',
        owners: [{
          name: record.owner.split(' AND ')[0] || record.owner,
          age: Math.floor(Math.random() * 30 + 30), // Placeholder
          email: `${record.owner.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com` // Placeholder
        }]
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features: moveIns
    });
  } catch (error) {
    console.error('Error fetching move-ins:', error);
    res.status(500).json({ error: 'Failed to fetch move-ins data', details: error.message });
  }
});

export { router as propertyRouter }; 