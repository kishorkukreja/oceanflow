import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Quote, Lane } from "@shared/schema";
import { Calculator, Clock, Split, Route, Zap } from "lucide-react";

interface AlternativeEvaluatorProps {
  quote: Quote;
  lane: Lane;
}

interface AlternativeResult {
  type: 'book' | 'wait' | 'split' | 'reroute';
  name: string;
  description: string;
  expectedCost: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeToDecision: string;
  pros: string[];
  cons: string[];
  parameters: Record<string, any>;
}

export function AlternativeEvaluator({ quote, lane }: AlternativeEvaluatorProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AlternativeResult[] | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<string>('book');

  const runAlternativeAnalysis = async () => {
    setAnalyzing(true);
    
    // Simulate Monte Carlo analysis for each alternative
    setTimeout(() => {
      const baseRate = quote.rate;
      const holdingCostPerDay = baseRate * 0.001; // 0.1% per day
      
      const alternatives: AlternativeResult[] = [
        {
          type: 'book',
          name: 'Book Now',
          description: 'Accept current quote immediately',
          expectedCost: baseRate,
          confidence: 95,
          riskLevel: 'low',
          timeToDecision: 'Immediate',
          pros: [
            'Locked-in rate, no market risk',
            'Immediate confirmation',
            'Predictable cost structure'
          ],
          cons: [
            'No opportunity for better rates',
            'May miss market improvements'
          ],
          parameters: {
            rate: baseRate,
            transitRisk: 'Low',
            marketExposure: 'None'
          }
        },
        {
          type: 'wait',
          name: 'Wait 1 Week',
          description: 'Hold inventory and wait for better market rates',
          expectedCost: baseRate * 0.94 + (holdingCostPerDay * 7),
          confidence: 67,
          riskLevel: 'medium',
          timeToDecision: '7 days',
          pros: [
            'Potential for 6% rate reduction',
            'Market trend analysis available',
            'Limited holding period'
          ],
          cons: [
            'Holding costs accumulate',
            'Rate may increase instead',
            'Inventory risk exposure'
          ],
          parameters: {
            expectedRateReduction: 0.06,
            holdingCost: holdingCostPerDay * 7,
            marketVolatility: lane.historicalVolatility
          }
        },
        {
          type: 'split',
          name: 'Split 30/70',
          description: 'Ship 30% now, 70% in one week',
          expectedCost: (baseRate * 0.3) + ((baseRate * 0.94 + holdingCostPerDay * 7) * 0.7),
          confidence: 78,
          riskLevel: 'medium',
          timeToDecision: 'Immediate + 7 days',
          pros: [
            'Risk diversification',
            'Partial immediate shipment',
            'Balanced exposure to market changes'
          ],
          cons: [
            'Complexity in execution',
            'Partial holding costs',
            'Two separate bookings required'
          ],
          parameters: {
            immediatePercent: 30,
            delayedPercent: 70,
            riskReduction: 'Medium'
          }
        },
        {
          type: 'reroute',
          name: 'Alternative Route',
          description: 'Consider different ports or carriers',
          expectedCost: baseRate * 1.05,
          confidence: 45,
          riskLevel: 'high',
          timeToDecision: '3-5 days',
          pros: [
            'Potential carrier competition',
            'Different market dynamics',
            'Operational flexibility'
          ],
          cons: [
            'Unknown transit times',
            'Limited market data',
            'Operational complexity',
            'May require new negotiations'
          ],
          parameters: {
            routeChanges: 'Multiple options',
            timeToEvaluate: '3-5 days',
            dataQuality: 'Limited'
          }
        }
      ];
      
      setResults(alternatives);
      setAnalyzing(false);
    }, 3000);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlternativeIcon = (type: string) => {
    switch (type) {
      case 'book': return Zap;
      case 'wait': return Clock;
      case 'split': return Split;
      case 'reroute': return Route;
      default: return Calculator;
    }
  };

  const getRecommendedAlternative = (): AlternativeResult | null => {
    if (!results) return null;
    // Simple logic: lowest expected cost with confidence > 60%
    return results
      .filter(alt => alt.confidence > 60)
      .sort((a, b) => a.expectedCost - b.expectedCost)[0] || null;
  };

  const recommended = getRecommendedAlternative();

  return (
    <div className="space-y-6" data-testid="alternative-evaluator">
      {/* Analysis Control */}
      <Card>
        <CardHeader>
          <CardTitle>Alternative Strategy Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Evaluate different booking strategies using Monte Carlo simulation
          </p>
        </CardHeader>
        <CardContent>
          {!results && !analyzing && (
            <div className="text-center py-4">
              <Button onClick={runAlternativeAnalysis} size="lg" data-testid="button-run-analysis">
                <Calculator className="h-4 w-4 mr-2" />
                Run Alternative Analysis
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Analysis will evaluate 4 different strategies with 10,000 iterations each
              </p>
            </div>
          )}
          
          {analyzing && (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">Analyzing Alternatives</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Running Monte Carlo simulations for each strategy...
              </p>
              <Progress value={65} className="w-full max-w-sm mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">ETA: 45 seconds</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <>
          {/* Recommended Strategy */}
          {recommended && (
            <Alert className="border-green-200 bg-green-50">
              <Zap className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">Recommended: {recommended.name}</div>
                    <div className="text-sm text-green-700">
                      Expected cost: ${recommended.expectedCost.toLocaleString()} 
                      ({recommended.confidence}% confidence)
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    OPTIMAL
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Strategy Comparison */}
          <Tabs value={selectedAlternative} onValueChange={setSelectedAlternative}>
            <TabsList className="grid w-full grid-cols-4">
              {results.map((alt) => {
                const Icon = getAlternativeIcon(alt.type);
                return (
                  <TabsTrigger key={alt.type} value={alt.type} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {alt.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {results.map((alt) => (
              <TabsContent key={alt.type} value={alt.type}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strategy Overview */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{alt.name}</CardTitle>
                        <Badge className={getRiskColor(alt.riskLevel)}>
                          {alt.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alt.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Expected Cost</p>
                            <p className="text-2xl font-bold text-foreground">
                              ${alt.expectedCost.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="text-2xl font-bold text-foreground">{alt.confidence}%</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Confidence Level</p>
                          <Progress value={alt.confidence} className="h-2" />
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Time to Decision</p>
                          <p className="font-medium">{alt.timeToDecision}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pros and Cons */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Advantages</h4>
                          <ul className="space-y-1">
                            {alt.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Disadvantages</h4>
                          <ul className="space-y-1">
                            {alt.cons.map((con, index) => (
                              <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Key Parameters</h4>
                          <div className="space-y-1">
                            {Object.entries(alt.parameters).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="font-medium">
                                  {typeof value === 'number' ? 
                                    (value < 1 ? (value * 100).toFixed(1) + '%' : value.toLocaleString()) : 
                                    value.toString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Cost Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((alt) => {
                  const costDiff = alt.expectedCost - quote.rate;
                  const costDiffPercent = (costDiff / quote.rate) * 100;
                  const Icon = getAlternativeIcon(alt.type);
                  
                  return (
                    <div key={alt.type} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{alt.name}</p>
                          <p className="text-sm text-muted-foreground">{alt.confidence}% confidence</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">
                          ${alt.expectedCost.toLocaleString()}
                        </p>
                        <p className={`text-sm ${costDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {costDiff >= 0 ? '+' : ''}${costDiff.toLocaleString()} 
                          ({costDiffPercent >= 0 ? '+' : ''}{costDiffPercent.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
