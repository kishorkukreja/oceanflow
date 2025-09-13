export interface Statistics {
  mean: number;
  median: number;
  mode: number | null;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  skewness: number;
  kurtosis: number;
  count: number;
}

export function calculateStatistics(data: number[]): Statistics {
  if (data.length === 0) {
    throw new Error("Cannot calculate statistics for empty dataset");
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = data.length;

  // Basic measures
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Median (P50)
  const median = percentile(sorted, 50);

  // Mode (most frequent value)
  const mode = calculateMode(data);

  // Variance and Standard Deviation
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Percentiles
  const p5 = percentile(sorted, 5);
  const p10 = percentile(sorted, 10);
  const p25 = percentile(sorted, 25);
  const p50 = median;
  const p75 = percentile(sorted, 75);
  const p90 = percentile(sorted, 90);
  const p95 = percentile(sorted, 95);

  // Skewness (measure of asymmetry)
  const skewness = calculateSkewness(data, mean, stdDev);

  // Kurtosis (measure of tail heaviness)
  const kurtosis = calculateKurtosis(data, mean, stdDev);

  return {
    mean,
    median,
    mode,
    stdDev,
    variance,
    min,
    max,
    range,
    p5,
    p10,
    p25,
    p50,
    p75,
    p90,
    p95,
    skewness,
    kurtosis,
    count: n
  };
}

function percentile(sortedData: number[], p: number): number {
  if (p < 0 || p > 100) {
    throw new Error("Percentile must be between 0 and 100");
  }

  const n = sortedData.length;
  if (n === 0) return 0;
  if (n === 1) return sortedData[0];

  const index = (p / 100) * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedData[lower];
  }

  const weight = index - lower;
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

function calculateMode(data: number[]): number | null {
  const frequency = new Map<number, number>();
  
  data.forEach(value => {
    frequency.set(value, (frequency.get(value) || 0) + 1);
  });

  let maxFreq = 0;
  let mode = null;

  frequency.forEach((freq, value) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = value;
    }
  });

  // Only return mode if it appears more than once
  return maxFreq > 1 ? mode : null;
}

function calculateSkewness(data: number[], mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;

  const n = data.length;
  const sum = data.reduce((acc, val) => {
    return acc + Math.pow((val - mean) / stdDev, 3);
  }, 0);

  return (n / ((n - 1) * (n - 2))) * sum;
}

function calculateKurtosis(data: number[], mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;

  const n = data.length;
  const sum = data.reduce((acc, val) => {
    return acc + Math.pow((val - mean) / stdDev, 4);
  }, 0);

  const numerator = n * (n + 1) * sum;
  const denominator = (n - 1) * (n - 2) * (n - 3);
  const adjustment = 3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3));

  return (numerator / denominator) - adjustment;
}

export function generateHistogram(data: number[], bins: number = 30): Array<{
  binStart: number;
  binEnd: number;
  count: number;
  frequency: number;
  density: number;
}> {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  const histogram = Array.from({ length: bins }, (_, i) => ({
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
    count: 0,
    frequency: 0,
    density: 0
  }));

  // Count values in each bin
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex].count++;
  });

  // Calculate frequency and density
  histogram.forEach(bin => {
    bin.frequency = bin.count / data.length;
    bin.density = bin.frequency / binWidth;
  });

  return histogram;
}

export function calculatePercentileRank(value: number, data: number[]): number {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  
  if (n === 0) return 0;
  
  const index = sorted.findIndex(v => v >= value);
  if (index === -1) return 100;
  
  return (index / n) * 100;
}

export function calculateConfidenceInterval(
  data: number[], 
  confidenceLevel: number = 0.95
): { lower: number; upper: number; margin: number } {
  const stats = calculateStatistics(data);
  const alpha = 1 - confidenceLevel;
  
  // For large samples (n > 30), use normal distribution
  // For smaller samples, this is an approximation
  const zScore = getZScore(1 - alpha / 2);
  const standardError = stats.stdDev / Math.sqrt(data.length);
  const margin = zScore * standardError;
  
  return {
    lower: stats.mean - margin,
    upper: stats.mean + margin,
    margin
  };
}

function getZScore(probability: number): number {
  // Approximation of inverse normal CDF for common confidence levels
  const lookup: Record<number, number> = {
    0.975: 1.96,  // 95% confidence
    0.995: 2.576, // 99% confidence
    0.90: 1.28,   // 80% confidence
    0.95: 1.645   // 90% confidence
  };
  
  return lookup[probability] || 1.96; // Default to 95%
}

export function detectOutliers(data: number[]): {
  outliers: number[];
  lowerBound: number;
  upperBound: number;
  method: string;
} {
  const stats = calculateStatistics(data);
  const iqr = stats.p75 - stats.p25;
  
  // IQR method
  const lowerBound = stats.p25 - 1.5 * iqr;
  const upperBound = stats.p75 + 1.5 * iqr;
  
  const outliers = data.filter(value => value < lowerBound || value > upperBound);
  
  return {
    outliers,
    lowerBound,
    upperBound,
    method: 'IQR'
  };
}

export function rollingStatistics(data: number[], windowSize: number): Statistics[] {
  const results: Statistics[] = [];
  
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    results.push(calculateStatistics(window));
  }
  
  return results;
}
