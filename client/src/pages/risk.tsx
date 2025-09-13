import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiskGauge } from "@/components/visualization/risk-gauge";
import type { Lane, Quote } from "@shared/schema";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Calendar } from "lucide-react";

export default function Risk() {
  const { data: lanes, isLoading: lanesLoading } = useQuery<Lane[]>({ 
    queryKey: ["/api/lanes"] 
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({ 
    queryKey: ["/api/quotes"] 
  });

  // Mock risk data - in a real app this would come from analysis
  const riskData = {
    overallScore: 6.4,
    riskLevel: "Moderate",
    factors: [
      { name: "Rate Volatility", score: 7.2, trend: "increasing", description: "Higher than historical average" },
      { name: "Transit Uncertainty", score: 5.8, trend: "stable", description: "Seasonal congestion expected" },
      { name: "Carrier Reliability", score: 4.2, trend: "improving", description: "Strong on-time performance" },
      { name: "Market Conditions", score: 8.1, trend: "increasing", description: "Peak season approaching" }
    ],
    scenarios: [
      { name: "Normal Operations", probability: 70, impact: "Low", color: "green" },
      { name: "Gradual Congestion", probability: 20, impact: "Medium", color: "yellow" },
      { name: "Major Disruption", probability: 10, impact: "High", color: "red" }
    ]
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return { bg: "bg-green-500", text: "text-green-700", label: "Low Risk" };
    if (score <= 7) return { bg: "bg-yellow-500", text: "text-yellow-700", label: "Moderate Risk" };
    return { bg: "bg-red-500", text: "text-red-700", label: "High Risk" };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing": return <TrendingUp className="h-4 w-4 text-red-600" />;
      case "decreasing": return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getScenarioColor = (color: string) => {
    switch (color) {
      case "green": return "bg-green-500";
      case "yellow": return "bg-yellow-500";
      case "red": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (lanesLoading || quotesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
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
    <div className="p-6 space-y-6" data-testid="risk-content">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Risk Analysis</h1>
        <p className="text-muted-foreground">Comprehensive risk assessment across all shipping operations</p>
      </div>

      {/* Overall Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overall Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <RiskGauge score={riskData.overallScore} />
            </div>
            
            <div className="text-center mb-4">
              <p className="font-medium text-yellow-600">{riskData.riskLevel}</p>
              <p className="text-xs text-muted-foreground">Based on rate volatility & transit uncertainty</p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Low Risk
                </span>
                <span className="text-muted-foreground">0-3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Moderate Risk
                </span>
                <span className="text-muted-foreground">4-7</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  High Risk
                </span>
                <span className="text-muted-foreground">8-10</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Factor Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {riskData.factors.map((factor, index) => {
                const riskInfo = getRiskColor(factor.score);
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(factor.trend)}
                          <span className="font-medium">{factor.name}</span>
                        </div>
                        <Badge className={`${riskInfo.bg} text-white`}>
                          {factor.score}/10
                        </Badge>
                      </div>
                      <span className={`text-sm ${riskInfo.text}`}>{riskInfo.label}</span>
                    </div>
                    <Progress value={factor.score * 10} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskData.scenarios.map((scenario, index) => (
                <div key={index} className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{scenario.name}</span>
                    <span className={`text-sm ${scenario.color === 'red' ? 'text-red-600' : scenario.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {scenario.probability}% probability
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${getScenarioColor(scenario.color)}`} 
                      style={{ width: `${scenario.probability}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Impact: {scenario.impact}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Mitigation Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="font-medium text-yellow-800 mb-1">High Rate Volatility Detected</div>
                  <div className="text-sm text-yellow-700">
                    Consider booking 30% of volume now and waiting for better rates on remaining 70%
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="font-medium text-blue-800 mb-1">Diversify Carrier Portfolio</div>
                  <div className="text-sm text-blue-700">
                    Current exposure to single carrier risk. Consider splitting volumes across 2-3 carriers.
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-green-200 bg-green-50">
                <Calendar className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-medium text-green-800 mb-1">Optimize Booking Timing</div>
                  <div className="text-sm text-green-700">
                    Based on seasonal patterns, booking 2-3 weeks ahead typically yields 8-12% better rates.
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lane-specific Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Lane Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Lane</th>
                  <th className="text-left p-2">Risk Score</th>
                  <th className="text-left p-2">Primary Risk</th>
                  <th className="text-left p-2">Mitigation Status</th>
                  <th className="text-left p-2">Next Review</th>
                </tr>
              </thead>
              <tbody>
                {lanes?.map((lane) => {
                  const riskScore = Math.random() * 10; // Mock data
                  const riskInfo = getRiskColor(riskScore);
                  return (
                    <tr key={lane.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{lane.name}</div>
                          <div className="text-sm text-muted-foreground">{lane.origin} → {lane.destination}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 ${riskInfo.bg} rounded-full`}></div>
                          <span className="font-medium">{riskScore.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-2 text-sm">Rate Volatility</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-green-700 border-green-200">
                          Active
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
