import { useMemo } from 'react';
import type { SensorData } from '@/types';

interface SensorGaugeProps {
  type: string;
  reading?: SensorData;
}

const sensorConfig = {
  ph: {
    label: 'pH Level',
    icon: '💧',
    color: 'hsl(var(--chart-1))',
    min: 0,
    max: 14,
    optimal: { min: 6.5, max: 7.2 },
    unit: 'pH'
  },
  tds: {
    label: 'TDS',
    icon: '🧪',
    color: 'hsl(var(--chart-2))',
    min: 0,
    max: 1000,
    optimal: { min: 300, max: 600 },
    unit: 'ppm'
  },
  soil_moisture: {
    label: 'Soil Moisture',
    icon: '🌱',
    color: 'hsl(var(--chart-3))',
    min: 0,
    max: 100,
    optimal: { min: 60, max: 80 },
    unit: '%'
  },
  water_depth: {
    label: 'Water Depth',
    icon: '💧',
    color: 'hsl(var(--chart-4))',
    min: 0,
    max: 5,
    optimal: { min: 1.5, max: 4.0 },
    unit: 'm'
  },
  water_flow: {
    label: 'Water Flow',
    icon: '🌊',
    color: 'hsl(var(--primary))',
    min: 0,
    max: 100,
    optimal: { min: 30, max: 60 },
    unit: 'L/min'
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    color: 'hsl(var(--chart-5))',
    min: 0,
    max: 50,
    optimal: { min: 25, max: 30 },
    unit: '°C'
  }
};

export default function SensorGauge({ type, reading }: SensorGaugeProps) {
  const config = sensorConfig[type as keyof typeof sensorConfig];
  
  if (!config) return null;

  const value = reading?.value ?? 0;
  const percentage = ((value - config.min) / (config.max - config.min)) * 100;
  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const status = useMemo(() => {
    if (!reading) return 'no-data';
    if (value >= config.optimal.min && value <= config.optimal.max) return 'optimal';
    if (value < config.optimal.min * 0.8 || value > config.optimal.max * 1.2) return 'critical';
    return 'warning';
  }, [value, config, reading]);

  const statusColors = {
    optimal: 'text-accent',
    warning: 'text-chart-5',
    critical: 'text-destructive',
    'no-data': 'text-muted-foreground'
  };

  return (
    <div className={`bg-card rounded-lg p-6 border transition-colors hover:border-opacity-80 ${
      status === 'optimal' ? 'border-accent/20 hover:border-accent' :
      status === 'warning' ? 'border-chart-5/20 hover:border-chart-5' :
      status === 'critical' ? 'border-destructive/20 hover:border-destructive' :
      'border-border hover:border-primary'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{config.label}</h3>
        <span className="text-lg">{config.icon}</span>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-30 h-30 mb-3">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={config.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: `drop-shadow(0 0 8px ${config.color})`,
                transition: 'stroke-dashoffset 0.5s ease'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div 
                className={`text-2xl font-bold font-mono ${statusColors[status]}`}
                data-testid={`gauge-value-${type}`}
              >
                {reading ? (
                  type === 'temperature' ? `${value.toFixed(1)}°C` : 
                  type === 'water_depth' ? `${value.toFixed(1)}` :
                  Math.round(value)
                ) : '--'}
              </div>
              <div className="text-xs text-muted-foreground">{config.unit}</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Target: {config.optimal.min}-{config.optimal.max}
        </div>
        
        {reading && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(reading.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
