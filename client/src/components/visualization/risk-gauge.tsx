import { useMemo } from "react";

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabels?: boolean;
}

export function RiskGauge({ score, size = 120, showLabels = true }: RiskGaugeProps) {
  const gaugeData = useMemo(() => {
    const normalizedScore = Math.max(0, Math.min(10, score));
    
    // Risk level and color
    let riskLevel = "Low Risk";
    let riskColor = "#10b981"; // green-500
    
    if (normalizedScore > 7) {
      riskLevel = "High Risk";
      riskColor = "#ef4444"; // red-500
    } else if (normalizedScore > 3) {
      riskLevel = "Moderate Risk";
      riskColor = "#f59e0b"; // yellow-500
    }
    
    return {
      normalizedScore,
      riskLevel,
      riskColor
    };
  }, [score, size]);

  return (
    <div className="flex flex-col items-center" data-testid="risk-gauge">
      <div className="w-full max-w-xs">
        {/* Score display */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-foreground leading-none">
            {gaugeData.normalizedScore.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">
            out of 10
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="w-full h-6 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${(gaugeData.normalizedScore / 10) * 100}%`,
                backgroundColor: gaugeData.riskColor
              }}
            ></div>
          </div>
          
          {/* Scale markers */}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>3</span>
            <span>7</span>
            <span>10</span>
          </div>
        </div>
      </div>
      
      {showLabels && (
        <div className="mt-4 text-center">
          <p className="font-semibold text-lg" style={{ color: gaugeData.riskColor }}>
            {gaugeData.riskLevel}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Risk Assessment
          </p>
        </div>
      )}
      
      {/* Risk scale legend */}
      {showLabels && (
        <div className="mt-3 w-full max-w-xs space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Low
            </span>
            <span className="text-muted-foreground">0-3</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Moderate
            </span>
            <span className="text-muted-foreground">4-7</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              High
            </span>
            <span className="text-muted-foreground">8-10</span>
          </div>
        </div>
      )}
    </div>
  );
}