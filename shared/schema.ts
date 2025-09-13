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
