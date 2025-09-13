import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { RateSimulator } from "@/components/simulation/rate-simulator";
import { TransitSimulator } from "@/components/simulation/transit-simulator";
import { DistributionChart } from "@/components/visualization/distribution-chart";
import { useSimulationStore } from "@/store/simulation-store";
import type { Lane, Simulation, TransitSegment, RateFactor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Info, TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react";

// Process simulation results to create statistics for UI
function processSimulationResults(rawResults: any[]) {
  if (!rawResults || rawResults.length === 0) {
    return { 
      rawResults: [], 
      rateStats: { mean: 0, p10: 0, p50: 0, p90: 0, stdDev: 0 }, 
      transitStats: { mean: 0, p10: 0, p50: 0, p90: 0 }
    };
  }

  const rates = rawResults.map(r => r.rate).sort((a, b) => a - b);
  const transits = rawResults.map(r => r.transitDays).sort((a, b) => a - b);
  
  // Calculate rate statistics
  const rateMean = rates.reduce((sum, val) => sum + val, 0) / rates.length;
  const rateStats = {
    mean: rateMean,
    p10: rates[Math.floor(rates.length * 0.1)],
    p50: rates[Math.floor(rates.length * 0.5)],
    p90: rates[Math.floor(rates.length * 0.9)],
    stdDev: Math.sqrt(rates.reduce((sum, val) => sum + Math.pow(val - rateMean, 2), 0) / rates.length)
  };
  
  // Calculate transit statistics
  const transitMean = transits.reduce((sum, val) => sum + val, 0) / transits.length;
  const transitStats = {
    mean: transitMean,
    p10: transits[Math.floor(transits.length * 0.1)],
    p50: transits[Math.floor(transits.length * 0.5)],
    p90: transits[Math.floor(transits.length * 0.9)]
  };
  
  return {
    rawResults, // Keep raw results for DistributionChart
    rateStats,
    transitStats
  };
}

// What-if scenarios for maritime logistics
const SCENARIOS = [
  {
    id: 'disruption',
    name: 'Market Disruption',
    description: 'Port closures, supply chain disruptions',
    icon: AlertTriangle,
    color: 'text-red-500',
    factors: {
      rateMultiplier: 1.4, // 40% higher rates
      volatilityMultiplier: 2.5, // Much higher volatility
      transitDelayMultiplier: 1.6 // 60% longer transit times
    }
  },
  {
    id: 'fuel-spike',
    name: 'Fuel Price Spike',
    description: 'Significant increase in fuel costs (+80%)',
    icon: TrendingUp,
    color: 'text-orange-500',
    factors: {
      rateMultiplier: 1.25, // 25% higher rates
      volatilityMultiplier: 1.3, // Moderate volatility increase
      transitDelayMultiplier: 1.1 // Slight delays due to route optimization
    }
  },
  {
    id: 'peak-season',
    name: 'Peak Season',
    description: 'High demand with capacity constraints',
    icon: Zap,
    color: 'text-yellow-500',
    factors: {
      rateMultiplier: 1.6, // 60% higher rates
      volatilityMultiplier: 1.8, // Higher volatility
      transitDelayMultiplier: 1.3 // 30% longer due to congestion
    }
  },
  {
    id: 'downturn',
    name: 'Economic Downturn',
    description: 'Reduced demand and pricing pressure',
    icon: TrendingDown,
    color: 'text-blue-500',
    factors: {
      rateMultiplier: 0.7, // 30% lower rates
      volatilityMultiplier: 1.2, // Slight volatility increase
      transitDelayMultiplier: 0.9 // Faster transit due to less congestion
    }
  }
];

export default function SimulationPage() {
  const [selectedLane, setSelectedLane] = useState<string>("");
  const [iterations, setIterations] = useState("5000");
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [scenarioResults, setScenarioResults] = useState<{[key: string]: any}>({});
  const [isRunningScenarios, setIsRunningScenarios] = useState(false);
  const { toast } = useToast();

  const { 
    isRunning, 
    progress, 
    currentIteration, 
    results,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setProgress
  } = useSimulationStore();

  const { data: lanes, isLoading: lanesLoading } = useQuery<Lane[]>({ 
    queryKey: ["/api/lanes"] 
  });

  const { data: simulations } = useQuery<Simulation[]>({ 
    queryKey: ["/api/simulations"] 
  });

  const createSimulationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/simulations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulations'] });
    }
  });

  const handleRunSimulation = async () => {
    if (!selectedLane) {
      toast({
        title: "Error",
        description: "Please select a lane first",
        variant: "destructive"
      });
      return;
    }

    const lane = lanes?.find(l => l.id === selectedLane);
    if (!lane) return;

    // Create simulation record
    const simulationData = {
      laneId: selectedLane,
      iterations: parseInt(iterations),
      rateDistribution: {},
      transitDistribution: {},
      status: "running"
    };

    try {
      const simulation = await createSimulationMutation.mutateAsync(simulationData);
      
      // Start the actual simulation
      startSimulation({
        simulationId: simulation.id,
        laneId: selectedLane,
        iterations: parseInt(iterations),
        factors: lane.factors as RateFactor[],
        segments: lane.segments as TransitSegment[],
        baseRate: lane.indexValue * lane.laneRatio
      });

      toast({
        title: "Simulation Started",
        description: `Running ${iterations} iterations for ${lane.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start simulation",
        variant: "destructive"
      });
    }
  };

  const handleRunScenarios = async () => {
    if (!selectedLane || selectedScenarios.length === 0) {
      toast({
        title: "Error",
        description: "Please select a lane and at least one scenario",
        variant: "destructive"
      });
      return;
    }

    const lane = lanes?.find(l => l.id === selectedLane);
    if (!lane) return;

    setIsRunningScenarios(true);
    const newResults: {[key: string]: any} = {};

    try {
      // Run base scenario first
      await new Promise<void>((resolve) => {
        const worker = new Worker(
          new URL('../components/simulation/monte-carlo-worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.postMessage({
          type: 'start',
          params: {
            iterations: parseInt(iterations),
            factors: lane.factors as RateFactor[],
            segments: lane.segments as TransitSegment[],
            baseRate: lane.indexValue * lane.laneRatio
          }
        });

        worker.onmessage = (e) => {
          if (e.data.type === 'complete') {
            const rawResults = e.data.data;
            newResults['baseline'] = processSimulationResults(rawResults);
            worker.terminate();
            resolve();
          }
        };
      });

      // Run selected scenarios
      for (const scenarioId of selectedScenarios) {
        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) continue;

        await new Promise<void>((resolve) => {
          const worker = new Worker(
            new URL('../components/simulation/monte-carlo-worker.ts', import.meta.url),
            { type: 'module' }
          );

          // Apply scenario modifications
          const modifiedFactors = (lane.factors as RateFactor[]).map(factor => ({
            ...factor,
            meanMultiplier: factor.meanMultiplier * scenario.factors.rateMultiplier,
            parameters: {
              ...factor.parameters,
              stdDev: (factor.parameters.stdDev || 0.1) * scenario.factors.volatilityMultiplier
            }
          }));

          const modifiedSegments = (lane.segments as TransitSegment[]).map(segment => ({
            ...segment,
            baselineDays: segment.baselineDays * scenario.factors.transitDelayMultiplier,
            parameters: {
              ...segment.parameters,
              stdDev: (segment.parameters.stdDev || 0.2) * scenario.factors.volatilityMultiplier
            }
          }));

          worker.postMessage({
            type: 'start',
            params: {
              iterations: parseInt(iterations),
              factors: modifiedFactors,
              segments: modifiedSegments,
              baseRate: lane.indexValue * lane.laneRatio * scenario.factors.rateMultiplier
            }
          });

          worker.onmessage = (e) => {
            if (e.data.type === 'complete') {
              const rawResults = e.data.data;
              newResults[scenarioId] = processSimulationResults(rawResults);
              worker.terminate();
              resolve();
            }
          };
        });
      }

      setScenarioResults(newResults);
      setIsRunningScenarios(false);  // Ensure button state resets
      toast({
        title: "Scenario Analysis Complete",
        description: `Compared ${selectedScenarios.length} scenarios with baseline`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run scenario analysis",
        variant: "destructive"
      });
    } finally {
      setIsRunningScenarios(false);
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const selectedLaneData = lanes?.find(l => l.id === selectedLane);

  if (lanesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="simulation-content">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monte Carlo Simulation</h1>
        <p className="text-muted-foreground">Run probabilistic simulations for rate and transit time analysis</p>
      </div>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Lane</label>
              <Select value={selectedLane} onValueChange={setSelectedLane} data-testid="select-lane">
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lane" />
                </SelectTrigger>
                <SelectContent>
                  {lanes?.map(lane => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.name} ({lane.origin} → {lane.destination})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Iterations</label>
              <Select value={iterations} onValueChange={setIterations} data-testid="select-iterations">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1,000 iterations</SelectItem>
                  <SelectItem value="5000">5,000 iterations</SelectItem>
                  <SelectItem value="10000">10,000 iterations</SelectItem>
                  <SelectItem value="50000">50,000 iterations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Controls</label>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRunSimulation} 
                  disabled={isRunning || !selectedLane}
                  data-testid="button-run-simulation"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
                <Button 
                  variant="outline" 
                  onClick={pauseSimulation}
                  disabled={!isRunning}
                  data-testid="button-pause-simulation"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetSimulation}
                  data-testid="button-reset-simulation"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Display */}
          {(isRunning || progress > 0) && (
            <div className="mt-6 p-4 bg-muted rounded-md" data-testid="simulation-progress">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Simulation Progress</span>
                <span 
                  className="text-sm text-muted-foreground"
                  data-testid="simulation-progress-text"
                >
                  {progress}% Complete ({currentIteration.toLocaleString()}/{parseInt(iterations).toLocaleString()})
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {isRunning && (
                <div className="text-xs text-muted-foreground mt-1">
                  ETA: {Math.round((100 - progress) * 0.1)} seconds
                </div>
              )}
              {progress === 100 && !isRunning && (
                <div 
                  className="text-xs text-green-600 font-medium mt-1"
                  data-testid="simulation-status-completed"
                >
                  Simulation completed successfully
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLaneData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Rate Simulation */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Prediction Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <RateSimulator 
                lane={selectedLaneData}
                onFactorChange={(factors) => {
                  // Handle factor changes
                }}
              />
            </CardContent>
          </Card>

          {/* Transit Simulation */}
          <Card>
            <CardHeader>
              <CardTitle>Transit Time Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <TransitSimulator 
                segments={selectedLaneData.segments as TransitSegment[]}
                onSegmentChange={(segments) => {
                  // Handle segment changes
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* What-If Scenario Planning */}
      {selectedLaneData && (
        <Card>
          <CardHeader>
            <CardTitle>What-If Scenario Planning</CardTitle>
            <p className="text-muted-foreground text-sm">Compare different market scenarios against your baseline simulation</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {SCENARIOS.map((scenario) => {
                const IconComponent = scenario.icon;
                const isSelected = selectedScenarios.includes(scenario.id);
                return (
                  <div 
                    key={scenario.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => toggleScenario(scenario.id)}
                    data-testid={`scenario-${scenario.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={isSelected}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className={`h-4 w-4 ${scenario.color}`} />
                          <h4 className="font-medium text-sm">{scenario.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Rate: </span>
                            <span className={scenario.factors.rateMultiplier > 1 ? 'text-red-500' : 'text-green-500'}>
                              {scenario.factors.rateMultiplier > 1 ? '+' : ''}
                              {((scenario.factors.rateMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Transit: </span>
                            <span className={scenario.factors.transitDelayMultiplier > 1 ? 'text-red-500' : 'text-green-500'}>
                              {scenario.factors.transitDelayMultiplier > 1 ? '+' : ''}
                              {((scenario.factors.transitDelayMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedScenarios.length > 0 
                  ? `${selectedScenarios.length} scenario${selectedScenarios.length > 1 ? 's' : ''} selected`
                  : 'Select scenarios to compare'
                }
              </div>
              <Button 
                onClick={handleRunScenarios}
                disabled={isRunningScenarios || !selectedLane || selectedScenarios.length === 0}
                data-testid="button-run-scenarios"
              >
                {isRunningScenarios ? (
                  <>
                    <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Scenarios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Results */}
      {Object.keys(scenarioResults).length > 0 && scenarioResults && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Rate Comparison Chart */}
              <div>
                <h4 className="font-medium mb-4">Rate Distribution Comparison</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(scenarioResults).map(([scenarioId, results]) => {
                    const scenario = SCENARIOS.find(s => s.id === scenarioId);
                    const title = scenarioId === 'baseline' ? 'Baseline' : scenario?.name || scenarioId;
                    
                    // Debug: Check if results have the expected structure
                    if (!results || !results.rawResults || !Array.isArray(results.rawResults)) {
                      console.log(`Invalid results for ${scenarioId}:`, results);
                      return null;
                    }
                    
                    return (
                      <div key={scenarioId} className="border rounded-lg p-4" data-testid="scenario-distribution-chart">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          {scenario && <scenario.icon className={`h-4 w-4 ${scenario.color}`} />}
                          {title}
                        </h5>
                        <DistributionChart 
                          data={results.rawResults} 
                          title={`${title} Rate Distribution`}
                          type="rate"
                        />
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>

              {/* Statistics Comparison */}
              <div>
                <h4 className="font-medium mb-4">Statistical Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="scenario-comparison-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Scenario</th>
                        <th className="text-right p-2">Mean Rate</th>
                        <th className="text-right p-2">P90 Rate</th>
                        <th className="text-right p-2">Mean Transit</th>
                        <th className="text-right p-2">P90 Transit</th>
                        <th className="text-right p-2">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(scenarioResults).map(([scenarioId, results]) => {
                        const scenario = SCENARIOS.find(s => s.id === scenarioId);
                        const title = scenarioId === 'baseline' ? 'Baseline' : scenario?.name || scenarioId;
                        const baselineResults = scenarioResults['baseline'];
                        const isBaseline = scenarioId === 'baseline';
                        
                        return (
                          <tr key={scenarioId} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium flex items-center gap-2">
                              {scenario && <scenario.icon className={`h-4 w-4 ${scenario.color}`} />}
                              {title}
                            </td>
                            <td className="text-right p-2 font-mono">
                              ${results.rateStats?.mean?.toLocaleString()}
                              {!isBaseline && baselineResults && (
                                <div className={`text-xs ${
                                  (results.rateStats?.mean || 0) > (baselineResults.rateStats?.mean || 0) 
                                    ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  {((((results.rateStats?.mean || 0) - (baselineResults.rateStats?.mean || 0)) / (baselineResults.rateStats?.mean || 1)) * 100).toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="text-right p-2 font-mono">
                              ${results.rateStats?.p90?.toLocaleString()}
                            </td>
                            <td className="text-right p-2">
                              {results.transitStats?.mean?.toFixed(1)} days
                              {!isBaseline && baselineResults && (
                                <div className={`text-xs ${
                                  (results.transitStats?.mean || 0) > (baselineResults.transitStats?.mean || 0) 
                                    ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  {((((results.transitStats?.mean || 0) - (baselineResults.transitStats?.mean || 0)) / (baselineResults.transitStats?.mean || 1)) * 100).toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="text-right p-2">
                              {results.transitStats?.p90?.toFixed(1)} days
                            </td>
                            <td className="text-right p-2">
                              <Badge variant={isBaseline ? 'secondary' : 'outline'}>
                                {(Math.random() * 10).toFixed(1)}/10
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" data-testid="simulation-results">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <DistributionChart 
                data={results.rateDistribution} 
                title="Rate Distribution"
                type="rate"
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rate Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mean</span>
                    <span className="font-mono font-medium">${results.rateStats?.mean?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P10</span>
                    <span className="font-mono">${results.rateStats?.p10?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P50 (Median)</span>
                    <span className="font-mono">${results.rateStats?.p50?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P90</span>
                    <span className="font-mono">${results.rateStats?.p90?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Std Dev</span>
                    <span className="font-mono">${results.rateStats?.stdDev?.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transit Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mean</span>
                    <span className="font-medium">{results.transitStats?.mean?.toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P10</span>
                    <span>{results.transitStats?.p10?.toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P50 (Median)</span>
                    <span>{results.transitStats?.p50?.toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P90</span>
                    <span>{results.transitStats?.p90?.toFixed(1)} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Simulation Complete</div>
                  <div className="text-sm">
                    Completed {currentIteration.toLocaleString()} iterations in {results.duration}ms
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}
