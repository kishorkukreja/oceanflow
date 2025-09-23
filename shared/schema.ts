import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const lanes = pgTable("lanes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  name: text("name").notNull(),
  baseIndex: text("base_index").notNull(),
  indexValue: real("index_value").notNull(),
  laneRatio: real("lane_ratio").notNull(),
  historicalVolatility: real("historical_volatility").notNull(),
  segments: jsonb("segments").notNull(),
  factors: jsonb("factors").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  laneId: varchar("lane_id").references(() => lanes.id),
  iterations: integer("iterations").notNull(),
  rateDistribution: jsonb("rate_distribution").notNull(),
  transitDistribution: jsonb("transit_distribution").notNull(),
  status: text("status").notNull().default("pending"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  laneId: varchar("lane_id").references(() => lanes.id),
  carrier: text("carrier").notNull(),
  rate: real("rate").notNull(),
  validUntil: timestamp("valid_until"),
  evaluation: jsonb("evaluation"),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alternatives = pgTable("alternatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").references(() => quotes.id),
  type: text("type").notNull(),
  parameters: jsonb("parameters").notNull(),
  simulation: jsonb("simulation").notNull(),
  score: real("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market indices
export const marketIndices = pgTable("market_indices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  value: real("value").notNull(),
  change: real("change").notNull(),
  changePercent: real("change_percent").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas
export const insertLaneSchema = createInsertSchema(lanes).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertAlternativeSchema = createInsertSchema(alternatives).omit({
  id: true,
  createdAt: true,
});

export const insertMarketIndexSchema = createInsertSchema(marketIndices).omit({
  id: true,
  lastUpdated: true,
});

// Normalized schema for creating quotes from frontend (handles string to number/date conversions)
export const createQuoteSchema = insertQuoteSchema.extend({
  rate: z.coerce.number().gt(0, "Rate must be greater than 0"),
  validUntil: z.preprocess(
    (val) => {
      if (val == null || val === "") return undefined;
      if (typeof val === "string") return new Date(val);
      return val;
    },
    z.date().optional()
  ),
  evaluation: z.any().nullable().optional(),
  recommendation: z.string().optional().nullable()
});

// Types
export type Lane = typeof lanes.$inferSelect;
export type InsertLane = z.infer<typeof insertLaneSchema>;
export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Alternative = typeof alternatives.$inferSelect;
export type InsertAlternative = z.infer<typeof insertAlternativeSchema>;
export type MarketIndex = typeof marketIndices.$inferSelect;
export type InsertMarketIndex = z.infer<typeof insertMarketIndexSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Simulation-specific types
export interface RateFactor {
  name: string;
  type: 'carrierPremium' | 'seasonality' | 'capacityUtilization' | 'fuelSurcharge';
  meanMultiplier: number;
  distribution: 'normal' | 'lognormal' | 'triangle' | 'exponential';
  parameters: Record<string, number>;
  enabled: boolean;
}

export interface TransitSegment {
  name: string;
  baselineDays: number;
  distribution: 'normal' | 'lognormal';
  parameters: Record<string, number>;
  congestionScenarios: CongestionScenario[];
}

export interface CongestionScenario {
  name: string;
  probability: number;
  delayPattern: number[];
  description: string;
}

export interface SimulationResult {
  iteration: number;
  rate: number;
  transitDays: number;
  arrivalDate: Date;
  delayCost: number;
  totalLandedCost: number;
}

export interface QuoteEvaluation {
  marketVariance: number;
  modelVariance: number;
  percentile: number;
  riskScore: number;
  recommendation: 'BOOK_NOW' | 'WAIT' | 'NEGOTIATE' | 'REJECT';
  confidence: number;
}

// New tables for agentic process automation

export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: text("reference_number").notNull().unique(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  commodity: text("commodity").notNull(),
  weight: real("weight").notNull(),
  volume: real("volume").notNull(),
  urgency: text("urgency").notNull().default("medium"), // low, medium, high
  requiredDeliveryDate: timestamp("required_delivery_date"),
  specialRequirements: jsonb("special_requirements"),
  status: text("status").notNull().default("pending_quotes"), // pending_quotes, evaluating, decision_pending, booked, deferred, released
  createdAt: timestamp("created_at").defaultNow(),
});

export const automationProcesses = pgTable("automation_processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").references(() => shipments.id).notNull(),
  currentStage: text("current_stage").notNull().default("quote_collection"), 
  // Stages: quote_collection, agent_evaluation, decision_analysis, booking_execution, document_generation, approval_pending, completed
  quotesCollected: integer("quotes_collected").notNull().default(0),
  agentDecision: text("agent_decision"), // defer, book
  deferCost: real("defer_cost"),
  deferReason: text("defer_reason"),
  processData: jsonb("process_data"), // Store various process-specific data
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendorEvaluations = pgTable("vendor_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: varchar("process_id").references(() => automationProcesses.id).notNull(),
  quoteId: varchar("quote_id").references(() => quotes.id).notNull(),
  agentName: text("agent_name").notNull(), // "Fitment Evaluation Agent"
  ratingScore: real("rating_score").notNull(), // 0-100 score
  fitmentFactors: jsonb("fitment_factors").notNull(), // Details of what was evaluated
  strengths: text("strengths").array(),
  concerns: text("concerns").array(),
  recommendation: text("recommendation").notNull(), // ACCEPT, REJECT, CONDITIONAL
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
});

export const processDocuments = pgTable("process_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: varchar("process_id").references(() => automationProcesses.id).notNull(),
  documentType: text("document_type").notNull(), // booking_confirmation, commercial_invoice, bill_of_lading, customs_declaration
  documentName: text("document_name").notNull(),
  status: text("status").notNull().default("generated"), // generated, reviewed, approved, rejected
  content: jsonb("content").notNull(), // Document data/metadata
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const processActions = pgTable("process_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: varchar("process_id").references(() => automationProcesses.id).notNull(),
  actionType: text("action_type").notNull(), // integrate_otm, approve_vendor, initiate_documentation, set_pickup_date
  actionStatus: text("action_status").notNull().default("pending"), // pending, in_progress, completed, failed
  actionData: jsonb("action_data"), // Action-specific data
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
});

export const insertAutomationProcessSchema = createInsertSchema(automationProcesses).omit({
  id: true,
  createdAt: true,
});

export const insertVendorEvaluationSchema = createInsertSchema(vendorEvaluations).omit({
  id: true,
  evaluatedAt: true,
});

export const insertProcessDocumentSchema = createInsertSchema(processDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertProcessActionSchema = createInsertSchema(processActions).omit({
  id: true,
  createdAt: true,
});

// Types for new entities
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type AutomationProcess = typeof automationProcesses.$inferSelect;
export type InsertAutomationProcess = z.infer<typeof insertAutomationProcessSchema>;
export type VendorEvaluation = typeof vendorEvaluations.$inferSelect;
export type InsertVendorEvaluation = z.infer<typeof insertVendorEvaluationSchema>;
export type ProcessDocument = typeof processDocuments.$inferSelect;
export type InsertProcessDocument = z.infer<typeof insertProcessDocumentSchema>;
export type ProcessAction = typeof processActions.$inferSelect;
export type InsertProcessAction = z.infer<typeof insertProcessActionSchema>;

// Additional interfaces for the agentic workflow
export interface AgentFitmentFactors {
  priceScore: number; // 0-100
  transitTimeScore: number; // 0-100
  carrierReliabilityScore: number; // 0-100
  capacityAvailabilityScore: number; // 0-100
  serviceQualityScore: number; // 0-100
  complianceScore: number; // 0-100
}

export interface DecisionAgentAnalysis {
  totalQuotesEvaluated: number;
  averageFitmentScore: number;
  topRecommendedQuote: string; // quote ID
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  deferAnalysis?: {
    estimatedSavings: number;
    holdingCosts: number;
    marketTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
    recommendedWaitDays: number;
  };
  bookingAnalysis?: {
    selectedVendor: string;
    totalCost: number;
    expectedDeliveryDate: Date;
    riskFactors: string[];
  };
}
