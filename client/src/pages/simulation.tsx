import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RateSimulator } from "@/components/simulation/rate-simulator";
import { TransitSimulator } from "@/components/simulation/transit-simulator";
import { DistributionChart } from "@/components/visualization/distribution-chart";
import { useSimulationStore } from "@/store/simulation-store";
import type { Lane, Simulation, TransitSegment, RateFactor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Info } from "lucide-react";

export default function SimulationPage() {
  const [selectedLane, setSelectedLane] = useState<string>("");
  const [iterations, setIterations] = useState("5000");
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
          {isRunning && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Simulation Progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress}% Complete ({currentIteration.toLocaleString()}/{parseInt(iterations).toLocaleString()})
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                ETA: {Math.round((100 - progress) * 0.1)} seconds
              </div>
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

      {/* Results Display */}
      {results && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
