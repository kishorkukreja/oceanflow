import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { lanes, marketIndices, shipments } from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed Market Indices
  console.log('📊 Creating market indices...');
  await db.insert(marketIndices).values([
    {
      code: 'SCFI',
      name: 'Shanghai Containerized Freight Index',
      value: 1245.5,
      change: -28.3,
      changePercent: -2.2
    },
    {
      code: 'WCI',
      name: 'World Container Index',
      value: 2890.3,
      change: 45.7,
      changePercent: 1.6
    },
    {
      code: 'BDI',
      name: 'Baltic Dry Index',
      value: 1567.8,
      change: -15.2,
      changePercent: -0.96
    }
  ]);

  // Seed Lanes
  console.log('🛤️ Creating shipping lanes...');
  await db.insert(lanes).values([
    {
      origin: 'Shanghai',
      destination: 'Los Angeles',
      name: 'Asia-West Coast US',
      baseIndex: 'SCFI',
      indexValue: 1245.5,
      laneRatio: 1.15,
      historicalVolatility: 0.12,
      segments: JSON.stringify([
        { type: 'ocean', duration: 14, uncertainty: 'normal' },
        { type: 'port', duration: 2, uncertainty: 'triangular' }
      ]),
      factors: JSON.stringify({
        seasonality: 0.08,
        fuelSurcharge: 0.15,
        carrierPremium: 0.05,
        capacityUtilization: 0.85
      })
    },
    {
      origin: 'Rotterdam',
      destination: 'New York',
      name: 'Europe-East Coast US',
      baseIndex: 'WCI',
      indexValue: 2890.3,
      laneRatio: 0.95,
      historicalVolatility: 0.10,
      segments: JSON.stringify([
        { type: 'ocean', duration: 10, uncertainty: 'normal' },
        { type: 'port', duration: 1, uncertainty: 'triangular' }
      ]),
      factors: JSON.stringify({
        seasonality: 0.05,
        fuelSurcharge: 0.12,
        carrierPremium: 0.03,
        capacityUtilization: 0.78
      })
    },
    {
      origin: 'Singapore',
      destination: 'Sydney',
      name: 'Southeast Asia-Australia',
      baseIndex: 'SCFI',
      indexValue: 1245.5,
      laneRatio: 0.75,
      historicalVolatility: 0.08,
      segments: JSON.stringify([
        { type: 'ocean', duration: 7, uncertainty: 'normal' },
        { type: 'port', duration: 1, uncertainty: 'triangular' }
      ]),
      factors: JSON.stringify({
        seasonality: 0.04,
        fuelSurcharge: 0.10,
        carrierPremium: 0.02,
        capacityUtilization: 0.72
      })
    }
  ]);

  // Seed Sample Shipment
  console.log('📦 Creating sample shipment...');
  await db.insert(shipments).values([
    {
      referenceNumber: 'SHP-2024-001',
      origin: 'Shanghai',
      destination: 'Los Angeles',
      commodity: 'Electronics - Consumer Goods',
      weight: 15000,
      volume: 35,
      urgency: 'medium',
      specialRequirements: ['temperature_controlled', 'fragile'],
      status: 'pending_quotes',
      requiredDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
    }
  ]);

  console.log('✅ Database seeded successfully!');
}

seed()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('👋 Seed script completed');
    process.exit(0);
  });
