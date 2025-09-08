import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Eye, Bell } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertsPanelProps {
  farmId: string;
}

export default function AlertsPanel({ farmId }: AlertsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [acknowledgingAlerts, setAcknowledgingAlerts] = useState<Set<string>>(new Set());

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/farms', farmId, 'alerts'],
    queryFn: () => api.getAlerts(farmId),
    enabled: !!farmId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => api.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'alerts'] });
      toast({
        title: 'Alert Acknowledged',
        description: 'Alert has been successfully acknowledged.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Acknowledgment Failed',
        description: error.message || 'Failed to acknowledge alert.',
      });
    },
  });

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingAlerts(prev => new Set(prev).add(alertId));
    try {
      await acknowledgeMutation.mutateAsync(alertId);
    } finally {
      setAcknowledgingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-chart-5" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-secondary" />;
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'alert-critical';
      case 'high':
        return 'alert-high';
      case 'medium':
        return 'alert-medium';
      case 'low':
        return 'alert-low';
      default:
        return 'border-border';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-chart-5 text-background';
      case 'medium':
        return 'bg-secondary text-secondary-foreground';
      case 'low':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  const unacknowledgedAlerts = alerts?.filter((alert: Alert) => !alert.isAcknowledged) || [];
  const acknowledgedAlerts = alerts?.filter((alert: Alert) => alert.isAcknowledged) || [];

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Recent Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
            <AlertTriangle className="h-5 w-5" />
            <span>Recent Alerts</span>
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all">
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts && alerts.length > 0 ? (
            <>
              {/* Unacknowledged alerts first */}
              {unacknowledgedAlerts.map((alert: Alert) => {
                const isAcknowledging = acknowledgingAlerts.has(alert.id);
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${getSeverityClass(alert.severity)}`}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-foreground">
                          {alert.title}
                        </p>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.createdAt)}
                        {alert.deviceId && ` • Device ${alert.deviceId.slice(-4)}`}
                      </p>
                      <div className="flex items-center mt-3 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={isAcknowledging}
                          data-testid={`button-acknowledge-${alert.id}`}
                        >
                          {isAcknowledging ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-details-${alert.id}`}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Acknowledged alerts (show latest one) */}
              {acknowledgedAlerts.length > 0 && unacknowledgedAlerts.length < 3 && (
                <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border border-border opacity-75">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {acknowledgedAlerts[0].title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Acknowledged {formatTimeAgo(acknowledgedAlerts[0].acknowledgedAt || acknowledgedAlerts[0].createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent alerts</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your farm is operating normally
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
