import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlternativeEvaluator } from "@/components/decision/alternative-evaluator";
import type { Quote, Lane } from "@shared/schema";
import { Calculator, CheckCircle, AlertTriangle, Scale } from "lucide-react";

export default function Alternatives() {
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({ 
    queryKey: ["/api/quotes"] 
  });

  const { data: lanes } = useQuery<Lane[]>({ 
    queryKey: ["/api/lanes"] 
  });

  const handleRunAnalysis = async () => {
    if (!selectedQuote) return;
    
    setAnalysisRunning(true);
    // Simulate analysis
    setTimeout(() => {
      setAnalysisResults({
        bookNow: {
          rate: 2180,
          transitRisk: "Low",
          expectedCost: 2245,
          confidence: 94,
          recommendation: "BOOK_NOW"
        },
        wait1Week: {
          expectedRate: 2065,
          holdingCost: 85,
          expectedCost: 2290,
          confidence: 67,
          recommendation: "MEDIUM_RISK"
        },
        split: {
          immediate: 30,
          delayed: 70,
          immediateRate: 2180,
          delayedRate: 2065,
          expectedCost: 2270,
          riskReduction: "Medium",
          recommendation: "BALANCED"
        }
      });
      setAnalysisRunning(false);
    }, 3000);
  };

  const getQuoteInfo = (quoteId: string) => {
    const quote = quotes?.find(q => q.id === quoteId);
    const lane = quote ? lanes?.find(l => l.id === quote.laneId) : null;
    return { quote, lane };
  };

  if (quotesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="alternatives-content">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Alternative Strategies</h1>
        <p className="text-muted-foreground">Compare different booking scenarios with full simulation analysis</p>
      </div>

      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Quote</label>
              <Select value={selectedQuote} onValueChange={setSelectedQuote} data-testid="select-quote">
                <SelectTrigger>
                  <SelectValue placeholder="Choose a quote to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {quotes?.map(quote => {
                    const { lane } = getQuoteInfo(quote.id);
                    return (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.carrier} - {lane?.name} - ${quote.rate.toLocaleString()}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis</label>
              <Button 
                onClick={handleRunAnalysis}
                disabled={!selectedQuote || analysisRunning}
                className="w-full"
                data-testid="button-run-analysis"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {analysisRunning ? "Analyzing..." : "Analyze Alternatives"}
              </Button>
            </div>
          </div>

          {analysisRunning && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Analysis Progress</span>
                <span className="text-sm text-muted-foreground">Running Monte Carlo simulations...</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alternative Strategies Results */}
      {analysisResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book Now Strategy */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Book Now</CardTitle>
                <Badge className="bg-green-100 text-green-800">
                  RECOMMENDED
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-mono text-foreground">${analysisResults.bookNow.rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transit Risk</span>
                  <span className="font-medium">{analysisResults.bookNow.transitRisk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Cost</span>
                  <span className="font-mono font-medium">${analysisResults.bookNow.expectedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{analysisResults.bookNow.confidence}%</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-green-200">
                <div className="flex items-center gap-2 text-xs text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Locked rate, minimal delay risk
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Wait 1 Week Strategy */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Wait 1 Week</CardTitle>
                <Badge className="bg-yellow-100 text-yellow-800">
                  MEDIUM RISK
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Rate</span>
                  <span className="font-mono text-foreground">${analysisResults.wait1Week.expectedRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holding Cost</span>
                  <span className="font-mono text-red-600">+${analysisResults.wait1Week.holdingCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Cost</span>
                  <span className="font-mono font-medium">${analysisResults.wait1Week.expectedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{analysisResults.wait1Week.confidence}%</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-xs text-yellow-700">
                  <AlertTriangle className="h-4 w-4" />
                  Rate volatility + holding costs
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Split Shipment Strategy */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Split {analysisResults.split.immediate}/{analysisResults.split.delayed}</CardTitle>
                <Badge className="bg-blue-100 text-blue-800">
                  BALANCED
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Immediate ({analysisResults.split.immediate}%)</span>
                  <span className="font-mono text-foreground">${analysisResults.split.immediateRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delayed ({analysisResults.split.delayed}%)</span>
                  <span className="font-mono text-foreground">${analysisResults.split.delayedRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Cost</span>
                  <span className="font-mono font-medium">${analysisResults.split.expectedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Reduction</span>
                  <span className="font-medium">{analysisResults.split.riskReduction}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Scale className="h-4 w-4" />
                  Hedged approach, reduced variance
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Strategy Comparison Chart */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-md flex items-center justify-center">
              <div className="text-center">
                <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">Strategy cost distributions</p>
                <p className="text-sm text-muted-foreground">Monte Carlo simulation results overlay</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Chart visualization would show overlapping probability distributions for each strategy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuote && (
        <AlternativeEvaluator 
          quote={getQuoteInfo(selectedQuote).quote!} 
          lane={getQuoteInfo(selectedQuote).lane!} 
        />
      )}
    </div>
  );
}
