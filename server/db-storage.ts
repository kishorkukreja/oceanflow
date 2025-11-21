import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import {
  lanes, simulations, quotes, alternatives, marketIndices, users, shipments,
  automationProcesses, vendorEvaluations, processDocuments, processActions,
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
} from '@shared/schema';
import type { IStorage } from './storage';

export class DbStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  // Lanes
  async getLanes(): Promise<Lane[]> {
    return await this.db.select().from(lanes);
  }

  async getLane(id: string): Promise<Lane | undefined> {
    const result = await this.db.select().from(lanes).where(eq(lanes.id, id));
    return result[0];
  }

  async createLane(lane: InsertLane): Promise<Lane> {
    const result = await this.db.insert(lanes).values(lane).returning();
    return result[0];
  }

  async updateLane(id: string, updates: Partial<InsertLane>): Promise<Lane | undefined> {
    const result = await this.db.update(lanes).set(updates).where(eq(lanes.id, id)).returning();
    return result[0];
  }

  async deleteLane(id: string): Promise<boolean> {
    const result = await this.db.delete(lanes).where(eq(lanes.id, id)).returning();
    return result.length > 0;
  }

  // Simulations
  async getSimulations(): Promise<Simulation[]> {
    return await this.db.select().from(simulations);
  }

  async getSimulation(id: string): Promise<Simulation | undefined> {
    const result = await this.db.select().from(simulations).where(eq(simulations.id, id));
    return result[0];
  }

  async getSimulationsByLane(laneId: string): Promise<Simulation[]> {
    return await this.db.select().from(simulations).where(eq(simulations.laneId, laneId));
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const result = await this.db.insert(simulations).values(simulation).returning();
    return result[0];
  }

  async updateSimulation(id: string, updates: Partial<InsertSimulation>): Promise<Simulation | undefined> {
    const result = await this.db.update(simulations).set(updates).where(eq(simulations.id, id)).returning();
    return result[0];
  }

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    return await this.db.select().from(quotes);
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const result = await this.db.select().from(quotes).where(eq(quotes.id, id));
    return result[0];
  }

  async getQuotesByLane(laneId: string): Promise<Quote[]> {
    return await this.db.select().from(quotes).where(eq(quotes.laneId, laneId));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const result = await this.db.insert(quotes).values(quote).returning();
    return result[0];
  }

  async updateQuote(id: string, updates: Partial<InsertQuote>): Promise<Quote | undefined> {
    const result = await this.db.update(quotes).set(updates).where(eq(quotes.id, id)).returning();
    return result[0];
  }

  // Alternatives
  async getAlternatives(): Promise<Alternative[]> {
    return await this.db.select().from(alternatives);
  }

  async getAlternative(id: string): Promise<Alternative | undefined> {
    const result = await this.db.select().from(alternatives).where(eq(alternatives.id, id));
    return result[0];
  }

  async getAlternativesByQuote(quoteId: string): Promise<Alternative[]> {
    return await this.db.select().from(alternatives).where(eq(alternatives.quoteId, quoteId));
  }

  async createAlternative(alternative: InsertAlternative): Promise<Alternative> {
    const result = await this.db.insert(alternatives).values(alternative).returning();
    return result[0];
  }

  // Market Indices
  async getMarketIndices(): Promise<MarketIndex[]> {
    return await this.db.select().from(marketIndices);
  }

  async getMarketIndex(code: string): Promise<MarketIndex | undefined> {
    const result = await this.db.select().from(marketIndices).where(eq(marketIndices.code, code));
    return result[0];
  }

  async createOrUpdateMarketIndex(index: InsertMarketIndex): Promise<MarketIndex> {
    const existing = await this.getMarketIndex(index.code);
    if (existing) {
      const result = await this.db.update(marketIndices).set(index).where(eq(marketIndices.code, index.code)).returning();
      return result[0];
    }
    const result = await this.db.insert(marketIndices).values(index).returning();
    return result[0];
  }

  // Shipments
  async getShipments(): Promise<Shipment[]> {
    return await this.db.select().from(shipments);
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const result = await this.db.select().from(shipments).where(eq(shipments.id, id));
    return result[0];
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const result = await this.db.insert(shipments).values(shipment).returning();
    return result[0];
  }

  async updateShipment(id: string, updates: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const result = await this.db.update(shipments).set(updates).where(eq(shipments.id, id)).returning();
    return result[0];
  }

  async deleteShipment(id: string): Promise<boolean> {
    const result = await this.db.delete(shipments).where(eq(shipments.id, id)).returning();
    return result.length > 0;
  }

  // Automation Processes
  async getAutomationProcesses(): Promise<AutomationProcess[]> {
    return await this.db.select().from(automationProcesses);
  }

  async getAutomationProcess(id: string): Promise<AutomationProcess | undefined> {
    const result = await this.db.select().from(automationProcesses).where(eq(automationProcesses.id, id));
    return result[0];
  }

  async getAutomationProcessByShipment(shipmentId: string): Promise<AutomationProcess | undefined> {
    const result = await this.db.select().from(automationProcesses).where(eq(automationProcesses.shipmentId, shipmentId));
    return result[0];
  }

  async createAutomationProcess(process: InsertAutomationProcess): Promise<AutomationProcess> {
    const result = await this.db.insert(automationProcesses).values(process).returning();
    return result[0];
  }

  async updateAutomationProcess(id: string, updates: Partial<InsertAutomationProcess>): Promise<AutomationProcess | undefined> {
    const result = await this.db.update(automationProcesses).set(updates).where(eq(automationProcesses.id, id)).returning();
    return result[0];
  }

  // Vendor Evaluations
  async getVendorEvaluations(): Promise<VendorEvaluation[]> {
    return await this.db.select().from(vendorEvaluations);
  }

  async getVendorEvaluation(id: string): Promise<VendorEvaluation | undefined> {
    const result = await this.db.select().from(vendorEvaluations).where(eq(vendorEvaluations.id, id));
    return result[0];
  }

  async getVendorEvaluationsByProcess(processId: string): Promise<VendorEvaluation[]> {
    return await this.db.select().from(vendorEvaluations).where(eq(vendorEvaluations.processId, processId));
  }

  async createVendorEvaluation(evaluation: InsertVendorEvaluation): Promise<VendorEvaluation> {
    const result = await this.db.insert(vendorEvaluations).values(evaluation).returning();
    return result[0];
  }

  // Process Documents
  async getProcessDocuments(): Promise<ProcessDocument[]> {
    return await this.db.select().from(processDocuments);
  }

  async getProcessDocument(id: string): Promise<ProcessDocument | undefined> {
    const result = await this.db.select().from(processDocuments).where(eq(processDocuments.id, id));
    return result[0];
  }

  async getProcessDocumentsByProcess(processId: string): Promise<ProcessDocument[]> {
    return await this.db.select().from(processDocuments).where(eq(processDocuments.processId, processId));
  }

  async createProcessDocument(document: InsertProcessDocument): Promise<ProcessDocument> {
    const result = await this.db.insert(processDocuments).values(document).returning();
    return result[0];
  }

  async updateProcessDocument(id: string, updates: Partial<InsertProcessDocument>): Promise<ProcessDocument | undefined> {
    const result = await this.db.update(processDocuments).set(updates).where(eq(processDocuments.id, id)).returning();
    return result[0];
  }

  // Process Actions
  async getProcessActions(): Promise<ProcessAction[]> {
    return await this.db.select().from(processActions);
  }

  async getProcessAction(id: string): Promise<ProcessAction | undefined> {
    const result = await this.db.select().from(processActions).where(eq(processActions.id, id));
    return result[0];
  }

  async getProcessActionsByProcess(processId: string): Promise<ProcessAction[]> {
    return await this.db.select().from(processActions).where(eq(processActions.processId, processId));
  }

  async createProcessAction(action: InsertProcessAction): Promise<ProcessAction> {
    const result = await this.db.insert(processActions).values(action).returning();
    return result[0];
  }

  async updateProcessAction(id: string, updates: Partial<InsertProcessAction>): Promise<ProcessAction | undefined> {
    const result = await this.db.update(processActions).set(updates).where(eq(processActions.id, id)).returning();
    return result[0];
  }
}
