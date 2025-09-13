import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SimulationResult } from "@shared/schema";
import { calculateStatistics } from "@/lib/statistics";

interface DistributionChartProps {
  data: SimulationResult[];
  title: string;
  type: 'rate' | 'transit' | 'cost';
  showStatistics?: boolean;
}

export function DistributionChart({ data, title, type, showStatistics = true }: DistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { histogram: [], statistics: null };

    const values = data.map(result => {
      switch (type) {
        case 'rate': return result.rate;
        case 'transit': return result.transitDays;
        case 'cost': return result.totalLandedCost;
        default: return result.rate;
      }
    });

    const statistics = calculateStatistics(values);
    
    // Create histogram bins
    const numBins = 30;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / numBins;
    
    const bins = Array.from({ length: numBins }, (_, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      count: 0,
      frequency: 0
    }));

    // Count values in each bin
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
      bins[binIndex].count++;
    });

    // Calculate frequencies
    bins.forEach(bin => {
      bin.frequency = bin.count / values.length;
    });

    // Format for chart
    const histogram = bins.map(bin => ({
      range: `${bin.binStart.toFixed(0)}-${bin.binEnd.toFixed(0)}`,
      value: (bin.binStart + bin.binEnd) / 2,
      count: bin.count,
      frequency: bin.frequency * 100, // Convert to percentage
      density: bin.frequency / binWidth
    }));

    return { histogram, statistics };
  }, [data, type]);

  const getValueFormatter = () => {
    switch (type) {
      case 'rate':
      case 'cost':
        return (value: number) => `$${value.toLocaleString()}`;
      case 'transit':
        return (value: number) => `${value.toFixed(1)} days`;
      default:
        return (value: number) => value.toFixed(2);
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'rate':
      case 'cost':
        return '$';
      case 'transit':
        return 'days';
      default:
        return '';
    }
  };

  const formatValue = getValueFormatter();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No simulation data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="distribution-chart">
      {showStatistics && chartData.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Mean</p>
            <p className="text-sm font-semibold">{formatValue(chartData.statistics.mean)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">P10</p>
            <p className="text-sm font-semibold">{formatValue(chartData.statistics.p10)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">P50</p>
            <p className="text-sm font-semibold">{formatValue(chartData.statistics.p50)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">P90</p>
            <p className="text-sm font-semibold">{formatValue(chartData.statistics.p90)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Std Dev</p>
            <p className="text-sm font-semibold">{formatValue(chartData.statistics.stdDev)}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title} Distribution</CardTitle>
            <Badge variant="outline">
              {data.length.toLocaleString()} samples
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.histogram} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value.toFixed(2)}%`,
                  'Frequency'
                ]}
                labelFormatter={(label) => `Range: ${label}${getUnit()}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="frequency" 
                fill="hsl(var(--primary))" 
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Percentile Lines Chart */}
      {chartData.statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Percentile Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart 
                data={[
                  { percentile: 10, value: chartData.statistics.p10 },
                  { percentile: 25, value: chartData.statistics.p25 },
                  { percentile: 50, value: chartData.statistics.p50 },
                  { percentile: 75, value: chartData.statistics.p75 },
                  { percentile: 90, value: chartData.statistics.p90 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="percentile" 
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Percentile', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => formatValue(value)}
                />
                <Tooltip 
                  formatter={(value: any) => [formatValue(value), 'Value']}
                  labelFormatter={(label) => `${label}th Percentile`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
