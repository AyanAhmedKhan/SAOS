import { storage } from "../storage";

class DataGenerator {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  async generateSensorData(farmId: string) {
    const devices = await storage.getDevicesByFarm(farmId);
    const sensorDevices = devices.filter(device => device.type === 'sensor');

    for (const device of sensorDevices) {
      await this.generateDeviceSensorData(device.id);
    }
  }

  private async generateDeviceSensorData(deviceId: string) {
    const sensorTypes = ['ph', 'tds', 'soil_moisture', 'water_depth', 'water_flow', 'rainfall', 'temperature', 'humidity'];
    
    for (const sensorType of sensorTypes) {
      const value = this.generateRealisticValue(sensorType);
      const unit = this.getUnit(sensorType);

      await storage.createSensorData({
        deviceId,
        sensorType,
        value,
        unit
      });
    }
  }

  private generateRealisticValue(sensorType: string): number {
    const ranges: Record<string, { min: number, max: number, trend?: number }> = {
      'ph': { min: 5.5, max: 8.5 },
      'tds': { min: 200, max: 800 },
      'soil_moisture': { min: 30, max: 90 },
      'water_depth': { min: 1.0, max: 4.0 },
      'water_flow': { min: 0, max: 100 },
      'rainfall': { min: 0, max: 20 },
      'temperature': { min: 15, max: 40 },
      'humidity': { min: 40, max: 95 }
    };

    const range = ranges[sensorType];
    if (!range) return 0;

    // Add some realistic variation and trends
    const baseValue = range.min + Math.random() * (range.max - range.min);
    const variation = (Math.random() - 0.5) * 0.1 * (range.max - range.min);
    const value = Math.max(range.min, Math.min(range.max, baseValue + variation));

    // Round to appropriate decimal places
    if (sensorType === 'ph') return Math.round(value * 10) / 10;
    if (sensorType === 'water_depth') return Math.round(value * 10) / 10;
    if (sensorType === 'temperature') return Math.round(value * 10) / 10;
    return Math.round(value);
  }

  private getUnit(sensorType: string): string {
    const units: Record<string, string> = {
      'ph': 'pH',
      'tds': 'ppm',
      'soil_moisture': '%',
      'water_depth': 'm',
      'water_flow': 'L/min',
      'rainfall': 'mm',
      'temperature': '°C',
      'humidity': '%'
    };
    return units[sensorType] || '';
  }

  startContinuousGeneration(farmId: string, broadcast: (farmId: string, data: any) => void) {
    // Stop existing generation if running
    this.stopContinuousGeneration(farmId);

    const interval = setInterval(async () => {
      try {
        const devices = await storage.getDevicesByFarm(farmId);
        const sensorDevices = devices.filter(device => device.type === 'sensor');

        for (const device of sensorDevices) {
          const sensorTypes = ['ph', 'tds', 'soil_moisture', 'water_depth', 'water_flow', 'rainfall', 'temperature', 'humidity'];
          
          for (const sensorType of sensorTypes) {
            const value = this.generateRealisticValue(sensorType);
            const unit = this.getUnit(sensorType);

            const sensorData = await storage.createSensorData({
              deviceId: device.id,
              sensorType,
              value,
              unit
            });

            // Broadcast real-time update
            broadcast(farmId, {
              type: 'sensorUpdate',
              data: sensorData
            });
          }
        }
      } catch (error) {
        console.error('Error generating continuous sensor data:', error);
      }
    }, 30000); // Generate data every 30 seconds

    this.intervals.set(farmId, interval);
    console.log(`Started continuous data generation for farm ${farmId}`);
  }

  stopContinuousGeneration(farmId: string) {
    const interval = this.intervals.get(farmId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(farmId);
      console.log(`Stopped continuous data generation for farm ${farmId}`);
    }
  }

  // Generate WEI records for analytics
  async generateWeiRecord(plotId: string) {
    const waterUsed = 2000 + Math.random() * 1000; // 2000-3000 L
    const yieldObtained = 150 + Math.random() * 100; // 150-250 kg
    const weiScore = (yieldObtained / waterUsed) * 1000; // Efficiency score

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    await storage.createWeiRecord({
      plotId,
      waterUsed,
      yieldObtained,
      weiScore: Math.round(weiScore * 10) / 10,
      period: 'weekly',
      startDate,
      endDate
    });
  }
}

export const dataGenerator = new DataGenerator();
