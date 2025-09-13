import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuoteAnalyzer } from "@/components/decision/quote-analyzer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuoteSchema, type Quote, type Lane, type InsertQuote } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const carriers = [
  "Maersk Line",
  "MSC Mediterranean Shipping Company",
  "COSCO Shipping Lines",
  "CMA CGM",
  "Hapag-Lloyd",
  "ONE (Ocean Network Express)",
  "Evergreen Line",
  "Yang Ming Marine Transport"
];

export default function Quotes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const { toast } = useToast();

  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({ 
    queryKey: ["/api/quotes"] 
  });

  const { data: lanes } = useQuery<Lane[]>({ 
    queryKey: ["/api/lanes"] 
  });

  const quoteFormSchema = insertQuoteSchema.extend({
    rate: z.number().min(0.01, "Rate must be greater than 0"),
    laneId: z.string().min(1, "Please select a lane"),
    carrier: z.string().min(1, "Please select a carrier")
  });

  const form = useForm<z.infer<typeof quoteFormSchema>>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      laneId: "",
      carrier: "",
      rate: undefined as any,
      validUntil: undefined,
      evaluation: null,
      recommendation: undefined
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertQuote) => {
      const response = await apiRequest('POST', '/api/quotes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Quote added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add quote",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertQuote) => {
    createMutation.mutate(data);
  };

  const getRecommendationColor = (recommendation: string | undefined | null) => {
    switch (recommendation) {
      case 'BOOK_NOW': return 'bg-green-100 text-green-800';
      case 'WAIT': return 'bg-yellow-100 text-yellow-800';
      case 'NEGOTIATE': return 'bg-blue-100 text-blue-800';
      case 'REJECT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationText = (recommendation: string | undefined | null) => {
    switch (recommendation) {
      case 'BOOK_NOW': return 'BOOK NOW';
      case 'WAIT': return 'WAIT';
      case 'NEGOTIATE': return 'NEGOTIATE';
      case 'REJECT': return 'REJECT';
      default: return 'PENDING';
    }
  };

  const getLaneInfo = (laneId: string | null) => {
    if (!laneId || !lanes) return null;
    return lanes.find(lane => lane.id === laneId);
  };

  if (quotesLoading) {
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
    <div className="p-6 space-y-6" data-testid="quotes-content">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quote Evaluation</h1>
          <p className="text-muted-foreground">Analyze quotes against Monte Carlo simulation results</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-quote">
              <Plus className="h-4 w-4 mr-2" />
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Quote</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="laneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lane</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-lane">
                            <SelectValue placeholder="Select a lane" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lanes?.map(lane => (
                            <SelectItem key={lane.id} value={lane.id}>
                              {lane.name} ({lane.origin} → {lane.destination})
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
                  name="carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-carrier">
                            <SelectValue placeholder="Select carrier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {carriers.map(carrier => (
                            <SelectItem key={carrier} value={carrier}>
                              {carrier}
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
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0.01"
                          placeholder="Enter rate (USD)"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseFloat(value);
                            field.onChange(value === '' ? undefined : (isNaN(numValue) ? undefined : numValue));
                          }}
                          data-testid="input-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          data-testid="input-valid-until"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-quote">
                    Add Quote
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedQuote && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Quote Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteAnalyzer 
              quote={selectedQuote} 
              lane={getLaneInfo(selectedQuote.laneId)} 
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lane</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Market Position</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes?.map((quote) => {
                  const lane = getLaneInfo(quote.laneId);
                  const evaluation = quote.evaluation as any;
                  return (
                    <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                      <TableCell>
                        {lane ? (
                          <div>
                            <div className="font-medium">{lane.name}</div>
                            <div className="text-sm text-muted-foreground">{lane.origin} → {lane.destination}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown Lane</span>
                        )}
                      </TableCell>
                      <TableCell>{quote.carrier}</TableCell>
                      <TableCell className="font-mono">${quote.rate.toLocaleString()}</TableCell>
                      <TableCell>
                        {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'No expiry'}
                      </TableCell>
                      <TableCell>
                        {evaluation ? (
                          <div className="flex items-center gap-2">
                            {evaluation.marketVariance > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-green-600" />
                            )}
                            <span className={evaluation.marketVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                              {evaluation.marketVariance > 0 ? '+' : ''}{(evaluation.marketVariance * 100).toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRecommendationColor(quote.recommendation)}>
                          {getRecommendationText(quote.recommendation)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedQuote(quote)}
                          data-testid={`button-analyze-${quote.id}`}
                        >
                          Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {quotes?.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No quotes available</h3>
              <p className="text-muted-foreground mb-4">Add your first quote to start the evaluation process</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
