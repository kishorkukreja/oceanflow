import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Clock, 
  Bot, 
  Brain, 
  CheckCircle, 
  FileText,
  TrendingUp,
  Eye
} from "lucide-react";
import type { AutomationProcess, Shipment } from "@shared/schema";

export default function OpenShipmentsPage() {
  // Fetch all shipments and automation processes
  const { data: shipments, isLoading: shipmentsLoading } = useQuery<Shipment[]>({
    queryKey: ['/api/shipments'],
  });

  const { data: processes, isLoading: processesLoading } = useQuery<AutomationProcess[]>({
    queryKey: ['/api/automation-processes'],
  });

  // Filter for shipments that have active automation processes
  const openShipments = shipments?.filter(shipment => 
    shipment.status !== 'pending_quotes' && 
    shipment.status !== 'completed' &&
    processes?.some(p => p.shipmentId === shipment.id)
  ) || [];

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'quote_collection': return FileText;
      case 'agent_evaluation': return Bot;
      case 'decision_analysis': return Brain;
      case 'booking_execution': return CheckCircle;
      case 'document_generation': return FileText;
      case 'approval_pending': return Clock;
      default: return Package;
    }
  };

  const getStageProgress = (stage: string): number => {
    const stages = ['quote_collection', 'agent_evaluation', 'decision_analysis', 'booking_execution', 'document_generation', 'approval_pending', 'completed'];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
  };

  const getStageName = (stage: string): string => {
    return stage.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'evaluating': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'decision_pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'booked': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'deferred': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'released': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (shipmentsLoading || processesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading open shipments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-open-shipments-title">
            Open Shipments
          </h1>
          <p className="text-muted-foreground mt-1">
            Shipments currently in automation processes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {openShipments.length} Active
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Open</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-open">
              {openShipments.length}
            </div>
            <p className="text-xs text-muted-foreground">Active shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluating</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-evaluating">
              {openShipments.filter(s => s.status === 'evaluating').length}
            </div>
            <p className="text-xs text-muted-foreground">AI evaluation in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decision Pending</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-decision-pending">
              {openShipments.filter(s => s.status === 'decision_pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booked</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-booked">
              {openShipments.filter(s => s.status === 'booked').length}
            </div>
            <p className="text-xs text-muted-foreground">Confirmed bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Active Automation Processes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openShipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Open Shipments</h3>
              <p className="text-muted-foreground">
                All shipments are either pending or completed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openShipments.map((shipment) => {
                    const process = processes?.find(p => p.shipmentId === shipment.id);
                    const StageIcon = process ? getStageIcon(process.currentStage) : Package;
                    const progress = process ? getStageProgress(process.currentStage) : 0;

                    return (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium" data-testid={`text-reference-${shipment.id}`}>
                          {shipment.referenceNumber}
                        </TableCell>
                        <TableCell data-testid={`text-route-${shipment.id}`}>
                          <div className="text-sm">
                            <div className="font-medium">{shipment.origin}</div>
                            <div className="text-muted-foreground">→ {shipment.destination}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)} data-testid={`badge-status-${shipment.id}`}>
                            {shipment.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm" data-testid={`text-stage-${shipment.id}`}>
                              {process ? getStageName(process.currentStage) : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={progress} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={shipment.urgency === 'high' ? 'destructive' : shipment.urgency === 'medium' ? 'default' : 'secondary'}
                            data-testid={`badge-urgency-${shipment.id}`}
                          >
                            {shipment.urgency.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `/workflow/${shipment.id}`;
                            }}
                            data-testid={`button-view-workflow-${shipment.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}