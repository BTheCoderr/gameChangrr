import { z } from 'zod';
import { ValidationError } from './validationUtils';

// Constants for solar calculations and validation
export const SOLAR_CONSTANTS = {
  PANEL_WATTAGE: 400, // Watts per panel
  MIN_SYSTEM_SIZE: 1, // kW
  MAX_SYSTEM_SIZE: 1000, // kW
  AVG_PANEL_AREA: 17.8, // square feet
  PEAK_SUN_HOURS: {
    CA: 5.5,
    NY: 4.2,
    TX: 5.0,
    FL: 5.2
  },
  INSTALLATION_COST_PER_WATT: {
    RESIDENTIAL: { min: 2.40, max: 3.20 },
    COMMERCIAL: { min: 1.80, max: 2.50 }
  },
  EFFICIENCY_LOSS_FACTORS: {
    SHADING: 0.05,
    SOILING: 0.02,
    SNOW: 0.01,
    TEMPERATURE: 0.10,
    WIRING: 0.02,
    DEGRADATION_PER_YEAR: 0.005
  }
};

// Validation schemas
const calculatorInputSchema = z.object({
  systemSize: z.number()
    .positive()
    .min(SOLAR_CONSTANTS.MIN_SYSTEM_SIZE)
    .max(SOLAR_CONSTANTS.MAX_SYSTEM_SIZE),
  roofArea: z.number().positive(),
  monthlyBill: z.number().positive(),
  utilityRate: z.number().positive(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL']),
  state: z.string().length(2),
  shading: z.number().min(0).max(1),
  roofPitch: z.number().min(0).max(45),
  orientation: z.enum([
    'South',
    'Southwest',
    'Southeast',
    'East',
    'West',
    'North',
    'Northwest',
    'Northeast'
  ]),
  incentives: z.array(z.object({
    type: z.string(),
    amount: z.number().positive(),
    percentage: z.number().min(0).max(100).optional()
  })).optional()
});

// Validation function for calculator inputs
export const validateCalculatorInputs = (inputs) => {
  try {
    return calculatorInputSchema.parse(inputs);
  } catch (error) {
    throw new ValidationError('Invalid calculator inputs', error.errors);
  }
};

// Calculate system production with detailed factors
export const calculateSystemProduction = (inputs) => {
  const {
    systemSize,
    state,
    shading,
    roofPitch,
    orientation
  } = validateCalculatorInputs(inputs);

  // Calculate base production
  const peakSunHours = SOLAR_CONSTANTS.PEAK_SUN_HOURS[state] || 4.5;
  const baseProduction = systemSize * 1000 * peakSunHours * 365;

  // Calculate efficiency factors
  const orientationEfficiency = calculateOrientationEfficiency(orientation, roofPitch);
  const shadingLoss = shading * SOLAR_CONSTANTS.EFFICIENCY_LOSS_FACTORS.SHADING;
  const systemLosses = Object.values(SOLAR_CONSTANTS.EFFICIENCY_LOSS_FACTORS)
    .reduce((total, loss) => total + loss, 0);

  // Apply efficiency factors
  const actualProduction = baseProduction * 
    orientationEfficiency * 
    (1 - shadingLoss) * 
    (1 - systemLosses);

  return {
    annualProduction: Math.round(actualProduction),
    monthlyAverage: Math.round(actualProduction / 12),
    efficiencyFactors: {
      orientation: orientationEfficiency,
      shading: 1 - shadingLoss,
      systemLosses: 1 - systemLosses
    }
  };
};

// Calculate financial metrics with validation
export const calculateFinancials = (inputs, production) => {
  const {
    systemSize,
    monthlyBill,
    utilityRate,
    propertyType,
    incentives = []
  } = validateCalculatorInputs(inputs);

  // Calculate installation cost
  const costRange = SOLAR_CONSTANTS.INSTALLATION_COST_PER_WATT[propertyType];
  const baseInstallationCost = systemSize * 1000 * costRange.max;

  // Calculate incentives
  const totalIncentives = incentives.reduce((total, incentive) => {
    if (incentive.percentage) {
      return total + (baseInstallationCost * (incentive.percentage / 100));
    }
    return total + incentive.amount;
  }, 0);

  // Calculate net cost and savings
  const netInstallationCost = baseInstallationCost - totalIncentives;
  const annualSavings = (production.annualProduction * utilityRate) / 100;
  const monthlyPayment = calculateMonthlyPayment(netInstallationCost);
  const paybackPeriod = netInstallationCost / annualSavings;

  // Validate results and generate alerts
  const alerts = validateFinancialResults({
    systemSize,
    monthlyBill,
    annualSavings,
    paybackPeriod,
    monthlyPayment
  });

  return {
    installationCost: {
      gross: Math.round(baseInstallationCost),
      incentives: Math.round(totalIncentives),
      net: Math.round(netInstallationCost)
    },
    savings: {
      monthly: Math.round(annualSavings / 12),
      annual: Math.round(annualSavings),
      twentyFiveYear: Math.round(annualSavings * 25 * 0.95) // Including degradation
    },
    roi: {
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      monthlyPayment: Math.round(monthlyPayment),
      irr: calculateIRR(netInstallationCost, annualSavings)
    },
    alerts
  };
};

// Helper function to calculate orientation efficiency
const calculateOrientationEfficiency = (orientation, pitch) => {
  const orientationFactors = {
    South: 1.00,
    Southwest: 0.95,
    Southeast: 0.95,
    East: 0.85,
    West: 0.85,
    North: 0.75,
    Northwest: 0.75,
    Northeast: 0.75
  };

  const pitchEfficiency = Math.cos((pitch - 33) * Math.PI / 180);
  return orientationFactors[orientation] * pitchEfficiency;
};

// Helper function to calculate monthly payment
const calculateMonthlyPayment = (loanAmount, years = 20, rate = 0.05) => {
  const monthlyRate = rate / 12;
  const numPayments = years * 12;
  return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

// Helper function to calculate IRR
const calculateIRR = (initialInvestment, annualCashFlow, years = 25) => {
  const cashFlows = [-initialInvestment];
  for (let i = 0; i < years; i++) {
    cashFlows.push(annualCashFlow * Math.pow(0.995, i)); // Including degradation
  }

  let irr = 0.1; // Initial guess
  const tolerance = 0.0001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const npv = cashFlows.reduce((sum, cf, t) => 
      sum + cf / Math.pow(1 + irr, t), 0
    );

    if (Math.abs(npv) < tolerance) break;

    const derivativeNpv = cashFlows.reduce((sum, cf, t) => 
      sum - t * cf / Math.pow(1 + irr, t + 1), 0
    );

    irr = irr - npv / derivativeNpv;
  }

  return Math.round(irr * 1000) / 1000;
};

// Validate financial results and generate alerts
const validateFinancialResults = (results) => {
  const alerts = [];

  // Check for oversized system
  if (results.annualSavings > results.monthlyBill * 12 * 1.2) {
    alerts.push({
      type: 'warning',
      message: 'System may be oversized for current energy usage',
      details: 'Consider reducing system size to better match consumption'
    });
  }

  // Check for unrealistic payback period
  if (results.paybackPeriod > 25) {
    alerts.push({
      type: 'error',
      message: 'Payback period exceeds system lifespan',
      details: 'Current configuration may not be financially viable'
    });
  }

  // Check for high monthly payments
  if (results.monthlyPayment > results.monthlyBill * 1.5) {
    alerts.push({
      type: 'warning',
      message: 'Monthly payments significantly exceed current utility bill',
      details: 'Consider alternative financing options or reducing system size'
    });
  }

  // Check for undersized system
  if (results.annualSavings < results.monthlyBill * 12 * 0.3) {
    alerts.push({
      type: 'info',
      message: 'System provides relatively low offset',
      details: 'Consider increasing system size if roof space allows'
    });
  }

  return alerts;
};

// Validate system size against roof area
export const validateSystemSize = (systemSize, roofArea) => {
  const requiredArea = (systemSize * 1000 / SOLAR_CONSTANTS.PANEL_WATTAGE) * 
    SOLAR_CONSTANTS.AVG_PANEL_AREA;

  if (requiredArea > roofArea) {
    throw new ValidationError('Invalid system size', {
      message: 'System size exceeds available roof area',
      details: {
        requiredArea: Math.round(requiredArea),
        availableArea: roofArea
      }
    });
  }

  return {
    requiredArea: Math.round(requiredArea),
    remainingArea: Math.round(roofArea - requiredArea),
    panelCount: Math.ceil(systemSize * 1000 / SOLAR_CONSTANTS.PANEL_WATTAGE)
  };
}; 