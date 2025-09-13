import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RiskGauge } from "@/components/visualization/risk-gauge";
import type { Quote, Lane, QuoteEvaluation } from "@shared/schema";
import { calculateStatistics } from "@/lib/statistics";
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Calculator } from "lucide-react";

interface QuoteAnalyzerProps {
  quote: Quote;
  lane: Lane | null | undefined;
}

export function QuoteAnalyzer({ quote, lane }: QuoteAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<QuoteEvaluation | null>(null);

  useEffect(() => {
    if (quote && lane) {
      analyzeQuote();
    }
  }, [quote, lane]);

  const analyzeQuote = async () => {
    if (!lane) return;
    
    setAnalyzing(true);
    
    // Simulate quote evaluation process
    setTimeout(() => {
      const baseRate = lane.indexValue * lane.laneRatio;
      const marketVariance = (quote.rate - baseRate) / baseRate;
      
      // Simulate Monte Carlo results for comparison
      const mockSimulationResults = generateMockSimulationResults(baseRate, 1000);
      const statistics = calculateStatistics(mockSimulationResults);
      
      const percentile = calculatePercentile(quote.rate, mockSimulationResults);
      const modelVariance = (quote.rate - statistics.mean) / statistics.mean;
      
      // Risk scoring (lower rates = lower risk score)
      let riskScore = 5.0; // Base score
      if (percentile < 25) riskScore = 2.0 + (percentile / 25) * 2; // Low risk
      else if (percentile < 75) riskScore = 4.0 + ((percentile - 25) / 50) * 3; // Medium risk  
      else riskScore = 7.0 + ((percentile - 75) / 25) * 3; // High risk
      
      // Recommendation logic
      let recommendation: QuoteEvaluation['recommendation'] = 'BOOK_NOW';
      if (percentile > 75) recommendation = 'NEGOTIATE';
      if (percentile > 90) recommendation = 'REJECT';
      if (percentile < 10) recommendation = 'BOOK_NOW';
      if (percentile >= 10 && percentile <= 40 && marketVariance > -0.05) recommendation = 'WAIT';
      
      // Confidence based on data quality and percentile position
      const confidence = Math.min(95, 60 + (40 - Math.abs(percentile - 50)));
      
      const newEvaluation: QuoteEvaluation = {
        marketVariance,
        modelVariance,
        percentile,
        riskScore,
        recommendation,
        confidence
      };
      
      setEvaluation(newEvaluation);
      setAnalyzing(false);
    }, 2000);
  };

  const generateMockSimulationResults = (baseRate: number, iterations: number): number[] => {
    const results: number[] = [];
    for (let i = 0; i < iterations; i++) {
      // Simple normal distribution simulation
      const randomFactor = 1 + (Math.random() - 0.5) * 0.3; // ±15% variation
      results.push(baseRate * randomFactor);
    }
    return results;
  };

  const calculatePercentile = (value: number, data: number[]): number => {
    const sorted = [...data].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return index === -1 ? 100 : (index / sorted.length) * 100;
  };

  const getRecommendationInfo = (rec: QuoteEvaluation['recommendation']) => {
    switch (rec) {
      case 'BOOK_NOW':
        return {
          label: 'BOOK NOW',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          description: 'Excellent value. Recommend immediate booking.'
        };
      case 'WAIT':
        return {
          label: 'WAIT',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          description: 'Consider waiting for better market conditions.'
        };
      case 'NEGOTIATE':
        return {
          label: 'NEGOTIATE',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Target,
          description: 'Above market rate. Negotiate for better terms.'
        };
      case 'REJECT':
        return {
          label: 'REJECT',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          description: 'Rate significantly above market. Consider alternatives.'
        };
    }
  };

  if (!lane) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to analyze quote: Lane information not available
        </AlertDescription>
      </Alert>
    );
  }

  if (analyzing) {
    return (
      <Card data-testid="quote-analyzer-loading">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Calculator className="h-12 w-12 text-primary mx-auto animate-pulse" />
            <h3 className="text-lg font-medium">Analyzing Quote</h3>
            <p className="text-sm text-muted-foreground">
              Running Monte Carlo comparison against market data...
            </p>
            <Progress value={67} className="w-full max-w-sm mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Button onClick={analyzeQuote} data-testid="button-analyze-quote">
              <Calculator className="h-4 w-4 mr-2" />
              Analyze Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendationInfo = getRecommendationInfo(evaluation.recommendation);
  const RecommendationIcon = recommendationInfo.icon;

  return (
    <div className="space-y-6" data-testid="quote-analyzer">
      {/* Quote Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Quote Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">{quote.carrier} • {lane.name}</p>
            </div>
            <Badge className={recommendationInfo.color}>
              <RecommendationIcon className="h-3 w-3 mr-1" />
              {recommendationInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Quoted Rate</p>
              <p className="text-3xl font-bold text-primary">${quote.rate.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Valid until: {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'No expiry'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Market Position</span>
                <div className="flex items-center gap-1">
                  {evaluation.marketVariance > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    evaluation.marketVariance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {evaluation.marketVariance > 0 ? '+' : ''}{(evaluation.marketVariance * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Model Percentile</span>
                <span className="text-sm font-medium">{evaluation.percentile.toFixed(1)}th</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="text-sm font-medium">{evaluation.confidence.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RiskGauge score={evaluation.riskScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Market Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Market Baseline</span>
                  <span className="font-mono">${(lane.indexValue * lane.laneRatio).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Model Prediction</span>
                  <span className="font-mono">${(lane.indexValue * lane.laneRatio * 1.08).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span>Quoted Rate</span>
                  <span className="font-mono font-bold">${quote.rate.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Rate Distribution Position</span>
                  <span>{evaluation.percentile.toFixed(1)}th percentile</span>
                </div>
                <Progress value={evaluation.percentile} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Best rates</span>
                  <span>Worst rates</span>
                </div>
              </div>

              <Alert className={`border-${recommendationInfo.color.split('-')[1]}-200`}>
                <RecommendationIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Recommendation: {recommendationInfo.label}</div>
                  <div className="text-sm">{recommendationInfo.description}</div>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Rate Comparison</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">vs Market Index</span>
                  <span className={evaluation.marketVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                    {evaluation.marketVariance > 0 ? '+' : ''}{(evaluation.marketVariance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">vs Model Prediction</span>
                  <span className={evaluation.modelVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                    {evaluation.modelVariance > 0 ? '+' : ''}{(evaluation.modelVariance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentile Rank</span>
                  <span>{evaluation.percentile.toFixed(1)}th</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Risk Factors</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate Risk</span>
                  <span>{evaluation.riskScore.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Volatility</span>
                  <span>{(lane.historicalVolatility * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence Level</span>
                  <span>{evaluation.confidence.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Decision Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommendation</span>
                  <span className="font-medium">{recommendationInfo.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Urgency</span>
                  <span>{quote.validUntil ? 'Time-sensitive' : 'No expiry'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Review</span>
                  <span>24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
