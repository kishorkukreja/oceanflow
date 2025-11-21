import express from "express";

// Import storage directly - Vercel builds everything into one bundle
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple in-memory storage for demo
// Note: This persists only within a single serverless instance
// Data may be lost between requests if hitting different instances
const storage = {
  lanes: [] as any[],
  indices: [] as any[],
  shipments: [] as any[],
  processes: [] as any[],
  simulations: [] as any[],
  quotes: [] as any[],
  alternatives: [] as any[],
  vendorEvaluations: [] as any[],
  processDocuments: [] as any[],
  processActions: [] as any[]
};

// Initialize data once per instance
let initialized = false;
function initData() {
  if (initialized) {
    console.log('[Vercel] Already initialized, data counts:', {
      lanes: storage.lanes.length,
      processes: storage.processes.length,
      shipments: storage.shipments.length
    });
    return;
  }

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
    },
    {
      id: '2',
      referenceNumber: 'SHP-2024-002',
      origin: 'Rotterdam',
      destination: 'New York',
      commodity: 'Automotive Parts',
      weight: 22000,
      volume: 48,
      urgency: 'high',
      specialRequirements: ['hazmat_certified'],
      status: 'evaluating',
      requiredDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      referenceNumber: 'SHP-2024-003',
      origin: 'Singapore',
      destination: 'Sydney',
      commodity: 'Pharmaceuticals',
      weight: 8500,
      volume: 20,
      urgency: 'high',
      specialRequirements: ['temperature_controlled', 'time_sensitive'],
      status: 'decision_pending',
      requiredDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ];

  initialized = true;
  console.log('[Vercel] Data initialized successfully:', {
    lanes: storage.lanes.length,
    indices: storage.indices.length,
    shipments: storage.shipments.length
  });
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

app.post("/api/automation-processes", (req, res) => {
  try {
    initData(); // Ensure data is initialized
    console.log('[Vercel] POST /api/automation-processes - Creating process:', req.body);
    console.log('[Vercel] Current processes count:', storage.processes.length);

    const process = {
      id: String(Date.now()), // Use timestamp for unique ID
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    storage.processes.push(process);
    console.log('[Vercel] Process created with ID:', process.id, 'Total processes:', storage.processes.length);
    res.status(201).json(process);
  } catch (error) {
    console.error('[Vercel] Error creating process:', error);
    res.status(500).json({ error: 'Failed to create automation process' });
  }
});

app.get("/api/automation-processes/:id", (req, res) => {
  const process = storage.processes.find(p => p.id === req.params.id);
  if (!process) {
    return res.status(404).json({ error: 'Process not found' });
  }
  res.json(process);
});

app.patch("/api/automation-processes/:id", (req, res) => {
  try {
    initData(); // Ensure data is initialized
    console.log('[Vercel] PATCH /api/automation-processes/:id');
    console.log('[Vercel] Looking for process ID:', req.params.id);
    console.log('[Vercel] Available processes:', storage.processes.map(p => ({ id: p.id, stage: p.currentStage })));

    const index = storage.processes.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      console.log('[Vercel] Process not found. Creating new process with provided data.');
      // If not found, create it (workaround for serverless ephemeral nature)
      const process = {
        id: req.params.id,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      storage.processes.push(process);
      return res.json(process);
    }

    storage.processes[index] = {
      ...storage.processes[index],
      ...req.body,
      updatedAt: new Date()
    };
    console.log('[Vercel] Process updated:', storage.processes[index].id);
    res.json(storage.processes[index]);
  } catch (error) {
    console.error('[Vercel] Error updating process:', error);
    res.status(500).json({ error: 'Failed to update automation process' });
  }
});

// Shipments endpoints
app.get("/api/shipments/:id", (req, res) => {
  const shipment = storage.shipments.find(s => s.id === req.params.id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  res.json(shipment);
});

app.post("/api/shipments", (req, res) => {
  try {
    const shipment = {
      id: String(storage.shipments.length + 1),
      ...req.body,
      createdAt: new Date()
    };
    storage.shipments.push(shipment);
    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

app.patch("/api/shipments/:id", (req, res) => {
  try {
    const index = storage.shipments.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    storage.shipments[index] = {
      ...storage.shipments[index],
      ...req.body
    };
    res.json(storage.shipments[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// Vendor Evaluations
app.get("/api/vendor-evaluations", (req, res) => {
  const processId = req.query.processId;
  if (processId) {
    const evaluations = storage.processes
      .filter((p: any) => p.id === processId)
      .flatMap((p: any) => p.vendorEvaluations || []);
    return res.json(evaluations);
  }
  res.json([]);
});

app.post("/api/vendor-evaluations", (req, res) => {
  try {
    const evaluation = {
      id: String(Date.now()),
      ...req.body,
      createdAt: new Date()
    };
    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vendor evaluation' });
  }
});

// Process Documents
app.get("/api/process-documents", (req, res) => {
  res.json([]);
});

app.post("/api/process-documents", (req, res) => {
  try {
    const document = {
      id: String(Date.now()),
      ...req.body,
      createdAt: new Date()
    };
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Process Actions
app.get("/api/process-actions", (req, res) => {
  const processId = req.query.processId;
  if (processId) {
    const actions = ((storage as any).processActions || [])
      .filter((a: any) => a.processId === processId);
    return res.json(actions);
  }
  res.json((storage as any).processActions || []);
});

app.post("/api/process-actions", (req, res) => {
  try {
    const action = {
      id: String(Date.now()),
      ...req.body,
      createdAt: new Date()
    };
    if (!(storage as any).processActions) (storage as any).processActions = [];
    (storage as any).processActions.push(action);
    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create action' });
  }
});

app.patch("/api/process-actions/:id", (req, res) => {
  try {
    const actions = (storage as any).processActions || [];
    const index = actions.findIndex((a: any) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Action not found' });
    }
    actions[index] = {
      ...actions[index],
      ...req.body,
      updatedAt: new Date()
    };
    res.json(actions[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// Simulations
app.get("/api/simulations", (req, res) => {
  console.log('[Vercel] GET /api/simulations');
  res.json((storage as any).simulations || []);
});

app.post("/api/simulations", (req, res) => {
  try {
    console.log('[Vercel] POST /api/simulations:', req.body);
    const simulation = {
      id: String(Date.now()),
      ...req.body,
      status: 'pending',
      createdAt: new Date()
    };
    if (!(storage as any).simulations) (storage as any).simulations = [];
    (storage as any).simulations.push(simulation);
    res.status(201).json(simulation);
  } catch (error) {
    console.error('[Vercel] Error creating simulation:', error);
    res.status(500).json({ error: 'Failed to create simulation' });
  }
});

app.get("/api/simulations/:id", (req, res) => {
  const simulations = (storage as any).simulations || [];
  const simulation = simulations.find((s: any) => s.id === req.params.id);
  if (!simulation) {
    return res.status(404).json({ error: 'Simulation not found' });
  }
  res.json(simulation);
});

app.patch("/api/simulations/:id", (req, res) => {
  try {
    const simulations = (storage as any).simulations || [];
    const index = simulations.findIndex((s: any) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    simulations[index] = {
      ...simulations[index],
      ...req.body
    };
    res.json(simulations[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update simulation' });
  }
});

// Quotes
app.get("/api/quotes", (req, res) => {
  console.log('[Vercel] GET /api/quotes');
  const laneId = req.query.laneId;
  if (laneId) {
    const quotes = ((storage as any).quotes || [])
      .filter((q: any) => q.laneId === laneId);
    return res.json(quotes);
  }
  res.json((storage as any).quotes || []);
});

app.post("/api/quotes", (req, res) => {
  try {
    console.log('[Vercel] POST /api/quotes:', req.body);
    const quote = {
      id: String(Date.now()),
      ...req.body,
      createdAt: new Date()
    };
    if (!(storage as any).quotes) (storage as any).quotes = [];
    (storage as any).quotes.push(quote);
    res.status(201).json(quote);
  } catch (error) {
    console.error('[Vercel] Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

app.get("/api/quotes/:id", (req, res) => {
  const quotes = (storage as any).quotes || [];
  const quote = quotes.find((q: any) => q.id === req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Quote not found' });
  }
  res.json(quote);
});

app.patch("/api/quotes/:id", (req, res) => {
  try {
    const quotes = (storage as any).quotes || [];
    const index = quotes.findIndex((q: any) => q.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    quotes[index] = {
      ...quotes[index],
      ...req.body
    };
    res.json(quotes[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

// Alternatives
app.get("/api/alternatives", (req, res) => {
  console.log('[Vercel] GET /api/alternatives');
  const quoteId = req.query.quoteId;
  if (quoteId) {
    const alternatives = ((storage as any).alternatives || [])
      .filter((a: any) => a.quoteId === quoteId);
    return res.json(alternatives);
  }
  res.json((storage as any).alternatives || []);
});

app.post("/api/alternatives", (req, res) => {
  try {
    console.log('[Vercel] POST /api/alternatives:', req.body);
    const alternative = {
      id: String(Date.now()),
      ...req.body,
      createdAt: new Date()
    };
    if (!(storage as any).alternatives) (storage as any).alternatives = [];
    (storage as any).alternatives.push(alternative);
    res.status(201).json(alternative);
  } catch (error) {
    console.error('[Vercel] Error creating alternative:', error);
    res.status(500).json({ error: 'Failed to create alternative' });
  }
});

app.get("/api/alternatives/:id", (req, res) => {
  const alternatives = (storage as any).alternatives || [];
  const alternative = alternatives.find((a: any) => a.id === req.params.id);
  if (!alternative) {
    return res.status(404).json({ error: 'Alternative not found' });
  }
  res.json(alternative);
});

// Lanes - Add missing endpoints
app.post("/api/lanes", (req, res) => {
  try {
    const lane = {
      id: String(storage.lanes.length + 1),
      ...req.body,
      createdAt: new Date()
    };
    storage.lanes.push(lane);
    res.status(201).json(lane);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lane' });
  }
});

app.get("/api/lanes/:id", (req, res) => {
  const lane = storage.lanes.find(l => l.id === req.params.id);
  if (!lane) {
    return res.status(404).json({ error: 'Lane not found' });
  }
  res.json(lane);
});

app.patch("/api/lanes/:id", (req, res) => {
  try {
    const index = storage.lanes.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Lane not found' });
    }
    storage.lanes[index] = {
      ...storage.lanes[index],
      ...req.body
    };
    res.json(storage.lanes[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lane' });
  }
});

app.delete("/api/lanes/:id", (req, res) => {
  const index = storage.lanes.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lane not found' });
  }
  storage.lanes.splice(index, 1);
  res.status(204).send();
});

// Export for Vercel
export default app;
