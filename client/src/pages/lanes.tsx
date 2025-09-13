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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLaneSchema, type Lane, type InsertLane, type TransitSegment, type RateFactor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

const marketIndices = [
  { value: "SCFI", label: "SCFI - Shanghai Containerized Freight Index" },
  { value: "CCFI", label: "CCFI - China Containerized Freight Index" },
  { value: "WCI", label: "WCI - World Container Index" },
  { value: "BALTIC", label: "BALTIC - Baltic Dry Index" }
];

export default function Lanes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);
  const { toast } = useToast();

  const { data: lanes, isLoading } = useQuery<Lane[]>({ 
    queryKey: ["/api/lanes"] 
  });

  const form = useForm<InsertLane>({
    resolver: zodResolver(insertLaneSchema),
    defaultValues: {
      origin: "",
      destination: "",
      name: "",
      baseIndex: "SCFI",
      indexValue: 1000,
      laneRatio: 1.0,
      historicalVolatility: 0.1,
      segments: [
        {
          name: "Port Pickup → Terminal",
          baselineDays: 2.0,
          distribution: "normal",
          parameters: { mean: 2.0, stdDev: 0.3 },
          congestionScenarios: []
        },
        {
          name: "Ocean Transit",
          baselineDays: 14.0,
          distribution: "lognormal",
          parameters: { mu: 14.0, sigma: 2.0 },
          congestionScenarios: []
        },
        {
          name: "Port Processing",
          baselineDays: 1.5,
          distribution: "exponential",
          parameters: { lambda: 0.67 },
          congestionScenarios: []
        }
      ],
      factors: [
        {
          name: "Carrier Premium",
          type: "carrierPremium",
          meanMultiplier: 1.05,
          distribution: "normal",
          parameters: { stdDev: 0.02 },
          enabled: true
        },
        {
          name: "Seasonality",
          type: "seasonality",
          meanMultiplier: 1.12,
          distribution: "triangle",
          parameters: { min: 1.08, mode: 1.12, max: 1.18 },
          enabled: true
        }
      ]
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertLane) => {
      const response = await apiRequest('POST', '/api/lanes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lanes'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Lane created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lane",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertLane> }) => {
      const response = await apiRequest('PATCH', `/api/lanes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lanes'] });
      setDialogOpen(false);
      setEditingLane(null);
      form.reset();
      toast({
        title: "Success",
        description: "Lane updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lane",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/lanes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lanes'] });
      toast({
        title: "Success",
        description: "Lane deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lane",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertLane) => {
    if (editingLane) {
      updateMutation.mutate({ id: editingLane.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (lane: Lane) => {
    setEditingLane(lane);
    form.reset({
      origin: lane.origin,
      destination: lane.destination,
      name: lane.name,
      baseIndex: lane.baseIndex,
      indexValue: lane.indexValue,
      laneRatio: lane.laneRatio,
      historicalVolatility: lane.historicalVolatility,
      segments: lane.segments as TransitSegment[],
      factors: lane.factors as RateFactor[]
    });
    setDialogOpen(true);
  };

  const getIndexColor = (code: string) => {
    switch (code) {
      case 'SCFI': return 'bg-chart-1/10 text-chart-1';
      case 'CCFI': return 'bg-chart-2/10 text-chart-2';
      case 'WCI': return 'bg-chart-3/10 text-chart-3';
      case 'BALTIC': return 'bg-chart-4/10 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="lanes-content">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lane Configuration</h1>
          <p className="text-muted-foreground">Configure shipping lanes with market index mappings and factors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lane">
              <Plus className="h-4 w-4 mr-2" />
              Add Lane
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLane ? "Edit Lane" : "Add New Lane"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin Port</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Shanghai" data-testid="input-origin" />
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
                        <FormLabel>Destination Port</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Los Angeles" data-testid="input-destination" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lane Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., SHA → LAX" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="baseIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Market Index</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-index">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {marketIndices.map(index => (
                              <SelectItem key={index.value} value={index.value}>
                                {index.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="indexValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Index Value</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-index-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="laneRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lane Ratio</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-lane-ratio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="historicalVolatility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Historical Volatility</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-volatility"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-lane"
                  >
                    {editingLane ? "Update" : "Create"} Lane
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Lanes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lane</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Index Value</TableHead>
                <TableHead>Lane Ratio</TableHead>
                <TableHead>Volatility</TableHead>
                <TableHead>Segments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lanes?.map((lane) => (
                <TableRow key={lane.id} data-testid={`row-lane-${lane.id}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lane.name}</div>
                      <div className="text-sm text-muted-foreground">{lane.origin} → {lane.destination}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getIndexColor(lane.baseIndex)}>
                      {lane.baseIndex}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{lane.indexValue.toLocaleString()}</TableCell>
                  <TableCell>{lane.laneRatio.toFixed(2)}</TableCell>
                  <TableCell>{(lane.historicalVolatility * 100).toFixed(1)}%</TableCell>
                  <TableCell>{Array.isArray(lane.segments) ? lane.segments.length : 0} segments</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(lane)}
                        data-testid={`button-edit-${lane.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteMutation.mutate(lane.id)}
                        data-testid={`button-delete-${lane.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
