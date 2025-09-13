import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TransitSegment, CongestionScenario } from "@shared/schema";
import { Clock, MapPin, AlertTriangle } from "lucide-react";

interface TransitSimulatorProps {
  segments: TransitSegment[];
  onSegmentChange: (segments: TransitSegment[]) => void;
}

export function TransitSimulator({ segments: initialSegments, onSegmentChange }: TransitSimulatorProps) {
  const [segments, setSegments] = useState<TransitSegment[]>(initialSegments as TransitSegment[]);

  const updateSegment = (index: number, updates: Partial<TransitSegment>) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setSegments(newSegments);
    onSegmentChange(newSegments);
  };

  const getTotalBaseline = () => {
    return segments.reduce((total, segment) => total + segment.baselineDays, 0);
  };

  const getTotalWithVariance = () => {
    return segments.reduce((total, segment) => {
      const variance = segment.distribution === 'normal' 
        ? (segment.parameters.stdDev || 0.5) 
        : segment.baselineDays * 0.2;
      return total + segment.baselineDays + variance;
    }, 0);
  };

  const getDistributionLabel = (distribution: string) => {
    switch (distribution) {
      case 'normal': return 'Normal';
      case 'lognormal': return 'Log-Normal';
      case 'exponential': return 'Exponential';
      default: return distribution;
    }
  };

  const getRiskLevel = (variance: number, baseline: number) => {
    const ratio = variance / baseline;
    if (ratio < 0.1) return { level: 'Low', color: 'bg-green-500' };
    if (ratio < 0.3) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'High', color: 'bg-red-500' };
  };

  // Mock congestion scenarios for demonstration
  const congestionScenarios: CongestionScenario[] = [
    {
      name: "Normal Operations",
      probability: 70,
      delayPattern: [0, 0, 0, 0, 0],
      description: "Standard port operations with minimal delays"
    },
    {
      name: "Gradual Congestion",
      probability: 20,
      delayPattern: [1, 3, 5, 3, 1],
      description: "Progressive delays building over 2-3 weeks"
    },
    {
      name: "Major Disruption",
      probability: 10,
      delayPattern: [10, 8, 6, 4, 2],
      description: "Significant delays due to weather or strikes"
    }
  ];

  return (
    <div className="space-y-4" data-testid="transit-simulator">
      {/* Total Transit Summary */}
      <Card className="bg-primary/5 border-primary/20" data-testid="transit-total-summary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Total Transit Time</p>
                <p className="text-xs text-muted-foreground">{segments.length} segments configured</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                {getTotalBaseline().toFixed(1)} days
              </p>
              <p className="text-xs text-muted-foreground">
                P90: {getTotalWithVariance().toFixed(1)} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transit Segments */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">Transit Segments</h4>

        {segments.map((segment, index) => {
          const variance = segment.distribution === 'normal' 
            ? (segment.parameters.stdDev || 0.5) 
            : segment.baselineDays * 0.2;
          const risk = getRiskLevel(variance, segment.baselineDays);

          return (
            <Card key={index} className="border-border" data-testid={`transit-segment-card-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{segment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDistributionLabel(segment.distribution)} distribution
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {segment.baselineDays.toFixed(1)} days
                    </p>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 ${risk.color} rounded-full`}></div>
                      <span className="text-xs text-muted-foreground">{risk.level} risk</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Baseline Days Slider */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Baseline Days</Label>
                    <Slider
                      value={[segment.baselineDays]}
                      onValueChange={([value]) => updateSegment(index, { baselineDays: value })}
                      min={0.1}
                      max={30}
                      step={0.1}
                      className="w-full"
                      data-testid={`slider-baseline-${index}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1</span>
                      <span>{segment.baselineDays.toFixed(1)} days</span>
                      <span>30</span>
                    </div>
                  </div>

                  {/* Distribution Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Distribution Type</Label>
                    <Select
                      value={segment.distribution}
                      onValueChange={(value) => updateSegment(index, { distribution: value as any })}
                    >
                      <SelectTrigger className="h-8" data-testid={`select-distribution-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="lognormal">Log-Normal</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Distribution Parameters */}
                  {segment.distribution === 'normal' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Standard Deviation (days)</Label>
                      <Slider
                        value={[segment.parameters.stdDev || 0.5]}
                        onValueChange={([value]) => updateSegment(index, { 
                          parameters: { ...segment.parameters, stdDev: value }
                        })}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        className="w-full"
                        data-testid={`slider-stddev-${index}`}
                      />
                      <div className="text-xs text-muted-foreground">
                        σ = {(segment.parameters.stdDev || 0.5).toFixed(1)} days
                      </div>
                    </div>
                  )}

                  {segment.distribution === 'lognormal' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Shape Parameter (σ)</Label>
                      <Slider
                        value={[segment.parameters.sigma || 0.2]}
                        onValueChange={([value]) => updateSegment(index, { 
                          parameters: { ...segment.parameters, sigma: value }
                        })}
                        min={0.05}
                        max={1.0}
                        step={0.05}
                        className="w-full"
                        data-testid={`slider-sigma-${index}`}
                      />
                      <div className="text-xs text-muted-foreground">
                        σ = {(segment.parameters.sigma || 0.2).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {(segment.distribution as string) === 'exponential' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Rate Parameter (λ)</Label>
                      <Slider
                        value={[segment.parameters.lambda || 1.0]}
                        onValueChange={([value]) => updateSegment(index, { 
                          parameters: { ...segment.parameters, lambda: value }
                        })}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        className="w-full"
                        data-testid={`slider-lambda-${index}`}
                      />
                      <div className="text-xs text-muted-foreground">
                        λ = {(segment.parameters.lambda || 1.0).toFixed(1)}
                      </div>
                    </div>
                  )}

                  {/* Variance Indicator */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Expected Range</span>
                      <span className="font-medium">
                        {(segment.baselineDays - variance).toFixed(1)} - {(segment.baselineDays + variance * 2).toFixed(1)} days
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Congestion Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Congestion Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {congestionScenarios.map((scenario, index) => (
              <div key={index} className="p-3 border border-border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{scenario.name}</span>
                  <span className={`text-sm ${
                    scenario.probability >= 50 ? 'text-blue-600' : 
                    scenario.probability >= 20 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {scenario.probability}% probability
                  </span>
                </div>
                <Progress 
                  value={scenario.probability} 
                  className="h-2 mb-2" 
                />
                <p className="text-xs text-muted-foreground">{scenario.description}</p>
                {scenario.delayPattern.some(delay => delay > 0) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Max delays: {Math.max(...scenario.delayPattern)} days
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5-Week Outlook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">5-Week Outlook</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted/20 rounded-md flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Delay probability calendar</p>
              <p className="text-xs text-muted-foreground">Visual heat map would be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
