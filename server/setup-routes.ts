import type { Express } from "express";
import { storage } from "./storage";
import { initializeData } from "./init-data";
import {
  insertLaneSchema, insertSimulationSchema, insertQuoteSchema, insertAlternativeSchema, insertMarketIndexSchema, createQuoteSchema,
  insertShipmentSchema, insertAutomationProcessSchema, insertVendorEvaluationSchema, insertProcessDocumentSchema, insertProcessActionSchema
} from "@shared/schema";

let isInitialized = false;

export async function setupRoutes(app: Express): Promise<void> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    const lanesCount = await storage.getLanes().then(l => l.length).catch(() => 0);
    const indicesCount = await storage.getMarketIndices().then(i => i.length).catch(() => 0);

    res.json({
      status: "ok",
      initialized: isInitialized,
      storageType: "in-memory",
      dataCount: { lanes: lanesCount, indices: indicesCount },
      timestamp: new Date().toISOString()
    });
  });

  // Initialize default data BEFORE setting up routes
  if (!isInitialized) {
    console.log('[Setup] Starting data initialization...');
    try {
      await initializeData();
      isInitialized = true;
      console.log('[Setup] Data initialization complete');
    } catch (error) {
      console.error('[Setup] CRITICAL: Failed to initialize data:', error);
      // Don't throw - try to continue
    }
  }

  // Import all routes from the existing routes file by copying them here
  // For now, let's just add the critical ones and you can add more as needed

  // Market Indices
  app.get("/api/indices", async (req, res) => {
    try {
      const indices = await storage.getMarketIndices();
      res.json(indices);
    } catch (error) {
      console.error('Error fetching indices:', error);
      res.status(500).json({
        error: "Failed to fetch market indices",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Lanes
  app.get("/api/lanes", async (req, res) => {
    try {
      const lanes = await storage.getLanes();
      res.json(lanes);
    } catch (error) {
      console.error('Error fetching lanes:', error);
      res.status(500).json({
        error: "Failed to fetch lanes",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Shipments
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  // Automation Processes
  app.get("/api/automation-processes", async (req, res) => {
    try {
      const processes = await storage.getAutomationProcesses();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch automation processes" });
    }
  });
}
