import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Lane, RateFactor } from "@shared/schema";
import { Settings, TrendingUp } from "lucide-react";

interface RateSimulatorProps {
  lane: Lane;
  onFactorChange: (factors: RateFactor[]) => void;
}

export function RateSimulator({ lane, onFactorChange }: RateSimulatorProps) {
  const [factors, setFactors] = useState<RateFactor[]>(lane.factors as RateFactor[]);

  const updateFactor = (index: number, updates: Partial<RateFactor>) => {
    const newFactors = [...factors];
    newFactors[index] = { ...newFactors[index], ...updates };
    setFactors(newFactors);
    onFactorChange(newFactors);
  };

  const getFactorImpact = (factor: RateFactor) => {
    if (!factor.enabled) return 0;
    return ((factor.meanMultiplier - 1) * 100);
  };

  const getTotalImpact = () => {
    return factors.reduce((total, factor) => {
      if (!factor.enabled) return total;
      return total + getFactorImpact(factor);
    }, 0);
  };

  const getDistributionLabel = (distribution: string) => {
    switch (distribution) {
      case 'normal': return 'Normal';
      case 'lognormal': return 'Log-Normal';
      case 'triangle': return 'Triangular';
      case 'exponential': return 'Exponential';
      default: return distribution;
    }
  };

  return (
    <div className="space-y-4" data-testid="rate-simulator">
      {/* Base Rate Display */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Base Rate ({lane.baseIndex})</p>
              <p className="text-xs text-muted-foreground">Index: {lane.indexValue} × Ratio: {lane.laneRatio}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">${(lane.indexValue * lane.laneRatio).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Before factors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Factors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Rate Prediction Factors</h4>
          <Badge variant="outline" className="text-primary">
            Total Impact: {getTotalImpact() > 0 ? '+' : ''}{getTotalImpact().toFixed(1)}%
          </Badge>
        </div>

        {factors.map((factor, index) => (
          <Card key={index} className={factor.enabled ? 'border-primary/20' : 'border-border'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={factor.enabled}
                    onCheckedChange={(enabled) => updateFactor(index, { enabled })}
                    data-testid={`switch-factor-${index}`}
                  />
                  <div>
                    <p className="font-medium text-foreground">{factor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDistributionLabel(factor.distribution)} distribution
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${factor.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {getFactorImpact(factor) > 0 ? '+' : ''}{getFactorImpact(factor).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Multiplier: {factor.meanMultiplier.toFixed(3)}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            {factor.enabled && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Mean Multiplier Slider */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Mean Multiplier</Label>
                    <Slider
                      value={[factor.meanMultiplier]}
                      onValueChange={([value]) => updateFactor(index, { meanMultiplier: value })}
                      min={0.5}
                      max={2.0}
                      step={0.01}
                      className="w-full"
                      data-testid={`slider-multiplier-${index}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.5x</span>
                      <span>{factor.meanMultiplier.toFixed(3)}x</span>
                      <span>2.0x</span>
                    </div>
                  </div>

                  {/* Distribution Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Distribution Type</Label>
                    <Select
                      value={factor.distribution}
                      onValueChange={(value) => updateFactor(index, { distribution: value as any })}
                    >
                      <SelectTrigger className="h-8" data-testid={`select-distribution-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="lognormal">Log-Normal</SelectItem>
                        <SelectItem value="triangle">Triangular</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Distribution Parameters */}
                  {factor.distribution === 'normal' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Standard Deviation</Label>
                      <Slider
                        value={[factor.parameters.stdDev || 0.02]}
                        onValueChange={([value]) => updateFactor(index, { 
                          parameters: { ...factor.parameters, stdDev: value }
                        })}
                        min={0.001}
                        max={0.1}
                        step={0.001}
                        className="w-full"
                        data-testid={`slider-stddev-${index}`}
                      />
                      <div className="text-xs text-muted-foreground">
                        σ = {(factor.parameters.stdDev || 0.02).toFixed(3)}
                      </div>
                    </div>
                  )}

                  {factor.distribution === 'triangle' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Slider
                          value={[factor.parameters.min || factor.meanMultiplier * 0.9]}
                          onValueChange={([value]) => updateFactor(index, { 
                            parameters: { ...factor.parameters, min: value }
                          })}
                          min={0.5}
                          max={factor.meanMultiplier}
                          step={0.01}
                          className="w-full"
                          data-testid={`slider-min-${index}`}
                        />
                        <div className="text-xs text-center text-muted-foreground">
                          {(factor.parameters.min || factor.meanMultiplier * 0.9).toFixed(2)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mode</Label>
                        <div className="h-6 flex items-center justify-center">
                          <span className="text-xs font-medium">{factor.meanMultiplier.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Slider
                          value={[factor.parameters.max || factor.meanMultiplier * 1.1]}
                          onValueChange={([value]) => updateFactor(index, { 
                            parameters: { ...factor.parameters, max: value }
                          })}
                          min={factor.meanMultiplier}
                          max={2.0}
                          step={0.01}
                          className="w-full"
                          data-testid={`slider-max-${index}`}
                        />
                        <div className="text-xs text-center text-muted-foreground">
                          {(factor.parameters.max || factor.meanMultiplier * 1.1).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Predicted Rate Summary */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">Predicted Rate</p>
                <p className="text-xs text-muted-foreground">
                  Base rate + {getTotalImpact().toFixed(1)}% factor impact
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-accent">
                ${((lane.indexValue * lane.laneRatio) * (1 + getTotalImpact() / 100)).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Expected value</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
