import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SensorGauge from '@/components/SensorGauge';
import ActuatorControl from '@/components/ActuatorControl';
import FarmMap from '@/components/FarmMap';
import CropCalendar from '@/components/CropCalendar';
import TaskList from '@/components/TaskList';
import Analytics from '@/components/Analytics';
import AlertsPanel from '@/components/AlertsPanel';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Farm, Device, SensorData } from '@/types';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [sensorReadings, setSensorReadings] = useState<Record<string, SensorData>>({});
  
  const { lastMessage, isConnected } = useWebSocket(selectedFarmId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  // Fetch user's farms
  const { data: farms, isLoading: farmsLoading } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
    enabled: !!user,
  });

  // Fetch devices for selected farm
  const { data: devices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['/api/farms', selectedFarmId, 'devices'],
    enabled: !!selectedFarmId,
  });

  // Set default farm when farms are loaded
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'sensorUpdate') {
        const sensorData = lastMessage.data as SensorData;
        const key = `${sensorData.deviceId}-${sensorData.sensorType}`;
        setSensorReadings(prev => ({
          ...prev,
          [key]: sensorData
        }));
      }
    }
  }, [lastMessage]);

  // Load initial sensor data
  useEffect(() => {
    const loadSensorData = async () => {
      if (!devices) return;

      const sensorTypes = ['ph', 'tds', 'soil_moisture', 'water_depth', 'water_flow', 'rainfall', 'temperature', 'humidity'];
      const readings: Record<string, SensorData> = {};

      for (const device of devices) {
        if (device.type === 'sensor') {
          for (const sensorType of sensorTypes) {
            try {
              const data = await api.getLatestSensorData(device.id, sensorType);
              if (data) {
                const key = `${device.id}-${sensorType}`;
                readings[key] = data;
              }
            } catch (error) {
              console.error(`Failed to load ${sensorType} data for device ${device.id}:`, error);
            }
          }
        }
      }

      setSensorReadings(readings);
    };

    loadSensorData();
  }, [devices]);

  if (authLoading || farmsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const sensorDevices = devices?.filter((device: Device) => device.type === 'sensor') || [];
  const actuatorDevices = devices?.filter((device: Device) => device.type === 'actuator') || [];

  const getSensorReading = (deviceId: string, sensorType: string) => {
    const key = `${deviceId}-${sensorType}`;
    return sensorReadings[key];
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        farms={farms || []}
        selectedFarmId={selectedFarmId}
        onFarmChange={setSelectedFarmId}
        isConnected={isConnected}
        user={user}
      />
      
      <div className="flex pt-20">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-6 space-y-6">
          {!selectedFarmId ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Welcome to AgriTech IoT</h2>
              <p className="text-muted-foreground">Please select a farm or create one to get started.</p>
            </div>
          ) : (
            <>
              {/* Real-time Sensor Gauges */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {sensorDevices.length > 0 ? (
                  ['ph', 'tds', 'soil_moisture', 'water_depth', 'water_flow', 'temperature'].map((sensorType) => {
                    const reading = getSensorReading(sensorDevices[0]?.id, sensorType);
                    return (
                      <SensorGauge
                        key={sensorType}
                        type={sensorType}
                        reading={reading}
                        data-testid={`gauge-${sensorType}`}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No sensor devices found. Please add devices to start monitoring.
                  </div>
                )}
              </section>

              {/* Actuator Controls */}
              {actuatorDevices.length > 0 && (
                <ActuatorControl devices={actuatorDevices} farmId={selectedFarmId} />
              )}

              {/* Farm Map with Heatmap */}
              <FarmMap farmId={selectedFarmId} />

              {/* Analytics, Calendar, and Tasks */}
              <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <Analytics farmId={selectedFarmId} />
                <CropCalendar farmId={selectedFarmId} />
                <TaskList farmId={selectedFarmId} />
              </section>

              {/* Alerts Panel */}
              <AlertsPanel farmId={selectedFarmId} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
