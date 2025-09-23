import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLaneSchema, insertSimulationSchema, insertQuoteSchema, insertAlternativeSchema, insertMarketIndexSchema, createQuoteSchema,
  insertShipmentSchema, insertAutomationProcessSchema, insertVendorEvaluationSchema, insertProcessDocumentSchema, insertProcessActionSchema
} from "@shared/schema";

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
      const data = createQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(data);
      res.json(quote);
    } catch (error) {
      // Log Zod validation errors in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Quote validation error:', error);
        console.error('Request body:', req.body);
      }
      res.status(400).json({ error: "Invalid quote data" });
    }
  });

  app.patch("/api/quotes/:id", async (req, res) => {
    try {
      const updates = createQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(req.params.id, updates);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      // Log Zod validation errors in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Quote update validation error:', error);
        console.error('Request body:', req.body);
      }
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

  // Shipments
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const shipment = await storage.getShipment(req.params.id);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipment" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const data = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(data);
      res.json(shipment);
    } catch (error) {
      res.status(400).json({ error: "Invalid shipment data" });
    }
  });

  app.patch("/api/shipments/:id", async (req, res) => {
    try {
      const updates = insertShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateShipment(req.params.id, updates);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
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

  app.get("/api/automation-processes/:id", async (req, res) => {
    try {
      const process = await storage.getAutomationProcess(req.params.id);
      if (!process) {
        return res.status(404).json({ error: "Automation process not found" });
      }
      res.json(process);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch automation process" });
    }
  });

  app.get("/api/shipments/:shipmentId/automation-process", async (req, res) => {
    try {
      const process = await storage.getAutomationProcessByShipment(req.params.shipmentId);
      if (!process) {
        return res.status(404).json({ error: "Automation process not found for this shipment" });
      }
      res.json(process);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch automation process" });
    }
  });

  app.post("/api/automation-processes", async (req, res) => {
    try {
      const data = insertAutomationProcessSchema.parse(req.body);
      const process = await storage.createAutomationProcess(data);
      res.json(process);
    } catch (error) {
      res.status(400).json({ error: "Invalid automation process data" });
    }
  });

  app.patch("/api/automation-processes/:id", async (req, res) => {
    try {
      const updates = insertAutomationProcessSchema.partial().parse(req.body);
      const process = await storage.updateAutomationProcess(req.params.id, updates);
      if (!process) {
        return res.status(404).json({ error: "Automation process not found" });
      }
      res.json(process);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Vendor Evaluations
  app.get("/api/vendor-evaluations", async (req, res) => {
    try {
      const evaluations = await storage.getVendorEvaluations();
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor evaluations" });
    }
  });

  app.get("/api/vendor-evaluations/:id", async (req, res) => {
    try {
      const evaluation = await storage.getVendorEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ error: "Vendor evaluation not found" });
      }
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor evaluation" });
    }
  });

  app.get("/api/automation-processes/:processId/vendor-evaluations", async (req, res) => {
    try {
      const evaluations = await storage.getVendorEvaluationsByProcess(req.params.processId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor evaluations" });
    }
  });

  app.post("/api/vendor-evaluations", async (req, res) => {
    try {
      const data = insertVendorEvaluationSchema.parse(req.body);
      const evaluation = await storage.createVendorEvaluation(data);
      res.json(evaluation);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor evaluation data" });
    }
  });

  // Process Documents
  app.get("/api/process-documents", async (req, res) => {
    try {
      const documents = await storage.getProcessDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process documents" });
    }
  });

  app.get("/api/process-documents/:id", async (req, res) => {
    try {
      const document = await storage.getProcessDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Process document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process document" });
    }
  });

  app.get("/api/automation-processes/:processId/documents", async (req, res) => {
    try {
      const documents = await storage.getProcessDocumentsByProcess(req.params.processId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process documents" });
    }
  });

  app.post("/api/process-documents", async (req, res) => {
    try {
      const data = insertProcessDocumentSchema.parse(req.body);
      const document = await storage.createProcessDocument(data);
      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid process document data" });
    }
  });

  app.patch("/api/process-documents/:id", async (req, res) => {
    try {
      const updates = insertProcessDocumentSchema.partial().parse(req.body);
      const document = await storage.updateProcessDocument(req.params.id, updates);
      if (!document) {
        return res.status(404).json({ error: "Process document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Process Actions
  app.get("/api/process-actions", async (req, res) => {
    try {
      const actions = await storage.getProcessActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process actions" });
    }
  });

  app.get("/api/process-actions/:id", async (req, res) => {
    try {
      const action = await storage.getProcessAction(req.params.id);
      if (!action) {
        return res.status(404).json({ error: "Process action not found" });
      }
      res.json(action);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process action" });
    }
  });

  app.get("/api/automation-processes/:processId/actions", async (req, res) => {
    try {
      const actions = await storage.getProcessActionsByProcess(req.params.processId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process actions" });
    }
  });

  app.post("/api/process-actions", async (req, res) => {
    try {
      const data = insertProcessActionSchema.parse(req.body);
      const action = await storage.createProcessAction(data);
      res.json(action);
    } catch (error) {
      res.status(400).json({ error: "Invalid process action data" });
    }
  });

  app.patch("/api/process-actions/:id", async (req, res) => {
    try {
      const updates = insertProcessActionSchema.partial().parse(req.body);
      const action = await storage.updateProcessAction(req.params.id, updates);
      if (!action) {
        return res.status(404).json({ error: "Process action not found" });
      }
      res.json(action);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
