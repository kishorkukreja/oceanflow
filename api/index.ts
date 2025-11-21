import express from "express";

// Import storage directly - Vercel builds everything into one bundle
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple in-memory storage for demo
const storage = {
  lanes: [] as any[],
  indices: [] as any[],
  shipments: [] as any[],
  processes: [] as any[]
};

// Initialize data once
let initialized = false;
function initData() {
  if (initialized) return;

  console.log('[Vercel] Initializing in-memory data...');

  // Market Indices
  storage.indices = [
    { id: '1', code: 'SCFI', name: 'Shanghai Containerized Freight Index', value: 1245.5, change: -28.3, changePercent: -2.2 },
    { id: '2', code: 'WCI', name: 'World Container Index', value: 2890.3, change: 45.7, changePercent: 1.6 },
    { id: '3', code: 'BDI', name: 'Baltic Dry Index', value: 1567.8, change: -15.2, changePercent: -0.96 }
  ];

  // Lanes
  storage.lanes = [
    {
      id: '1',
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
      },
      createdAt: new Date()
    },
    {
      id: '2',
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
      },
      createdAt: new Date()
    },
    {
      id: '3',
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
      },
      createdAt: new Date()
    }
  ];

  // Shipments
  storage.shipments = [
    {
      id: '1',
      referenceNumber: 'SHP-2024-001',
      origin: 'Shanghai',
      destination: 'Los Angeles',
      commodity: 'Electronics - Consumer Goods',
      weight: 15000,
      volume: 35,
      urgency: 'medium',
      specialRequirements: ['temperature_controlled', 'fragile'],
      status: 'pending_quotes',
      requiredDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    }
  ];

  storage.processes = [];

  initialized = true;
  console.log('[Vercel] Data initialized - Lanes:', storage.lanes.length, 'Indices:', storage.indices.length);
}

// Initialize on module load
initData();

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    initialized: true,
    storageType: "in-memory",
    dataCount: {
      lanes: storage.lanes.length,
      indices: storage.indices.length,
      shipments: storage.shipments.length
    },
    timestamp: new Date().toISOString()
  });
});

// Lanes
app.get("/api/lanes", (req, res) => {
  console.log('[Vercel] GET /api/lanes - Returning', storage.lanes.length, 'lanes');
  res.json(storage.lanes);
});

// Market Indices
app.get("/api/indices", (req, res) => {
  console.log('[Vercel] GET /api/indices - Returning', storage.indices.length, 'indices');
  res.json(storage.indices);
});

// Shipments
app.get("/api/shipments", (req, res) => {
  console.log('[Vercel] GET /api/shipments - Returning', storage.shipments.length, 'shipments');
  res.json(storage.shipments);
});

// Automation Processes
app.get("/api/automation-processes", (req, res) => {
  console.log('[Vercel] GET /api/automation-processes - Returning', storage.processes.length, 'processes');
  res.json(storage.processes);
});

// Export for Vercel
export default app;
