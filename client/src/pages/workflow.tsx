import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bot,
  FileText,
  DollarSign,
  Calendar,
  Truck,
  Target,
  Brain,
  Zap
} from "lucide-react";
import type { AutomationProcess, Shipment, VendorEvaluation, Quote } from "@shared/schema";

export default function WorkflowPage() {
  const params = useParams();
  const { toast } = useToast();
  const shipmentId = params?.shipmentId;

  // Fetch shipment details
  const { data: shipment, isLoading: shipmentLoading } = useQuery<Shipment>({
    queryKey: ['/api/shipments', shipmentId],
    enabled: !!shipmentId
  });

  // Fetch automation process
  const { data: processes } = useQuery<AutomationProcess[]>({
    queryKey: ['/api/automation-processes'],
  });

  const process = processes?.find(p => p.shipmentId === shipmentId);

  // Fetch vendor evaluations for this process
  const { data: evaluations } = useQuery<VendorEvaluation[]>({
    queryKey: ['/api/vendor-evaluations'],
  });

  const processEvaluations = evaluations?.filter(e => e.processId === process?.id) || [];

  // Fetch all quotes to match with evaluations
  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
  });

  // Generate synthetic quote data for demo
  const syntheticQuotes = [
    {
      id: "quote-1",
      vendor: "Global Maritime Solutions",
      rate: 2450,
      transitTime: "18-22 days",
      service: "FCL 20'",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      equipment: "Standard dry container",
      departure: "Weekly - Monday",
      ai_evaluation: {
        ratingScore: 87,
        fitmentFactors: {
          priceCompetitiveness: 85,
          transitTimeReliability: 90,
          carrierReputation: 88,
          equipmentAvailability: 85,
          routeOptimization: 90
        },
        strengths: ["Competitive pricing", "Reliable transit times", "Strong carrier reputation"],
        concerns: ["Limited equipment flexibility", "Fewer departure options"],
        recommendation: "ACCEPT",
        agent: "Fitment Evaluation Agent"
      }
    },
    {
      id: "quote-2", 
      vendor: "Pacific Express Logistics",
      rate: 2180,
      transitTime: "25-30 days",
      service: "FCL 20'",
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      equipment: "Standard dry container",
      departure: "Bi-weekly - Wednesday",
      ai_evaluation: {
        ratingScore: 72,
        fitmentFactors: {
          priceCompetitiveness: 95,
          transitTimeReliability: 60,
          carrierReputation: 75,
          equipmentAvailability: 70,
          routeOptimization: 65
        },
        strengths: ["Lowest price point", "Good for non-urgent shipments"],
        concerns: ["Longer transit time", "Less reliable schedule", "Limited tracking"],
        recommendation: "CONDITIONAL",
        agent: "Cost Analysis Agent"
      }
    },
    {
      id: "quote-3",
      vendor: "Premium Ocean Freight",
      rate: 2890,
      transitTime: "14-17 days", 
      service: "FCL 20'",
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      equipment: "Temperature controlled available",
      departure: "Daily",
      ai_evaluation: {
        ratingScore: 94,
        fitmentFactors: {
          priceCompetitiveness: 70,
          transitTimeReliability: 95,
          carrierReputation: 98,
          equipmentAvailability: 95,
          routeOptimization: 92
        },
        strengths: ["Fastest transit time", "Premium service", "Excellent track record", "Flexible equipment"],
        concerns: ["Higher cost", "May be over-engineered for standard cargo"],
        recommendation: "ACCEPT",
        agent: "Service Quality Agent"
      }
    }
  ];

  // Process stage configuration
  const stages = [
    { key: "quote_collection", label: "Quote Collection", icon: FileText },
    { key: "agent_evaluation", label: "AI Agent Evaluation", icon: Bot },
    { key: "decision_analysis", label: "Decision Analysis", icon: Brain },
    { key: "booking_execution", label: "Booking Execution", icon: CheckCircle },
    { key: "document_generation", label: "Documentation", icon: FileText },
    { key: "approval_pending", label: "Approval Pending", icon: Clock },
    { key: "completed", label: "Completed", icon: CheckCircle }
  ];

  const currentStageIndex = process ? stages.findIndex(s => s.key === process.currentStage) : 0;
  const progressPercent = ((currentStageIndex + 1) / stages.length) * 100;

  const advanceProcess = useMutation({
    mutationFn: async () => {
      if (!process) return;
      const nextStageIndex = Math.min(currentStageIndex + 1, stages.length - 1);
      const nextStage = stages[nextStageIndex].key;
      
      const updates = {
        currentStage: nextStage,
        processData: {
          ...(process.processData || {}),
          lastAdvanced: new Date(),
          step: nextStageIndex + 1
        }
      };

      const response = await apiRequest('PATCH', `/api/automation-processes/${process.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-processes'] });
      toast({
        title: "Process Advanced",
        description: "The automation process has been moved to the next stage"
      });
    }
  });

  if (shipmentLoading) {
    return <div className="p-6">Loading workflow...</div>;
  }

  if (!shipment || !process) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active automation process found for this shipment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const CurrentStageIcon = stages[currentStageIndex]?.icon || Clock;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-workflow-title">
            Agentic Process Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Shipment: {shipment.referenceNumber} • {shipment.origin} → {shipment.destination}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2" data-testid="text-current-stage">
            <CurrentStageIcon className="h-4 w-4" />
            {stages[currentStageIndex]?.label}
          </Badge>
          {currentStageIndex < stages.length - 1 && (
            <Button
              onClick={() => advanceProcess.mutate()}
              disabled={advanceProcess.isPending}
              data-testid="button-advance-process"
            >
              <Zap className="h-4 w-4 mr-2" />
              {advanceProcess.isPending ? "Advancing..." : "Advance Process"}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Process Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-sm">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                return (
                  <div
                    key={stage.key}
                    className={`flex flex-col items-center gap-1 ${
                      isCompleted ? "text-green-600" : isCurrent ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs text-center">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="quotes" data-testid="tab-quotes">Quote Analysis</TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents">AI Agents</TabsTrigger>
          <TabsTrigger value="decisions" data-testid="tab-decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quotes Collected</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-quotes-count">{syntheticQuotes.length}</div>
                <p className="text-xs text-muted-foreground">From {syntheticQuotes.length} vendors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-best-rate">
                  ${Math.min(...syntheticQuotes.map(q => q.rate)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Pacific Express Logistics</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fastest Transit</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-fastest-transit">14-17 days</div>
                <p className="text-xs text-muted-foreground">Premium Ocean Freight</p>
              </CardContent>
            </Card>
          </div>

          {/* Process Details */}
          <Card>
            <CardHeader>
              <CardTitle>Current Stage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {process.currentStage === "quote_collection" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Collecting quotes from approved vendors. {syntheticQuotes.length} quotes received so far.
                    </AlertDescription>
                  </Alert>
                )}

                {process.currentStage === "agent_evaluation" && (
                  <Alert>
                    <Bot className="h-4 w-4" />
                    <AlertDescription>
                      AI agents are evaluating quotes based on price, transit time, carrier reputation, and service quality.
                    </AlertDescription>
                  </Alert>
                )}

                {process.currentStage === "decision_analysis" && (
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      Decision agent is analyzing evaluations to determine the best booking or deferral strategy.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Started: {process.createdAt ? new Date(process.createdAt).toLocaleString() : 'N/A'}</p>
                  {process.processData && 
                   typeof process.processData === 'object' && 
                   'lastAdvanced' in process.processData && 
                   process.processData.lastAdvanced ? (
                    <p>Last updated: {new Date(process.processData.lastAdvanced as string).toLocaleString()}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <div className="space-y-4">
            {syntheticQuotes.map((quote) => (
              <Card key={quote.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{quote.vendor}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          quote.ai_evaluation.recommendation === "ACCEPT" ? "default" : 
                          quote.ai_evaluation.recommendation === "CONDITIONAL" ? "secondary" : "destructive"
                        }
                        data-testid={`badge-recommendation-${quote.id}`}
                      >
                        {quote.ai_evaluation.recommendation}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-rating-${quote.id}`}>
                        {quote.ai_evaluation.ratingScore}/100
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rate</p>
                      <p className="text-lg font-semibold" data-testid={`text-rate-${quote.id}`}>${quote.rate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transit Time</p>
                      <p className="font-medium" data-testid={`text-transit-${quote.id}`}>{quote.transitTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">{quote.service}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid Until</p>
                      <p className="font-medium">{quote.validUntil.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <h4 className="font-medium">AI Evaluation Factors</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(quote.ai_evaluation.fitmentFactors).map(([factor, score]) => (
                        <div key={factor} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span>{score}/100</span>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-600 mb-2">Strengths</h5>
                        <ul className="text-sm space-y-1">
                          {quote.ai_evaluation.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-amber-600 mb-2">Concerns</h5>
                        <ul className="text-sm space-y-1">
                          {quote.ai_evaluation.concerns.map((concern, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Fitment Evaluation Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Evaluates how well each quote fits the shipment requirements based on commodity, urgency, and service needs.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analysis Complete</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Evaluated: Price competitiveness, transit reliability, equipment availability
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-600" />
                  Cost Analysis Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Focuses on total landed cost optimization, including hidden fees, fuel surcharges, and potential delays.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cost Models Applied</span>
                    <Badge variant="outline" className="text-green-600">Complete</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Calculated: Total landed cost, risk-adjusted pricing, market positioning
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Service Quality Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Assesses carrier reputation, service reliability, tracking capabilities, and customer service quality.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Metrics</span>
                    <Badge variant="outline" className="text-green-600">Analyzed</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Reviewed: Carrier history, on-time performance, damage rates, support quality
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent Coordination & Consensus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    All three agents have completed their evaluations. Consensus-building process initiated to determine the best options for decision analysis.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <h4 className="font-medium text-green-600">Consensus Reached</h4>
                    <p className="text-2xl font-bold">2/3</p>
                    <p className="text-sm text-muted-foreground">Premium Ocean Freight</p>
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium text-blue-600">Conditional Recommendations</h4>
                    <p className="text-2xl font-bold">1/3</p>
                    <p className="text-sm text-muted-foreground">Pacific Express Logistics</p>
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium text-muted-foreground">Rejected Options</h4>
                    <p className="text-2xl font-bold">0/3</p>
                    <p className="text-sm text-muted-foreground">None</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Decision Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.agentDecision ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Decision made: <strong className="capitalize">{process.agentDecision}</strong>
                    </AlertDescription>
                  </Alert>

                  {process.agentDecision === "book" && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Recommended Booking</h4>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">Premium Ocean Freight</h5>
                              <p className="text-sm text-muted-foreground">Best overall fit for requirements</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">$2,890</p>
                              <p className="text-sm text-muted-foreground">14-17 days</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex gap-2 pt-4">
                        <Button className="flex-1" data-testid="button-approve-vendor">
                          Approve Vendor
                        </Button>
                        <Button variant="outline" className="flex-1" data-testid="button-integrate-otm">
                          Integrate OTM
                        </Button>
                        <Button variant="outline" className="flex-1" data-testid="button-generate-docs">
                          Generate Documentation
                        </Button>
                      </div>
                    </div>
                  )}

                  {process.agentDecision === "defer" && (
                    <div className="space-y-3">
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Market conditions suggest waiting. {process.deferReason}
                        </AlertDescription>
                      </Alert>
                      
                      <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">Deferral Cost</h5>
                              <p className="text-sm text-muted-foreground">Estimated holding cost</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-amber-600">
                                ${process.deferCost?.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">Per week</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Decision analysis in progress. The decision agent is evaluating all quotes and agent recommendations.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4">
                <h4 className="font-medium mb-3">Decision Factors</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Urgency Level:</span>
                    <span className="ml-2 capitalize font-medium">{shipment.urgency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Required Delivery:</span>
                    <span className="ml-2 font-medium">
                      {shipment.requiredDeliveryDate 
                        ? new Date(shipment.requiredDeliveryDate).toLocaleDateString()
                        : 'Flexible'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Market Volatility:</span>
                    <span className="ml-2 font-medium">Low</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Tolerance:</span>
                    <span className="ml-2 font-medium">Medium</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}