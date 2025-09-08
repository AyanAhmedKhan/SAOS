import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map, RefreshCw, Satellite } from 'lucide-react';
import type { HeatmapPoint } from '@/types';

interface FarmMapProps {
  farmId: string;
}

export default function FarmMap({ farmId }: FarmMapProps) {
  const [selectedSensorType, setSelectedSensorType] = useState('soil_moisture');

  const { data: heatmapData, isLoading, refetch } = useQuery({
    queryKey: ['/api/analytics/heatmap', farmId, selectedSensorType],
    queryFn: () => api.getHeatmapData(farmId, selectedSensorType),
    enabled: !!farmId,
  });

  const sensorTypes = [
    { value: 'soil_moisture', label: 'Soil Moisture' },
    { value: 'ph', label: 'pH Levels' },
    { value: 'temperature', label: 'Temperature' },
    { value: 'tds', label: 'TDS Levels' },
  ];

  const getHeatmapColor = (value: number, sensorType: string) => {
    let normalizedValue: number;
    
    switch (sensorType) {
      case 'soil_moisture':
        normalizedValue = value / 100;
        break;
      case 'ph':
        normalizedValue = (value - 5) / 4; // pH 5-9 range
        break;
      case 'temperature':
        normalizedValue = (value - 15) / 25; // 15-40°C range
        break;
      case 'tds':
        normalizedValue = value / 1000; // 0-1000 ppm range
        break;
      default:
        normalizedValue = value / 100;
    }

    // Clamp between 0 and 1
    normalizedValue = Math.max(0, Math.min(1, normalizedValue));

    if (normalizedValue < 0.3) return 'hsl(0, 100%, 60%)'; // Red - Low
    if (normalizedValue < 0.5) return 'hsl(30, 100%, 60%)'; // Orange - Medium-Low
    if (normalizedValue < 0.7) return 'hsl(180, 100%, 50%)'; // Cyan - Good
    return 'hsl(120, 100%, 50%)'; // Green - High
  };

  const getLegendItems = (sensorType: string) => {
    switch (sensorType) {
      case 'soil_moisture':
        return [
          { color: 'hsl(0, 100%, 60%)', label: '0-30% (Low)' },
          { color: 'hsl(30, 100%, 60%)', label: '30-50% (Med)' },
          { color: 'hsl(180, 100%, 50%)', label: '50-70% (Good)' },
          { color: 'hsl(120, 100%, 50%)', label: '70-90% (High)' },
        ];
      case 'ph':
        return [
          { color: 'hsl(0, 100%, 60%)', label: '5.0-6.0 (Acidic)' },
          { color: 'hsl(30, 100%, 60%)', label: '6.0-6.5 (Low)' },
          { color: 'hsl(180, 100%, 50%)', label: '6.5-7.5 (Optimal)' },
          { color: 'hsl(120, 100%, 50%)', label: '7.5-9.0 (High)' },
        ];
      case 'temperature':
        return [
          { color: 'hsl(0, 100%, 60%)', label: '15-20°C (Cold)' },
          { color: 'hsl(30, 100%, 60%)', label: '20-25°C (Cool)' },
          { color: 'hsl(180, 100%, 50%)', label: '25-30°C (Optimal)' },
          { color: 'hsl(120, 100%, 50%)', label: '30-40°C (Hot)' },
        ];
      case 'tds':
        return [
          { color: 'hsl(0, 100%, 60%)', label: '0-200 ppm (Low)' },
          { color: 'hsl(30, 100%, 60%)', label: '200-400 ppm (Med)' },
          { color: 'hsl(180, 100%, 50%)', label: '400-600 ppm (Good)' },
          { color: 'hsl(120, 100%, 50%)', label: '600+ ppm (High)' },
        ];
      default:
        return [];
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Map className="h-5 w-5" />
            <span>Farm Heatmap</span>
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Select value={selectedSensorType} onValueChange={setSelectedSensorType}>
              <SelectTrigger className="w-40" data-testid="select-sensor-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sensorTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-map"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="map-container h-96 relative" data-testid="farm-map">
          {/* Farm boundaries */}
          <div className="absolute inset-4 border-2 border-dashed border-border rounded"></div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading heatmap data...</p>
              </div>
            </div>
          )}

          {/* Heatmap points */}
          {heatmapData && heatmapData.length > 0 ? (
            heatmapData.map((point: HeatmapPoint, index: number) => (
              <div
                key={point.deviceId || index}
                className="heatmap-point"
                style={{
                  top: `${20 + (index % 4) * 15}%`,
                  left: `${15 + (Math.floor(index / 2) % 4) * 20}%`,
                  backgroundColor: getHeatmapColor(point.value, selectedSensorType),
                  boxShadow: `0 0 30px ${getHeatmapColor(point.value, selectedSensorType)}`,
                }}
                title={`${point.value} ${selectedSensorType === 'ph' ? 'pH' : 
                  selectedSensorType === 'temperature' ? '°C' :
                  selectedSensorType === 'tds' ? 'ppm' : '%'}`}
                data-testid={`heatmap-point-${index}`}
              />
            ))
          ) : !isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sensor data available for heatmap</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add sensor devices and generate data to see the heatmap
                </p>
              </div>
            </div>
          ) : null}

          {/* Sensor locations */}
          {heatmapData && heatmapData.slice(0, 3).map((point: HeatmapPoint, index: number) => (
            <div
              key={`sensor-${index}`}
              className="absolute flex items-center space-x-2"
              style={{
                top: `${25 + index * 25}%`,
                left: `${20 + index * 30}%`,
              }}
            >
              <Satellite className="h-4 w-4 text-primary" />
              <span className="text-xs bg-background px-2 py-1 rounded border border-border">
                Sensor {String.fromCharCode(65 + index)}{index + 1}
              </span>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-background bg-opacity-90 p-4 rounded border border-border">
            <h4 className="text-sm font-medium mb-3">
              {sensorTypes.find(t => t.value === selectedSensorType)?.label}
            </h4>
            <div className="space-y-2">
              {getLegendItems(selectedSensorType).map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
