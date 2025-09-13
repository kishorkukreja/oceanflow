import { useMemo } from "react";

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabels?: boolean;
}

export function RiskGauge({ score, size = 120, showLabels = true }: RiskGaugeProps) {
  const gaugeData = useMemo(() => {
    const normalizedScore = Math.max(0, Math.min(10, score));
    const angle = (normalizedScore / 10) * 180; // 0-180 degrees
    
    // Calculate needle position
    const needleAngle = angle - 90; // Adjust for SVG coordinate system
    const needleLength = size * 0.35;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const needleX = centerX + Math.cos((needleAngle * Math.PI) / 180) * needleLength;
    const needleY = centerY + Math.sin((needleAngle * Math.PI) / 180) * needleLength;
    
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
      angle,
      needleX,
      needleY,
      centerX,
      centerY,
      needleLength,
      riskLevel,
      riskColor
    };
  }, [score, size]);

  const radius = size * 0.4;
  const strokeWidth = size * 0.05;

  return (
    <div className="flex flex-col items-center" data-testid="risk-gauge">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background arc */}
          <path
            d={`M ${gaugeData.centerX - radius} ${gaugeData.centerY} A ${radius} ${radius} 0 0 1 ${gaugeData.centerX + radius} ${gaugeData.centerY}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Risk level segments */}
          {/* Green segment (0-3) */}
          <path
            d={`M ${gaugeData.centerX - radius} ${gaugeData.centerY} A ${radius} ${radius} 0 0 1 ${gaugeData.centerX} ${gaugeData.centerY - radius}`}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.7}
          />
          
          {/* Yellow segment (3-7) */}
          <path
            d={`M ${gaugeData.centerX} ${gaugeData.centerY - radius} A ${radius} ${radius} 0 0 1 ${gaugeData.centerX + radius * 0.707} ${gaugeData.centerY - radius * 0.707}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.7}
          />
          
          {/* Red segment (7-10) */}
          <path
            d={`M ${gaugeData.centerX + radius * 0.707} ${gaugeData.centerY - radius * 0.707} A ${radius} ${radius} 0 0 1 ${gaugeData.centerX + radius} ${gaugeData.centerY}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.7}
          />
          
          {/* Progress arc */}
          <path
            d={`M ${gaugeData.centerX - radius} ${gaugeData.centerY} A ${radius} ${radius} 0 ${gaugeData.angle > 90 ? 1 : 0} 1 ${gaugeData.needleX} ${gaugeData.needleY}`}
            fill="none"
            stroke={gaugeData.riskColor}
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <g transform={`rotate(${gaugeData.angle - 90} ${gaugeData.centerX} ${gaugeData.centerY})`}>
            <line
              x1={gaugeData.centerX}
              y1={gaugeData.centerY}
              x2={gaugeData.centerX + gaugeData.needleLength}
              y2={gaugeData.centerY}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
          
          {/* Center dot */}
          <circle
            cx={gaugeData.centerX}
            cy={gaugeData.centerY}
            r={4}
            fill="hsl(var(--foreground))"
          />
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {gaugeData.normalizedScore.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Risk Score
            </div>
          </div>
        </div>
      </div>
      
      {showLabels && (
        <div className="mt-4 text-center">
          <p className="font-medium" style={{ color: gaugeData.riskColor }}>
            {gaugeData.riskLevel}
          </p>
          <p className="text-xs text-muted-foreground">
            Risk Score
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
