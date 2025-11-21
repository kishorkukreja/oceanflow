import express from "express";
import { storage } from "../server/storage";
import { initializeData } from "../server/init-data";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize data on cold start
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    console.log('[Vercel] Initializing data...');
    try {
      await initializeData();
      initialized = true;
      console.log('[Vercel] Data initialized successfully');
    } catch (error) {
      console.error('[Vercel] Failed to initialize:', error);
    }
  }
}

// Health check
app.get("/api/health", async (req, res) => {
  await ensureInitialized();
  const lanesCount = (await storage.getLanes()).length;
  const indicesCount = (await storage.getMarketIndices()).length;

  res.json({
    status: "ok",
    initialized,
    storageType: "in-memory",
    dataCount: { lanes: lanesCount, indices: indicesCount },
    timestamp: new Date().toISOString()
  });
});

// Lanes
app.get("/api/lanes", async (req, res) => {
  try {
    await ensureInitialized();
    const lanes = await storage.getLanes();
    console.log(`[Vercel] Returning ${lanes.length} lanes`);
    res.json(lanes);
  } catch (error) {
    console.error('[Vercel] Error fetching lanes:', error);
    res.status(500).json({
      error: "Failed to fetch lanes",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Market Indices
app.get("/api/indices", async (req, res) => {
  try {
    await ensureInitialized();
    const indices = await storage.getMarketIndices();
    console.log(`[Vercel] Returning ${indices.length} indices`);
    res.json(indices);
  } catch (error) {
    console.error('[Vercel] Error fetching indices:', error);
    res.status(500).json({
      error: "Failed to fetch indices",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export for Vercel
export default app;
