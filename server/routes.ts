import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLaneSchema, insertSimulationSchema, insertQuoteSchema, insertAlternativeSchema, insertMarketIndexSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Market Indices
  app.get("/api/indices", async (req, res) => {
    try {
      const indices = await storage.getMarketIndices();
      res.json(indices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market indices" });
    }
  });

  app.post("/api/indices", async (req, res) => {
    try {
      const data = insertMarketIndexSchema.parse(req.body);
      const index = await storage.createOrUpdateMarketIndex(data);
      res.json(index);
    } catch (error) {
      res.status(400).json({ error: "Invalid market index data" });
    }
  });

  // Lanes
  app.get("/api/lanes", async (req, res) => {
    try {
      const lanes = await storage.getLanes();
      res.json(lanes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lanes" });
    }
  });

  app.get("/api/lanes/:id", async (req, res) => {
    try {
      const lane = await storage.getLane(req.params.id);
      if (!lane) {
        return res.status(404).json({ error: "Lane not found" });
      }
      res.json(lane);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lane" });
    }
  });

  app.post("/api/lanes", async (req, res) => {
    try {
      const data = insertLaneSchema.parse(req.body);
      const lane = await storage.createLane(data);
      res.json(lane);
    } catch (error) {
      res.status(400).json({ error: "Invalid lane data" });
    }
  });

  app.patch("/api/lanes/:id", async (req, res) => {
    try {
      const updates = insertLaneSchema.partial().parse(req.body);
      const lane = await storage.updateLane(req.params.id, updates);
      if (!lane) {
        return res.status(404).json({ error: "Lane not found" });
      }
      res.json(lane);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/lanes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLane(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lane not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lane" });
    }
  });

  // Simulations
  app.get("/api/simulations", async (req, res) => {
    try {
      const simulations = await storage.getSimulations();
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch simulations" });
    }
  });

  app.get("/api/simulations/:id", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch simulation" });
    }
  });

  app.get("/api/lanes/:laneId/simulations", async (req, res) => {
    try {
      const simulations = await storage.getSimulationsByLane(req.params.laneId);
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lane simulations" });
    }
  });

  app.post("/api/simulations", async (req, res) => {
    try {
      const data = insertSimulationSchema.parse(req.body);
      const simulation = await storage.createSimulation(data);
      res.json(simulation);
    } catch (error) {
      res.status(400).json({ error: "Invalid simulation data" });
    }
  });

  app.patch("/api/simulations/:id", async (req, res) => {
    try {
      const updates = insertSimulationSchema.partial().parse(req.body);
      const simulation = await storage.updateSimulation(req.params.id, updates);
      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Quotes
  app.get("/api/quotes", async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  app.get("/api/lanes/:laneId/quotes", async (req, res) => {
    try {
      const quotes = await storage.getQuotesByLane(req.params.laneId);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lane quotes" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const data = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(data);
      res.json(quote);
    } catch (error) {
      res.status(400).json({ error: "Invalid quote data" });
    }
  });

  app.patch("/api/quotes/:id", async (req, res) => {
    try {
      const updates = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(req.params.id, updates);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Alternatives
  app.get("/api/alternatives", async (req, res) => {
    try {
      const alternatives = await storage.getAlternatives();
      res.json(alternatives);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alternatives" });
    }
  });

  app.get("/api/quotes/:quoteId/alternatives", async (req, res) => {
    try {
      const alternatives = await storage.getAlternativesByQuote(req.params.quoteId);
      res.json(alternatives);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote alternatives" });
    }
  });

  app.post("/api/alternatives", async (req, res) => {
    try {
      const data = insertAlternativeSchema.parse(req.body);
      const alternative = await storage.createAlternative(data);
      res.json(alternative);
    } catch (error) {
      res.status(400).json({ error: "Invalid alternative data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
