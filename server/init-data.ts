import { storage } from './storage';

export async function initializeData() {
  // Check if already initialized
  const existingLanes = await storage.getLanes();
  if (existingLanes.length > 0) {
    console.log('✅ Data already initialized');
    return;
  }

  console.log('🌱 Initializing default data...');

  // Add Market Indices
  await storage.createOrUpdateMarketIndex({
    code: 'SCFI',
    name: 'Shanghai Containerized Freight Index',
    value: 1245.5,
    category: 'container',
    updatedAt: new Date()
  });

  await storage.createOrUpdateMarketIndex({
    code: 'WCI',
    name: 'World Container Index',
    value: 2890.3,
    category: 'container',
    updatedAt: new Date()
  });

  await storage.createOrUpdateMarketIndex({
    code: 'BDI',
    name: 'Baltic Dry Index',
    value: 1567.8,
    category: 'bulk',
    updatedAt: new Date()
  });

  // Add Shipping Lanes
  await storage.createLane({
    origin: 'Shanghai',
    destination: 'Los Angeles',
    name: 'Asia-West Coast US',
    baseIndex: 'SCFI',
    indexValue: 1245.5,
    laneRatio: 1.15,
    historicalVolatility: 0.12,
    segments: [
      { type: 'ocean', duration: 14, uncertainty: 'normal' },
      { type: 'port', duration: 2, uncertainty: 'triangular' }
    ],
    factors: {
      seasonality: 0.08,
      fuelSurcharge: 0.15,
      carrierPremium: 0.05,
      capacityUtilization: 0.85
    }
  });

  await storage.createLane({
    origin: 'Rotterdam',
    destination: 'New York',
    name: 'Europe-East Coast US',
    baseIndex: 'WCI',
    indexValue: 2890.3,
    laneRatio: 0.95,
    historicalVolatility: 0.10,
    segments: [
      { type: 'ocean', duration: 10, uncertainty: 'normal' },
      { type: 'port', duration: 1, uncertainty: 'triangular' }
    ],
    factors: {
      seasonality: 0.05,
      fuelSurcharge: 0.12,
      carrierPremium: 0.03,
      capacityUtilization: 0.78
    }
  });

  await storage.createLane({
    origin: 'Singapore',
    destination: 'Sydney',
    name: 'Southeast Asia-Australia',
    baseIndex: 'SCFI',
    indexValue: 1245.5,
    laneRatio: 0.75,
    historicalVolatility: 0.08,
    segments: [
      { type: 'ocean', duration: 7, uncertainty: 'normal' },
      { type: 'port', duration: 1, uncertainty: 'triangular' }
    ],
    factors: {
      seasonality: 0.04,
      fuelSurcharge: 0.10,
      carrierPremium: 0.02,
      capacityUtilization: 0.72
    }
  });

  // Add Sample Shipment
  await storage.createShipment({
    referenceNumber: 'SHP-2024-001',
    origin: 'Shanghai',
    destination: 'Los Angeles',
    cargoDetails: {
      description: 'Electronics - Consumer Goods',
      weight: 15000,
      volume: 35,
      containers: 2
    },
    urgency: 'medium',
    specialRequirements: ['temperature_controlled', 'fragile'],
    status: 'pending',
    estimatedDeparture: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedArrival: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
  });

  console.log('✅ Default data initialized successfully!');
}
