import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Ship, 
  Percent, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Play,
  Eye,
  Edit,
  Trash2,
  Calculator
} from "lucide-react";
import type { Lane, MarketIndex } from "@shared/schema";

export default function Dashboard() {
  const { data: lanes, isLoading: lanesLoading } = useQuery<Lane[]>({ 
    queryKey: ["/api/lanes"] 
  });

  const { data: indices, isLoading: indicesLoading } = useQuery<MarketIndex[]>({ 
    queryKey: ["/api/indices"] 
  });

  const getIndexColor = (code: string) => {
    switch (code) {
      case 'SCFI': return 'bg-chart-1/10 text-chart-1';
      case 'CCFI': return 'bg-chart-2/10 text-chart-2';
      case 'WCI': return 'bg-chart-3/10 text-chart-3';
      case 'BALTIC': return 'bg-chart-4/10 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (lanesLoading || indicesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-content">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Lanes</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-lanes">{lanes?.length || 0}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span>+12 this week</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Ship className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rate Variance</p>
                <p className="text-2xl font-bold text-foreground">-8.2%</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span>Better than market</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Percent className="text-accent h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-Time Performance</p>
                <p className="text-2xl font-bold text-foreground">87.3%</p>
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <span>+2.1% vs target</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="text-green-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-foreground">6.4/10</p>
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <span>Moderate risk</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-yellow-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Indices & Rate Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Market Indices</CardTitle>
              <Button variant="outline" size="sm" data-testid="button-refresh-indices">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indices?.map((index) => (
                <div key={index.code} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-chart-1 rounded-full"></div>
                    <div>
                      <p className="font-medium text-foreground">{index.name}</p>
                      <p className="text-xs text-muted-foreground">{index.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground" data-testid={`text-index-${index.code}`}>{index.value.toLocaleString()}</p>
                    <p className={`text-xs ${index.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {index.changePercent >= 0 ? '+' : ''}{index.changePercent}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Rate Prediction Factors</CardTitle>
              <Button variant="outline" size="sm" data-testid="button-configure-factors">
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Carrier Premium</span>
                  <span className="font-medium">+5.2%</span>
                </div>
                <Progress value={52} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seasonality</span>
                  <span className="font-medium">+12.8%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity Utilization</span>
                  <span className="font-medium">+8.5%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fuel Surcharge</span>
                  <span className="font-medium">+2.1%</span>
                </div>
                <Progress value={21} className="h-2" />
              </div>
            </div>
            
            <Alert className="mt-6 border-primary/20 bg-primary/5">
              <Calculator className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">Predicted Rate Range</span>
                </div>
                <div className="text-2xl font-bold text-primary">$2,180 - $2,640</div>
                <div className="text-sm text-muted-foreground">P10-P90 confidence interval</div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Lane Configuration Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Active Lanes</CardTitle>
              <p className="text-sm text-muted-foreground">Current lane configurations and performance</p>
            </div>
            <div className="flex items-center gap-3">
              <Button data-testid="button-add-lane">
                <Plus className="h-4 w-4 mr-2" />
                Add Lane
              </Button>
              <Button variant="outline" data-testid="button-simulate-all">
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lane</TableHead>
                  <TableHead>Index</TableHead>
                  <TableHead>Current Rate</TableHead>
                  <TableHead>Predicted Rate</TableHead>
                  <TableHead>Transit Time</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lanes?.map((lane) => (
                  <TableRow key={lane.id} data-testid={`row-lane-${lane.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{lane.name}</div>
                        <div className="text-sm text-muted-foreground">{lane.origin} to {lane.destination}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getIndexColor(lane.baseIndex)}>
                        {lane.baseIndex}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">$2,340</TableCell>
                    <TableCell>
                      <div className="font-mono">$2,420</div>
                      <div className="text-xs text-green-600">+3.4%</div>
                    </TableCell>
                    <TableCell>
                      <div>18-22 days</div>
                      <div className="text-xs text-muted-foreground">P50: 20 days</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${getRiskColor(6.2)} rounded-full`}></div>
                        <span className="text-sm font-medium">6.2</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-${lane.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${lane.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-${lane.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
