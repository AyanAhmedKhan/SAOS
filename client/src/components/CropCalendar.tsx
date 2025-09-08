import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock } from 'lucide-react';
import type { CropCalendarEntry } from '@/types';

interface CropCalendarProps {
  farmId: string;
}

export default function CropCalendar({ farmId }: CropCalendarProps) {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const { data: calendarEntries, isLoading } = useQuery({
    queryKey: ['/api/farms', farmId, 'calendar'],
    queryFn: () => api.getCropCalendar(farmId),
    enabled: !!farmId,
  });

  const getStageColor = (stage: string) => {
    const stageClasses = {
      seeding: 'stage-seeding',
      germination: 'stage-germination',
      vegetative: 'stage-vegetative',
      flowering: 'stage-flowering',
      fruiting: 'stage-fruiting',
      harvest: 'stage-harvest',
    };
    return stageClasses[stage as keyof typeof stageClasses] || 'bg-muted';
  };

  const getDaysFromPlanting = (plantingDate: string) => {
    const planted = new Date(plantingDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - planted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getNextAction = (entry: CropCalendarEntry) => {
    const stage = entry.currentStage;
    const daysFromPlanting = getDaysFromPlanting(entry.plantingDate);
    
    switch (stage) {
      case 'seeding':
        return { action: 'Monitor germination', time: 'In 3-5 days' };
      case 'germination':
        return { action: 'First irrigation', time: 'In 2 days' };
      case 'vegetative':
        return { action: 'Apply fertilizer', time: 'Tomorrow' };
      case 'flowering':
        return { action: 'Next irrigation', time: 'Tomorrow 6:00 AM' };
      case 'fruiting':
        return { action: 'Pest inspection', time: 'In 2 days' };
      case 'harvest':
        return { action: 'Harvest ready', time: 'Now' };
      default:
        return { action: 'Monitor growth', time: 'Daily' };
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Crop Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Crop Calendar</span>
          </CardTitle>
          <Button size="sm" className="neon-glow" data-testid="button-add-entry">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calendarEntries && calendarEntries.length > 0 ? (
            calendarEntries.map((entry: CropCalendarEntry) => {
              const nextAction = getNextAction(entry);
              const daysFromPlanting = getDaysFromPlanting(entry.plantingDate);
              
              return (
                <div
                  key={entry.id}
                  className={`bg-muted rounded-lg p-4 border-l-4 transition-all cursor-pointer hover:bg-muted/80 ${
                    entry.currentStage === 'harvest' ? 'border-l-accent' :
                    entry.currentStage === 'flowering' ? 'border-l-accent' :
                    entry.currentStage === 'vegetative' ? 'border-l-chart-2' :
                    'border-l-primary'
                  }`}
                  onClick={() => setSelectedEntry(entry.id)}
                  data-testid={`calendar-entry-${entry.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      {entry.cropId} - Plot {entry.plotId.slice(-1)}
                    </span>
                    <Badge className={getStageColor(entry.currentStage)}>
                      {entry.currentStage.charAt(0).toUpperCase() + entry.currentStage.slice(1)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    Stage: {daysFromPlanting} days from planting
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {nextAction.action}:
                    </span>
                    <span className="font-mono text-sm text-primary flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {nextAction.time}
                    </span>
                  </div>
                  
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Note: {entry.notes}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No crop calendar entries found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add crops to your plots to start tracking growth stages
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
