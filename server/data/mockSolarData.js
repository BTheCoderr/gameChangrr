// Mock data for solar installations including expired permits and bankrupt installers
export const mockSolarData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-72.5898, 42.1015]
      },
      properties: {
        id: "test1",
        description: "Residential Solar Installation",
        capacity: 5.5,
        date_installed: "2023-01-15",
        system_type: "Residential",
        status: "completed",
        address: "123 Main St, Springfield, MA",
        permit_number: "SOL-2023-001",
        permit_status: "Approved",
        permit_date: "2022-12-15",
        permit_expiration: "2024-12-15",
        installer: "Local Solar Co",
        installer_status: "active",
        cost: 22000,
        incentives: ["Mass Solar Loan", "Federal Tax Credit"]
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-72.5700, 42.1100]
      },
      properties: {
        id: "test2",
        description: "Commercial Solar Array",
        capacity: 7.2,
        date_installed: "2023-02-20",
        system_type: "Commercial",
        status: "completed",
        address: "456 Business Ave, Springfield, MA",
        permit_number: "SOL-2023-002",
        permit_status: "Expired",
        permit_date: "2023-01-10",
        permit_expiration: "2023-07-10",
        installer: "SunTech Solutions LLC",
        installer_status: "bankrupt",
        cost: 45000,
        incentives: ["SMART Program", "Federal Tax Credit"],
        tags: ["expired_permit", "bankrupt_installer"]
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-72.6100, 42.0950]
      },
      properties: {
        id: "test3",
        description: "Residential Installation with Issues",
        capacity: 6.8,
        date_installed: null,
        system_type: "Residential",
        status: "pending",
        address: "789 Solar St, Springfield, MA",
        permit_number: "SOL-2023-003",
        permit_status: "Expired",
        permit_date: "2023-03-15",
        permit_expiration: "2023-09-15",
        installer: "Bankrupt Solar Inc",
        installer_status: "bankrupt",
        cost: 35000,
        incentives: ["Mass Solar Loan"],
        tags: ["expired_permit", "bankrupt_installer", "incomplete_installation"]
      }
    }
  ],
  metadata: {
    bankruptInstallers: [
      {
        name: "SunTech Solutions LLC",
        bankruptcyDate: "2023-08-15",
        affectedInstallations: 12,
        warrantyStatus: "transferred to manufacturer"
      },
      {
        name: "Bankrupt Solar Inc",
        bankruptcyDate: "2023-10-01",
        affectedInstallations: 8,
        warrantyStatus: "void"
      }
    ],
    expiredPermits: {
      total: 2,
      averageExpirationTime: "6 months",
      commonReasons: [
        "Failed inspections",
        "Installer bankruptcy",
        "Project abandonment"
      ]
    }
  }
}; 