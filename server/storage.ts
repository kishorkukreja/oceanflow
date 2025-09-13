import { type Lane, type InsertLane, type Simulation, type InsertSimulation, type Quote, type InsertQuote, type Alternative, type InsertAlternative, type MarketIndex, type InsertMarketIndex, type User, type InsertUser } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private lanes: Map<string, Lane> = new Map();
  private simulations: Map<string, Simulation> = new Map();
  private quotes: Map<string, Quote> = new Map();
  private alternatives: Map<string, Alternative> = new Map();
  private marketIndices: Map<string, MarketIndex> = new Map();

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
}

export const storage = new MemStorage();
