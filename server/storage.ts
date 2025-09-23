import { 
  type Lane, type InsertLane, 
  type Simulation, type InsertSimulation, 
  type Quote, type InsertQuote, 
  type Alternative, type InsertAlternative, 
  type MarketIndex, type InsertMarketIndex, 
  type User, type InsertUser,
  type Shipment, type InsertShipment,
  type AutomationProcess, type InsertAutomationProcess,
  type VendorEvaluation, type InsertVendorEvaluation,
  type ProcessDocument, type InsertProcessDocument,
  type ProcessAction, type InsertProcessAction
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Lanes
  getLanes(): Promise<Lane[]>;
  getLane(id: string): Promise<Lane | undefined>;
  createLane(lane: InsertLane): Promise<Lane>;
  updateLane(id: string, updates: Partial<InsertLane>): Promise<Lane | undefined>;
  deleteLane(id: string): Promise<boolean>;
  
  // Simulations
  getSimulations(): Promise<Simulation[]>;
  getSimulation(id: string): Promise<Simulation | undefined>;
  getSimulationsByLane(laneId: string): Promise<Simulation[]>;
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  updateSimulation(id: string, updates: Partial<InsertSimulation>): Promise<Simulation | undefined>;
  
  // Quotes
  getQuotes(): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByLane(laneId: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, updates: Partial<InsertQuote>): Promise<Quote | undefined>;
  
  // Alternatives
  getAlternatives(): Promise<Alternative[]>;
  getAlternative(id: string): Promise<Alternative | undefined>;
  getAlternativesByQuote(quoteId: string): Promise<Alternative[]>;
  createAlternative(alternative: InsertAlternative): Promise<Alternative>;
  
  // Market Indices
  getMarketIndices(): Promise<MarketIndex[]>;
  getMarketIndex(code: string): Promise<MarketIndex | undefined>;
  createOrUpdateMarketIndex(index: InsertMarketIndex): Promise<MarketIndex>;
  
  // Shipments
  getShipments(): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, updates: Partial<InsertShipment>): Promise<Shipment | undefined>;
  
  // Automation Processes
  getAutomationProcesses(): Promise<AutomationProcess[]>;
  getAutomationProcess(id: string): Promise<AutomationProcess | undefined>;
  getAutomationProcessByShipment(shipmentId: string): Promise<AutomationProcess | undefined>;
  createAutomationProcess(process: InsertAutomationProcess): Promise<AutomationProcess>;
  updateAutomationProcess(id: string, updates: Partial<InsertAutomationProcess>): Promise<AutomationProcess | undefined>;
  
  // Vendor Evaluations
  getVendorEvaluations(): Promise<VendorEvaluation[]>;
  getVendorEvaluation(id: string): Promise<VendorEvaluation | undefined>;
  getVendorEvaluationsByProcess(processId: string): Promise<VendorEvaluation[]>;
  createVendorEvaluation(evaluation: InsertVendorEvaluation): Promise<VendorEvaluation>;
  
  // Process Documents
  getProcessDocuments(): Promise<ProcessDocument[]>;
  getProcessDocument(id: string): Promise<ProcessDocument | undefined>;
  getProcessDocumentsByProcess(processId: string): Promise<ProcessDocument[]>;
  createProcessDocument(document: InsertProcessDocument): Promise<ProcessDocument>;
  updateProcessDocument(id: string, updates: Partial<InsertProcessDocument>): Promise<ProcessDocument | undefined>;
  
  // Process Actions
  getProcessActions(): Promise<ProcessAction[]>;
  getProcessAction(id: string): Promise<ProcessAction | undefined>;
  getProcessActionsByProcess(processId: string): Promise<ProcessAction[]>;
  createProcessAction(action: InsertProcessAction): Promise<ProcessAction>;
  updateProcessAction(id: string, updates: Partial<InsertProcessAction>): Promise<ProcessAction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private lanes: Map<string, Lane> = new Map();
  private simulations: Map<string, Simulation> = new Map();
  private quotes: Map<string, Quote> = new Map();
  private alternatives: Map<string, Alternative> = new Map();
  private marketIndices: Map<string, MarketIndex> = new Map();
  private shipments: Map<string, Shipment> = new Map();
  private automationProcesses: Map<string, AutomationProcess> = new Map();
  private vendorEvaluations: Map<string, VendorEvaluation> = new Map();
  private processDocuments: Map<string, ProcessDocument> = new Map();
  private processActions: Map<string, ProcessAction> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize market indices
    const indices: InsertMarketIndex[] = [
      { name: "Shanghai Containerized Freight Index", code: "SCFI", value: 1247, change: 40, changePercent: 3.2 },
      { name: "China Containerized Freight Index", code: "CCFI", value: 982, change: -18, changePercent: -1.8 },
      { name: "World Container Index", code: "WCI", value: 1856, change: 100, changePercent: 5.7 },
      { name: "Baltic Dry Index", code: "BALTIC", value: 1856, change: 100, changePercent: 5.7 }
    ];

    indices.forEach(index => {
      const id = randomUUID();
      this.marketIndices.set(index.code, {
        ...index,
        id,
        lastUpdated: new Date()
      });
    });

    // Initialize sample lanes
    const sampleLanes: InsertLane[] = [
      {
        origin: "Shanghai",
        destination: "Los Angeles",
        name: "SHA → LAX",
        baseIndex: "SCFI",
        indexValue: 1247,
        laneRatio: 1.85,
        historicalVolatility: 0.15,
        segments: [
          {
            name: "Port Pickup → Terminal",
            baselineDays: 2.0,
            distribution: "normal",
            parameters: { mean: 2.0, stdDev: 0.3 },
            congestionScenarios: []
          },
          {
            name: "Ocean Transit",
            baselineDays: 14.0,
            distribution: "lognormal",
            parameters: { mu: 14.0, sigma: 2.0 },
            congestionScenarios: []
          },
          {
            name: "Port Congestion",
            baselineDays: 1.5,
            distribution: "exponential",
            parameters: { lambda: 0.67 },
            congestionScenarios: []
          }
        ],
        factors: [
          {
            name: "Carrier Premium",
            type: "carrierPremium",
            meanMultiplier: 1.05,
            distribution: "normal",
            parameters: { stdDev: 0.02 },
            enabled: true
          },
          {
            name: "Seasonality",
            type: "seasonality",
            meanMultiplier: 1.12,
            distribution: "triangle",
            parameters: { min: 1.08, mode: 1.12, max: 1.18 },
            enabled: true
          }
        ]
      }
    ];

    sampleLanes.forEach(lane => {
      const id = randomUUID();
      this.lanes.set(id, {
        ...lane,
        id,
        createdAt: new Date()
      });
    });

    // Initialize sample shipments for agentic process automation demo
    const sampleShipments: InsertShipment[] = [
      {
        referenceNumber: "SHP-2024-001",
        origin: "Shanghai",
        destination: "Los Angeles",
        commodity: "Electronics Components",
        weight: 2500,
        volume: 45.5,
        urgency: "high",
        requiredDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        specialRequirements: {
          temperature_controlled: true,
          fragile_handling: true,
          customs_clearance: "express"
        },
        status: "pending_quotes"
      },
      {
        referenceNumber: "SHP-2024-002",
        origin: "Hong Kong",
        destination: "New York",
        commodity: "Fashion Accessories",
        weight: 1200,
        volume: 28.3,
        urgency: "medium",
        requiredDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        specialRequirements: {
          insurance_required: true,
          documentation: "full_set"
        },
        status: "evaluating"
      },
      {
        referenceNumber: "SHP-2024-003",
        origin: "Singapore",
        destination: "Long Beach",
        commodity: "Automotive Parts",
        weight: 3800,
        volume: 62.7,
        urgency: "medium",
        requiredDeliveryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        specialRequirements: {
          hazmat_compliance: true,
          just_in_time: true
        },
        status: "decision_pending"
      }
    ];

    sampleShipments.forEach(shipment => {
      const id = randomUUID();
      this.shipments.set(id, {
        ...shipment,
        id,
        createdAt: new Date()
      });
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Lane methods
  async getLanes(): Promise<Lane[]> {
    return Array.from(this.lanes.values());
  }

  async getLane(id: string): Promise<Lane | undefined> {
    return this.lanes.get(id);
  }

  async createLane(lane: InsertLane): Promise<Lane> {
    const id = randomUUID();
    const newLane: Lane = { ...lane, id, createdAt: new Date() };
    this.lanes.set(id, newLane);
    return newLane;
  }

  async updateLane(id: string, updates: Partial<InsertLane>): Promise<Lane | undefined> {
    const existing = this.lanes.get(id);
    if (!existing) return undefined;
    
    const updated: Lane = { ...existing, ...updates };
    this.lanes.set(id, updated);
    return updated;
  }

  async deleteLane(id: string): Promise<boolean> {
    return this.lanes.delete(id);
  }

  // Simulation methods
  async getSimulations(): Promise<Simulation[]> {
    return Array.from(this.simulations.values());
  }

  async getSimulation(id: string): Promise<Simulation | undefined> {
    return this.simulations.get(id);
  }

  async getSimulationsByLane(laneId: string): Promise<Simulation[]> {
    return Array.from(this.simulations.values()).filter(sim => sim.laneId === laneId);
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const id = randomUUID();
    const newSim: Simulation = { 
      ...simulation, 
      id, 
      createdAt: new Date(),
      results: simulation.results ?? null,
      status: simulation.status ?? "pending",
      laneId: simulation.laneId ?? null
    };
    this.simulations.set(id, newSim);
    return newSim;
  }

  async updateSimulation(id: string, updates: Partial<InsertSimulation>): Promise<Simulation | undefined> {
    const existing = this.simulations.get(id);
    if (!existing) return undefined;
    
    const updated: Simulation = { ...existing, ...updates };
    this.simulations.set(id, updated);
    return updated;
  }

  // Quote methods
  async getQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async getQuotesByLane(laneId: string): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(quote => quote.laneId === laneId);
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const id = randomUUID();
    const newQuote: Quote = { 
      ...quote, 
      id, 
      createdAt: new Date(),
      laneId: quote.laneId ?? null,
      validUntil: quote.validUntil ?? null,
      evaluation: quote.evaluation ?? null,
      recommendation: quote.recommendation ?? null
    };
    this.quotes.set(id, newQuote);
    return newQuote;
  }

  async updateQuote(id: string, updates: Partial<InsertQuote>): Promise<Quote | undefined> {
    const existing = this.quotes.get(id);
    if (!existing) return undefined;
    
    const updated: Quote = { ...existing, ...updates };
    this.quotes.set(id, updated);
    return updated;
  }

  // Alternative methods
  async getAlternatives(): Promise<Alternative[]> {
    return Array.from(this.alternatives.values());
  }

  async getAlternative(id: string): Promise<Alternative | undefined> {
    return this.alternatives.get(id);
  }

  async getAlternativesByQuote(quoteId: string): Promise<Alternative[]> {
    return Array.from(this.alternatives.values()).filter(alt => alt.quoteId === quoteId);
  }

  async createAlternative(alternative: InsertAlternative): Promise<Alternative> {
    const id = randomUUID();
    const newAlt: Alternative = { 
      ...alternative, 
      id, 
      createdAt: new Date(),
      quoteId: alternative.quoteId ?? null
    };
    this.alternatives.set(id, newAlt);
    return newAlt;
  }

  // Market Index methods
  async getMarketIndices(): Promise<MarketIndex[]> {
    return Array.from(this.marketIndices.values());
  }

  async getMarketIndex(code: string): Promise<MarketIndex | undefined> {
    return this.marketIndices.get(code);
  }

  async createOrUpdateMarketIndex(index: InsertMarketIndex): Promise<MarketIndex> {
    const existing = this.marketIndices.get(index.code);
    const id = existing?.id || randomUUID();
    const updated: MarketIndex = {
      ...index,
      id,
      lastUpdated: new Date()
    };
    this.marketIndices.set(index.code, updated);
    return updated;
  }

  // Shipment methods
  async getShipments(): Promise<Shipment[]> {
    return Array.from(this.shipments.values());
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    return this.shipments.get(id);
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const id = randomUUID();
    const newShipment: Shipment = { 
      ...shipment, 
      id, 
      createdAt: new Date(),
      requiredDeliveryDate: shipment.requiredDeliveryDate ?? null,
      specialRequirements: shipment.specialRequirements ?? null
    };
    this.shipments.set(id, newShipment);
    return newShipment;
  }

  async updateShipment(id: string, updates: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const existing = this.shipments.get(id);
    if (!existing) return undefined;
    
    const updated: Shipment = { ...existing, ...updates };
    this.shipments.set(id, updated);
    return updated;
  }

  // Automation Process methods
  async getAutomationProcesses(): Promise<AutomationProcess[]> {
    return Array.from(this.automationProcesses.values());
  }

  async getAutomationProcess(id: string): Promise<AutomationProcess | undefined> {
    return this.automationProcesses.get(id);
  }

  async getAutomationProcessByShipment(shipmentId: string): Promise<AutomationProcess | undefined> {
    return Array.from(this.automationProcesses.values()).find(process => process.shipmentId === shipmentId);
  }

  async createAutomationProcess(process: InsertAutomationProcess): Promise<AutomationProcess> {
    const id = randomUUID();
    const newProcess: AutomationProcess = { 
      ...process, 
      id, 
      createdAt: new Date(),
      agentDecision: process.agentDecision ?? null,
      deferCost: process.deferCost ?? null,
      deferReason: process.deferReason ?? null,
      processData: process.processData ?? null,
      completedAt: process.completedAt ?? null
    };
    this.automationProcesses.set(id, newProcess);
    return newProcess;
  }

  async updateAutomationProcess(id: string, updates: Partial<InsertAutomationProcess>): Promise<AutomationProcess | undefined> {
    const existing = this.automationProcesses.get(id);
    if (!existing) return undefined;
    
    const updated: AutomationProcess = { ...existing, ...updates };
    this.automationProcesses.set(id, updated);
    return updated;
  }

  // Vendor Evaluation methods
  async getVendorEvaluations(): Promise<VendorEvaluation[]> {
    return Array.from(this.vendorEvaluations.values());
  }

  async getVendorEvaluation(id: string): Promise<VendorEvaluation | undefined> {
    return this.vendorEvaluations.get(id);
  }

  async getVendorEvaluationsByProcess(processId: string): Promise<VendorEvaluation[]> {
    return Array.from(this.vendorEvaluations.values()).filter(eval => eval.processId === processId);
  }

  async createVendorEvaluation(evaluation: InsertVendorEvaluation): Promise<VendorEvaluation> {
    const id = randomUUID();
    const newEvaluation: VendorEvaluation = { 
      ...evaluation, 
      id, 
      evaluatedAt: new Date(),
      strengths: evaluation.strengths ?? null,
      concerns: evaluation.concerns ?? null
    };
    this.vendorEvaluations.set(id, newEvaluation);
    return newEvaluation;
  }

  // Process Document methods
  async getProcessDocuments(): Promise<ProcessDocument[]> {
    return Array.from(this.processDocuments.values());
  }

  async getProcessDocument(id: string): Promise<ProcessDocument | undefined> {
    return this.processDocuments.get(id);
  }

  async getProcessDocumentsByProcess(processId: string): Promise<ProcessDocument[]> {
    return Array.from(this.processDocuments.values()).filter(doc => doc.processId === processId);
  }

  async createProcessDocument(document: InsertProcessDocument): Promise<ProcessDocument> {
    const id = randomUUID();
    const newDocument: ProcessDocument = { 
      ...document, 
      id, 
      createdAt: new Date(),
      reviewedBy: document.reviewedBy ?? null,
      reviewedAt: document.reviewedAt ?? null
    };
    this.processDocuments.set(id, newDocument);
    return newDocument;
  }

  async updateProcessDocument(id: string, updates: Partial<InsertProcessDocument>): Promise<ProcessDocument | undefined> {
    const existing = this.processDocuments.get(id);
    if (!existing) return undefined;
    
    const updated: ProcessDocument = { ...existing, ...updates };
    this.processDocuments.set(id, updated);
    return updated;
  }

  // Process Action methods
  async getProcessActions(): Promise<ProcessAction[]> {
    return Array.from(this.processActions.values());
  }

  async getProcessAction(id: string): Promise<ProcessAction | undefined> {
    return this.processActions.get(id);
  }

  async getProcessActionsByProcess(processId: string): Promise<ProcessAction[]> {
    return Array.from(this.processActions.values()).filter(action => action.processId === processId);
  }

  async createProcessAction(action: InsertProcessAction): Promise<ProcessAction> {
    const id = randomUUID();
    const newAction: ProcessAction = { 
      ...action, 
      id, 
      createdAt: new Date(),
      actionData: action.actionData ?? null,
      completedAt: action.completedAt ?? null
    };
    this.processActions.set(id, newAction);
    return newAction;
  }

  async updateProcessAction(id: string, updates: Partial<InsertProcessAction>): Promise<ProcessAction | undefined> {
    const existing = this.processActions.get(id);
    if (!existing) return undefined;
    
    const updated: ProcessAction = { ...existing, ...updates };
    this.processActions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
