// Monte Carlo simulation worker for non-blocking calculations
import type { RateFactor, TransitSegment, SimulationResult } from "@shared/schema";

export interface SimulationParams {
  iterations: number;
  baseRate: number;
  factors: RateFactor[];
  segments: TransitSegment[];
}

export interface SimulationMessage {
  type: 'start' | 'progress' | 'complete' | 'error';
  data?: any;
}

// Statistical distribution functions
function normalRandom(mean: number = 0, stdDev: number = 1): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

function lognormalRandom(mu: number, sigma: number): number {
  const normal = normalRandom(0, 1);
  return Math.exp(mu + sigma * normal);
}

function triangularRandom(min: number, mode: number, max: number): number {
  const u = Math.random();
  const f = (mode - min) / (max - min);
  
  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

function exponentialRandom(lambda: number): number {
  return -Math.log(1 - Math.random()) / lambda;
}

function simulateRateFactor(factor: RateFactor): number {
  if (!factor.enabled) return 1.0;
  
  const { distribution, meanMultiplier, parameters } = factor;
  
  switch (distribution) {
    case 'normal':
      return normalRandom(meanMultiplier, parameters.stdDev || 0.02);
    
    case 'lognormal':
      return lognormalRandom(
        Math.log(meanMultiplier), 
        parameters.sigma || 0.05
      );
    
    case 'triangle':
      return triangularRandom(
        parameters.min || meanMultiplier * 0.9,
        meanMultiplier,
        parameters.max || meanMultiplier * 1.1
      );
    
    case 'exponential':
      return exponentialRandom(parameters.lambda || 1.0);
    
    default:
      return meanMultiplier;
  }
}

function simulateTransitSegment(segment: TransitSegment): number {
  const { distribution, baselineDays, parameters } = segment;
  
  switch (distribution) {
    case 'normal':
      return Math.max(0.1, normalRandom(
        parameters.mean || baselineDays, 
        parameters.stdDev || baselineDays * 0.1
      ));
    
    case 'lognormal':
      return lognormalRandom(
        parameters.mu || Math.log(baselineDays),
        parameters.sigma || 0.2
      );
    
    default:
      return normalRandom(baselineDays, baselineDays * 0.1);
  }
}

function runSingleIteration(params: SimulationParams): SimulationResult {
  const { baseRate, factors, segments } = params;
  
  // Simulate rate with all factors
  let finalRate = baseRate;
  for (const factor of factors) {
    const multiplier = simulateRateFactor(factor);
    finalRate *= multiplier;
  }
  
  // Simulate transit time for all segments
  let totalTransitDays = 0;
  for (const segment of segments) {
    totalTransitDays += simulateTransitSegment(segment);
  }
  
  // Calculate delay costs (simplified model)
  const expectedDays = segments.reduce((sum, seg) => sum + seg.baselineDays, 0);
  const delayDays = Math.max(0, totalTransitDays - expectedDays);
  const delayCostPerDay = finalRate * 0.001; // 0.1% per day delay
  const delayCost = delayDays * delayCostPerDay;
  
  const startDate = new Date();
  const arrivalDate = new Date(startDate.getTime() + totalTransitDays * 24 * 60 * 60 * 1000);
  
  return {
    iteration: 0, // Will be set by caller
    rate: finalRate,
    transitDays: totalTransitDays,
    arrivalDate,
    delayCost,
    totalLandedCost: finalRate + delayCost
  };
}

export function runMonteCarloSimulation(params: SimulationParams): Promise<SimulationResult[]> {
  return new Promise((resolve, reject) => {
    try {
      const results: SimulationResult[] = [];
      const batchSize = 100;
      const totalBatches = Math.ceil(params.iterations / batchSize);
      
      let completedIterations = 0;
      
      const processBatch = (batchIndex: number) => {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, params.iterations);
        
        for (let i = batchStart; i < batchEnd; i++) {
          const result = runSingleIteration(params);
          result.iteration = i;
          results.push(result);
          completedIterations++;
        }
        
        // Post progress update
        const progress = (completedIterations / params.iterations) * 100;
        self.postMessage({
          type: 'progress',
          data: { progress, completedIterations }
        } as SimulationMessage);
        
        if (batchIndex < totalBatches - 1) {
          // Schedule next batch asynchronously
          setTimeout(() => processBatch(batchIndex + 1), 0);
        } else {
          // Simulation complete
          resolve(results);
        }
      }
      
      // Start first batch
      processBatch(0);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Worker message handler
self.onmessage = async function(e: MessageEvent<{ type: string; params: SimulationParams }>) {
  const { type, params } = e.data;
  
  if (type === 'start') {
    try {
      self.postMessage({
        type: 'progress',
        data: { progress: 0, completedIterations: 0 }
      } as SimulationMessage);
      
      const results = await runMonteCarloSimulation(params);
      
      self.postMessage({
        type: 'complete',
        data: results
      } as SimulationMessage);
      
    } catch (error) {
      self.postMessage({
        type: 'error',
        data: { message: error instanceof Error ? error.message : 'Simulation failed' }
      } as SimulationMessage);
    }
  }
};
