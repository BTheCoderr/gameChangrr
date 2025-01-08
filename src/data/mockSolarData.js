// Mock data for solar permits
export const PERMIT_STATUSES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

export const MOCK_INSTALLERS = {
  LUMIO: { name: 'Lumio Solar', status: 'active' },
  TESLA: { name: 'Tesla', status: 'active' },
  SUNRUN: { name: 'Sunrun', status: 'bankrupt' },
  VIVINT: { name: 'Vivint Solar', status: 'bankrupt' },
  TRINITY: { name: 'Trinity Solar', status: 'active' }
};

// Energy performance categories
export const ENERGY_PERFORMANCE = {
  EXCELLENT: { min: 75, label: 'Excellent', priority: 'low' },
  GOOD: { min: 50, label: 'Good', priority: 'medium' },
  POOR: { min: 0, label: 'Poor', priority: 'high' }
};

// Generate mock solar permit data
const generateMockPermits = () => {
  const features = [];
  const springfieldCenter = [-72.589811, 42.102535];
  
  // Helper to generate random coordinates within Springfield
  const randomCoord = () => [
    springfieldCenter[0] + (Math.random() - 0.5) * 0.1,
    springfieldCenter[1] + (Math.random() - 0.5) * 0.1
  ];

  // Helper to generate energy performance data
  const generateEnergyData = () => {
    const energyScore = Math.floor(Math.random() * 100);
    const annualElectricity = 8000 + Math.floor(Math.random() * 8000); // 8000-16000 kWh
    const monthlyBill = (annualElectricity / 12) * 0.24; // Assuming $0.24/kWh
    
    // Calculate optimal system size based on annual usage
    const systemSizeKW = (annualElectricity / 1200); // Assuming 1200kWh per kW of solar annually
    const installationCost = systemSizeKW * 3000; // Assuming $3000 per kW installed
    const federalTaxCredit = installationCost * 0.30; // 30% federal tax credit
    const stateTaxCredit = Math.min(1000, installationCost * 0.15); // 15% up to $1000
    const netCost = installationCost - federalTaxCredit - stateTaxCredit;
    
    // Calculate ROI metrics
    const annualSavings = monthlyBill * 12 * 0.85; // 85% offset
    const paybackPeriod = netCost / annualSavings;
    const roi = (annualSavings * 25 - netCost) / netCost * 100; // 25-year ROI
    
    return {
      energyScore,
      annualEnergyUse: {
        electricity: annualElectricity,
        naturalGas: Math.floor(Math.random() * 800 + 400), // 400-1200 therms
      },
      energyIntensity: 30 + Math.random() * 40, // 30-70 kBtu/sqft
      monthlyBill,
      solarAnalysis: {
        recommendedSystemSize: Number(systemSizeKW.toFixed(2)),
        estimatedAnnualProduction: Number((systemSizeKW * 1200).toFixed(0)), // kWh
        installationCost: Number(installationCost.toFixed(0)),
        federalTaxCredit: Number(federalTaxCredit.toFixed(0)),
        stateTaxCredit: Number(stateTaxCredit.toFixed(0)),
        netCost: Number(netCost.toFixed(0)),
        monthlyPayment: Number((netCost / 240).toFixed(2)), // 20-year financing
        paybackPeriod: Number(paybackPeriod.toFixed(1)),
        roi: Number(roi.toFixed(1)),
        carbonOffset: Number((systemSizeKW * 1200 * 0.0007).toFixed(1)) // Metric tons CO2 per year
      },
      potentialSavings: {
        monthly: monthlyBill * 0.85,
        annual: monthlyBill * 12 * 0.85,
        twentyYear: monthlyBill * 12 * 0.85 * 20
      },
      leadPriority: energyScore < 50 ? 'high' : energyScore < 75 ? 'medium' : 'low'
    };
  };

  // Generate 50 permits with various statuses
  for (let i = 0; i < 50; i++) {
    const installer = Object.values(MOCK_INSTALLERS)[Math.floor(Math.random() * Object.values(MOCK_INSTALLERS).length)];
    const status = Object.values(PERMIT_STATUSES)[Math.floor(Math.random() * Object.values(PERMIT_STATUSES).length)];
    const coords = randomCoord();
    const energyData = generateEnergyData();
    
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords
      },
      properties: {
        id: `permit-${i + 1}`,
        address: `${Math.floor(Math.random() * 1000)} Main St, Springfield, MA`,
        permitId: `SP${2023}${String(i).padStart(4, '0')}`,
        status: status,
        systemSize: Math.floor(Math.random() * 10) + 5, // 5-15 kW
        installer: installer.name,
        applicationDate: new Date(2023 - Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        hasBattery: Math.random() > 0.7,
        propertyType: Math.random() > 0.2 ? 'SingleFamily' : 'MultiFamily',
        yearBuilt: 1960 + Math.floor(Math.random() * 63), // 1960-2023
        squareFootage: 1500 + Math.floor(Math.random() * 2500), // 1500-4000 sqft
        energyPerformance: energyData,
        tags: [
          status === PERMIT_STATUSES.EXPIRED ? 'expired_permit' : null,
          installer.status === 'bankrupt' ? 'bankrupt_installer' : null,
          energyData.energyScore < 50 ? 'high_energy_usage' : null,
          energyData.monthlyBill > 200 ? 'high_bill' : null
        ].filter(Boolean)
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

export const mockSolarPermits = generateMockPermits();

// Export helper functions for filtering and styling
export const isBankruptInstaller = (installer) => {
  return Object.values(MOCK_INSTALLERS).find(i => i.name === installer)?.status === 'bankrupt';
};

export const isExpiredPermit = (status) => {
  return status === PERMIT_STATUSES.EXPIRED;
};

export const getLeadPriority = (energyScore) => {
  if (energyScore < 50) return 'high';
  if (energyScore < 75) return 'medium';
  return 'low';
};

export const getPermitStyle = (feature) => {
  const { status, installer, energyPerformance } = feature.properties;
  
  // Base style
  const style = {
    radius: 8,
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.6
  };

  // Priority based on energy score
  if (energyPerformance?.energyScore < 50) {
    return {
      ...style,
      radius: 10, // Larger radius for high-priority leads
      color: '#F44336', // Red for high energy usage
      fillColor: '#FFCDD2'
    };
  }
  // Style based on status and installer
  else if (isExpiredPermit(status)) {
    return {
      ...style,
      color: '#9C27B0', // Purple for expired
      fillColor: '#E1BEE7'
    };
  } else if (isBankruptInstaller(installer)) {
    return {
      ...style,
      color: '#FF9800', // Orange for bankrupt installer
      fillColor: '#FFE0B2'
    };
  } else {
    return {
      ...style,
      color: '#4CAF50', // Green for active
      fillColor: '#C8E6C9'
    };
  }
}; 