import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog } from 'lucide-react';
import type { Device, ActuatorState } from '@/types';

interface ActuatorControlProps {
  devices: Device[];
  farmId: string;
}

export default function ActuatorControl({ devices, farmId }: ActuatorControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  // Get actuator states for all devices
  const { data: actuatorStates } = useQuery({
    queryKey: ['/api/devices', 'actuators', farmId],
    queryFn: async () => {
      const states: Record<string, ActuatorState[]> = {};
      for (const device of devices) {
        try {
          const deviceStates = await api.getActuatorStates(device.id);
          states[device.id] = deviceStates;
        } catch (error) {
          console.error(`Failed to fetch states for device ${device.id}:`, error);
          states[device.id] = [];
        }
      }
      return states;
    },
    enabled: devices.length > 0,
  });

  const controlMutation = useMutation({
    mutationFn: async ({ deviceId, actuatorType, isActive }: {
      deviceId: string;
      actuatorType: string;
      isActive: boolean;
    }) => {
      return api.controlActuator(deviceId, { actuatorType, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices', 'actuators', farmId] });
      toast({
        title: 'Actuator Updated',
        description: 'Actuator state has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Control Failed',
        description: error.message || 'Failed to control actuator.',
      });
    },
  });

  const handleToggle = async (deviceId: string, actuatorType: string, currentState: boolean) => {
    const toggleKey = `${deviceId}-${actuatorType}`;
    setToggling(prev => ({ ...prev, [toggleKey]: true }));

    try {
      await controlMutation.mutateAsync({
        deviceId,
        actuatorType,
        isActive: !currentState,
      });
    } finally {
      setToggling(prev => ({ ...prev, [toggleKey]: false }));
    }
  };

  const getLatestState = (deviceId: string, actuatorType: string): boolean => {
    const states = actuatorStates?.[deviceId] || [];
    const latestState = states
      .filter(state => state.actuatorType === actuatorType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return latestState?.isActive || false;
  };

  const actuatorTypes = [
    { type: 'pump1', label: 'Pump 1', description: 'Main Irrigation' },
    { type: 'pump2', label: 'Pump 2', description: 'Fertilizer Mix' },
    { type: 'pump3', label: 'Pump 3', description: 'Backup System' },
    { type: 'humidifier', label: 'Humidifier', description: 'Climate Control' },
  ];

  if (devices.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cog className="h-5 w-5" />
            <span>Actuator Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No actuator devices found. Please add actuator devices to control farm equipment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Cog className="h-5 w-5" />
          <span>Actuator Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actuatorTypes.map((actuator) => {
            const device = devices[0]; // Use first actuator device for demo
            const isActive = getLatestState(device?.id || '', actuator.type);
            const toggleKey = `${device?.id}-${actuator.type}`;
            const isToggling = toggling[toggleKey];

            return (
              <div
                key={actuator.type}
                className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition-all"
                data-testid={`actuator-${actuator.type}`}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{actuator.label}</h3>
                  <p className="text-sm text-muted-foreground">{actuator.description}</p>
                  <p className={`text-xs font-mono mt-1 ${
                    isActive 
                      ? 'text-accent' 
                      : 'text-muted-foreground'
                  }`}>
                    Status: {isActive ? 'ACTIVE' : 'IDLE'}
                  </p>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id={`${device?.id}-${actuator.type}`}
                    checked={isActive}
                    onChange={() => device && handleToggle(device.id, actuator.type, isActive)}
                    disabled={isToggling || !device}
                    data-testid={`toggle-${actuator.type}`}
                  />
                  <span className="slider"></span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
