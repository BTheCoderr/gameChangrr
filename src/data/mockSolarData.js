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

// Generate mock solar permit data
const generateMockPermits = () => {
  const features = [];
  const springfieldCenter = [-72.589811, 42.102535];
  
  // Helper to generate random coordinates within Springfield
  const randomCoord = () => [
    springfieldCenter[0] + (Math.random() - 0.5) * 0.1,
    springfieldCenter[1] + (Math.random() - 0.5) * 0.1
  ];

  // Generate 50 permits with various statuses
  for (let i = 0; i < 50; i++) {
    const installer = Object.values(MOCK_INSTALLERS)[Math.floor(Math.random() * Object.values(MOCK_INSTALLERS).length)];
    const status = Object.values(PERMIT_STATUSES)[Math.floor(Math.random() * Object.values(PERMIT_STATUSES).length)];
    const coords = randomCoord();
    
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
        tags: [
          status === PERMIT_STATUSES.EXPIRED ? 'expired_permit' : null,
          installer.status === 'bankrupt' ? 'bankrupt_installer' : null
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

export const getPermitStyle = (feature) => {
  const { status, installer } = feature.properties;
  
  // Base style
  const style = {
    radius: 8,
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.6
  };

  // Style based on status and installer
  if (isExpiredPermit(status)) {
    return {
      ...style,
      color: '#9C27B0', // Purple for expired
      fillColor: '#E1BEE7'
    };
  } else if (isBankruptInstaller(installer)) {
    return {
      ...style,
      color: '#F44336', // Red for bankrupt installer
      fillColor: '#FFCDD2'
    };
  } else {
    return {
      ...style,
      color: '#4CAF50', // Green for active
      fillColor: '#C8E6C9'
    };
  }
}; 