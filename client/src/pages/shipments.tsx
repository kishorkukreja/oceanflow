import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createShipmentSchema, type Shipment, type InsertShipment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Play, Clock, CheckCircle, AlertCircle, Edit, Trash2 } from "lucide-react";

export default function Shipments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const { toast } = useToast();

  const { data: shipments, isLoading } = useQuery<Shipment[]>({ 
    queryKey: ["/api/shipments"] 
  });

  const form = useForm<InsertShipment>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      referenceNumber: "",
      origin: "",
      destination: "",
      commodity: "",
      weight: 0,
      volume: 0,
      urgency: "medium",
      requiredDeliveryDate: undefined,
      specialRequirements: undefined,
      status: "pending_quotes"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertShipment) => {
      const response = await apiRequest('POST', '/api/shipments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      setDialogOpen(false);
      setEditingShipment(null);
      form.reset();
      toast({
        title: "Success",
        description: "Shipment created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertShipment> }) => {
      const response = await apiRequest('PATCH', `/api/shipments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      setDialogOpen(false);
      setEditingShipment(null);
      form.reset();
      toast({
        title: "Success",
        description: "Shipment updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shipment",
        variant: "destructive"
      });
    }
  });

  const startAutomationMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      // First create the automation process
      const processData = {
        shipmentId: shipmentId,
        currentStage: "quote_collection",
        quotesCollected: 0,
        processData: {
          startedAt: new Date(),
          step: 1,
          totalSteps: 7
        }
      };
      const response = await apiRequest('POST', '/api/automation-processes', processData);
      return response.json();
    },
    onSuccess: async (_, shipmentId) => {
      // Update shipment status to 'evaluating' after starting process
      await updateStatusMutation.mutateAsync({ id: shipmentId, status: 'evaluating' });
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      toast({
        title: "Process Started",
        description: "Agentic process automation has been initiated for this shipment"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start automation process",
        variant: "destructive"
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest('PATCH', `/api/shipments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await apiRequest('DELETE', `/api/shipments/${shipmentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      toast({
        title: "Success",
        description: "Shipment deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete shipment",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertShipment) => {
    // Generate reference number if not provided
    if (!data.referenceNumber) {
      data.referenceNumber = `SHP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    }
    
    if (editingShipment) {
      updateMutation.mutate({ id: editingShipment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (shipment: Shipment) => {
    setEditingShipment(shipment);
    form.reset({
      referenceNumber: shipment.referenceNumber,
      origin: shipment.origin,
      destination: shipment.destination,
      commodity: shipment.commodity,
      weight: shipment.weight,
      volume: shipment.volume,
      urgency: shipment.urgency,
      requiredDeliveryDate: shipment.requiredDeliveryDate || undefined,
      specialRequirements: shipment.specialRequirements as any,
      status: shipment.status
    });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_quotes': return 'bg-blue-100 text-blue-800';
      case 'evaluating': return 'bg-yellow-100 text-yellow-800';
      case 'decision_pending': return 'bg-orange-100 text-orange-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'deferred': return 'bg-gray-100 text-gray-800';
      case 'released': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_quotes': return <Clock className="h-4 w-4" />;
      case 'evaluating': return <AlertCircle className="h-4 w-4" />;
      case 'decision_pending': return <AlertCircle className="h-4 w-4" />;
      case 'booked': return <CheckCircle className="h-4 w-4" />;
      case 'deferred': return <Clock className="h-4 w-4" />;
      case 'released': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Shipments</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading shipments...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Shipments</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-shipment">
              <Plus className="h-4 w-4 mr-2" />
              Add Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingShipment ? "Edit Shipment" : "Add New Shipment"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="SHP-2024-001 (auto-generated if empty)" 
                            {...field} 
                            data-testid="input-reference-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="commodity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commodity</FormLabel>
                        <FormControl>
                          <Input placeholder="Electronics Components" {...field} data-testid="input-commodity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="Shanghai" {...field} data-testid="input-origin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="Los Angeles" {...field} data-testid="input-destination" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="2500" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume (m³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="45.5" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-volume"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-urgency">
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requiredDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Delivery Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                          onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          data-testid="input-delivery-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requirements (JSON)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"temperature_controlled": true, "fragile_handling": true}'
                          {...field}
                          value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                          onChange={e => {
                            field.onChange(e.target.value); // Let the schema handle parsing
                          }}
                          rows={3}
                          data-testid="input-special-requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingShipment(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {(createMutation.isPending || updateMutation.isPending)
                      ? "Saving..." 
                      : editingShipment 
                        ? "Update Shipment" 
                        : "Create Shipment"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {!shipments || shipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No shipments found. Create your first shipment to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Weight/Volume</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id} data-testid={`row-shipment-${shipment.id}`}>
                      <TableCell className="font-medium" data-testid={`text-reference-${shipment.id}`}>
                        {shipment.referenceNumber}
                      </TableCell>
                      <TableCell data-testid={`text-route-${shipment.id}`}>
                        <div className="text-sm">
                          <div>{shipment.origin} →</div>
                          <div>{shipment.destination}</div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-commodity-${shipment.id}`}>
                        {shipment.commodity}
                      </TableCell>
                      <TableCell data-testid={`text-weight-volume-${shipment.id}`}>
                        <div className="text-sm">
                          <div>{shipment.weight.toLocaleString()} kg</div>
                          <div>{shipment.volume} m³</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(shipment.urgency)} data-testid={`badge-urgency-${shipment.id}`}>
                          {shipment.urgency.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shipment.status)}
                          <Badge className={getStatusColor(shipment.status)} data-testid={`badge-status-${shipment.id}`}>
                            {shipment.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-delivery-${shipment.id}`}>
                        {shipment.requiredDeliveryDate 
                          ? new Date(shipment.requiredDeliveryDate).toLocaleDateString()
                          : 'Not specified'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(shipment)}
                            data-testid={`button-edit-${shipment.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {shipment.status === 'pending_quotes' && (
                            <Button
                              size="sm"
                              onClick={() => startAutomationMutation.mutate(shipment.id)}
                              disabled={startAutomationMutation.isPending}
                              data-testid={`button-start-automation-${shipment.id}`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {shipment.status !== 'pending_quotes' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.location.href = `/workflow/${shipment.id}`;
                              }}
                              data-testid={`button-view-workflow-${shipment.id}`}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this shipment?')) {
                                deleteMutation.mutate(shipment.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${shipment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}