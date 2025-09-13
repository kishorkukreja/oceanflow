import { create } from 'zustand';
import type { SimulationResult, RateFactor, TransitSegment } from '@shared/schema';
import { calculateStatistics } from '@/lib/statistics';

interface SimulationParams {
  simulationId: string;
  laneId: string;
  iterations: number;
  factors: RateFactor[];
  segments: TransitSegment[];
  baseRate: number;
}

interface SimulationState {
  isRunning: boolean;
  progress: number;
  currentIteration: number;
  totalIterations: number;
  results: {
    rateDistribution: SimulationResult[];
    transitDistribution: SimulationResult[];
    rateStats: ReturnType<typeof calculateStatistics> | null;
    transitStats: ReturnType<typeof calculateStatistics> | null;
    duration: number;
  } | null;
  worker: Worker | null;
  
  // Actions
  startSimulation: (params: SimulationParams) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setProgress: (progress: number, currentIteration: number) => void;
  setResults: (results: SimulationResult[]) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: false,
  progress: 0,
  currentIteration: 0,
  totalIterations: 0,
  results: null,
  worker: null,

  startSimulation: (params: SimulationParams) => {
    const startTime = Date.now();
    
    // Create Web Worker for simulation
    const worker = new Worker(
      new URL('../components/simulation/monte-carlo-worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'progress':
          set({
            progress: data.progress,
            currentIteration: data.completedIterations
          });
          break;
          
        case 'complete':
          const duration = Date.now() - startTime;
          get().setResults(data);
          
          set({
            isRunning: false,
            progress: 100,
            currentIteration: params.iterations,
            results: {
              ...get().results!,
              duration
            }
          });
          
          worker.terminate();
          break;
          
        case 'error':
          console.error('Simulation error:', data.message);
          set({
            isRunning: false,
            worker: null
          });
          worker.terminate();
          break;
      }
    };

    // Start simulation
    worker.postMessage({
      type: 'start',
      params: {
        iterations: params.iterations,
        baseRate: params.baseRate,
        factors: params.factors,
        segments: params.segments
      }
    });

    set({
      isRunning: true,
      progress: 0,
      currentIteration: 0,
      totalIterations: params.iterations,
      worker,
      results: null
    });
  },

  pauseSimulation: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'pause' });
      set({ isRunning: false });
    }
  },

  resumeSimulation: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'resume' });
      set({ isRunning: true });
    }
  },

  resetSimulation: () => {
    const { worker } = get();
    if (worker) {
      worker.terminate();
    }
    
    set({
      isRunning: false,
      progress: 0,
      currentIteration: 0,
      totalIterations: 0,
      results: null,
      worker: null
    });
  },

  setProgress: (progress: number, currentIteration: number) => {
    set({ progress, currentIteration });
  },

  setResults: (rawResults: SimulationResult[]) => {
    // Extract rate and transit distributions
    const rates = rawResults.map(r => r.rate);
    const transits = rawResults.map(r => r.transitDays);
    
    // Calculate statistics
    const rateStats = calculateStatistics(rates);
    const transitStats = calculateStatistics(transits);
    
    set({
      results: {
        rateDistribution: rawResults,
        transitDistribution: rawResults,
        rateStats,
        transitStats,
        duration: 0 // Will be set by startSimulation
      }
    });
  }
}));

// Helper hook for simulation status
export const useSimulationStatus = () => {
  const { isRunning, progress, currentIteration, totalIterations } = useSimulationStore();
  
  const isComplete = progress === 100 && !isRunning;
  const isPaused = !isRunning && progress > 0 && progress < 100;
  const isIdle = !isRunning && progress === 0;
  
  const eta = isRunning && currentIteration > 0 
    ? Math.round(((totalIterations - currentIteration) / currentIteration) * (Date.now() - performance.now()))
    : null;
  
  return {
    isRunning,
    isComplete,
    isPaused,
    isIdle,
    progress,
    currentIteration,
    totalIterations,
    eta
  };
};

// Helper hook for accessing results
export const useSimulationResults = () => {
  const { results } = useSimulationStore();
  
  return {
    hasResults: !!results,
    rateDistribution: results?.rateDistribution || [],
    transitDistribution: results?.transitDistribution || [],
    rateStats: results?.rateStats || null,
    transitStats: results?.transitStats || null,
    duration: results?.duration || 0
  };
};
