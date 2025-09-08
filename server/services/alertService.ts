import { storage } from "../storage";
import type { IStorage } from "../storage";

class AlertService {
  private storage: IStorage | null = null;
  private broadcast: ((farmId: string, data: any) => void) | null = null;

  initialize(storageInstance: IStorage, broadcastFunction: (farmId: string, data: any) => void) {
    this.storage = storageInstance;
    this.broadcast = broadcastFunction;
  }

  async checkSensorThresholds(farmId: string, sensorType: string, value: number, deviceId: string) {
    if (!this.storage) return;

    const thresholds = await this.storage.getAlertThresholds(farmId);
    const relevantThresholds = thresholds.filter(t => t.sensorType === sensorType);

    for (const threshold of relevantThresholds) {
      let shouldAlert = false;
      let message = '';

      if (threshold.minValue !== null && value < threshold.minValue) {
        shouldAlert = true;
        message = `${sensorType} level is below minimum threshold (${value} < ${threshold.minValue})`;
      } else if (threshold.maxValue !== null && value > threshold.maxValue) {
        shouldAlert = true;
        message = `${sensorType} level is above maximum threshold (${value} > ${threshold.maxValue})`;
      }

      if (shouldAlert) {
        await this.createAlert(farmId, {
          title: `${sensorType.toUpperCase()} Alert`,
          message,
          severity: threshold.severity,
          deviceId
        });
      }
    }
  }

  async createAlert(farmId: string, alertData: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    deviceId?: string;
  }) {
    if (!this.storage) return;

    const alert = await this.storage.createAlert({
      ...alertData,
      farmId
    });

    // Broadcast real-time alert
    if (this.broadcast) {
      this.broadcast(farmId, {
        type: 'newAlert',
        data: alert
      });
    }

    // Here you could add additional notification channels
    await this.sendNotifications(alert);

    return alert;
  }

  private async sendNotifications(alert: any) {
    // Email notification (console for demo)
    console.log('📧 Email notification:', {
      subject: `Farm Alert: ${alert.title}`,
      body: alert.message,
      severity: alert.severity
    });

    // SMS notification (stubbed)
    if (alert.severity === 'critical') {
      console.log('📱 SMS notification:', {
        message: `CRITICAL ALERT: ${alert.title} - ${alert.message}`,
        phone: '+1234567890' // Would come from user preferences
      });
    }

    // WhatsApp notification (stubbed)
    if (alert.severity === 'high' || alert.severity === 'critical') {
      console.log('💬 WhatsApp notification:', {
        message: `🚨 ${alert.title}: ${alert.message}`,
        phone: '+1234567890'
      });
    }

    // Push notification (WebSocket already handled above)
    console.log('🔔 Push notification sent via WebSocket');
  }

  // Generate irrigation recommendations based on sensor data
  async generateIrrigationAdvisory(farmId: string, plotId: string) {
    if (!this.storage) return;

    const devices = await this.storage.getDevicesByPlot(plotId);
    const moistureDevices = devices.filter(d => d.type === 'sensor');

    let totalMoisture = 0;
    let deviceCount = 0;

    for (const device of moistureDevices) {
      const latestMoisture = await this.storage.getLatestSensorData(device.id, 'soil_moisture');
      if (latestMoisture) {
        totalMoisture += latestMoisture.value;
        deviceCount++;
      }
    }

    if (deviceCount === 0) return;

    const avgMoisture = totalMoisture / deviceCount;
    let recommendation = '';

    if (avgMoisture < 40) {
      recommendation = 'Immediate irrigation required. Soil moisture is critically low.';
    } else if (avgMoisture < 60) {
      recommendation = 'Schedule irrigation within 24 hours. Soil moisture is below optimal range.';
    } else if (avgMoisture > 85) {
      recommendation = 'Reduce irrigation. Soil moisture is too high, risk of waterlogging.';
    } else {
      recommendation = 'Soil moisture is optimal for current growth stage.';
    }

    await this.storage.createAdvisory({
      title: 'Irrigation Recommendation',
      content: recommendation,
      type: 'irrigation',
      farmId,
      plotId
    });
  }

  // Generate fertilizer recommendations
  async generateFertilizerAdvisory(farmId: string, plotId: string, cropId: string) {
    if (!this.storage) return;

    const devices = await this.storage.getDevicesByPlot(plotId);
    const crop = await this.storage.getCrop(cropId);

    if (!crop) return;

    let recommendations: string[] = [];

    for (const device of devices) {
      const latestPh = await this.storage.getLatestSensorData(device.id, 'ph');
      const latestTds = await this.storage.getLatestSensorData(device.id, 'tds');

      if (latestPh && crop.optimalPh) {
        if (latestPh.value < crop.optimalPh - 0.5) {
          recommendations.push('Apply lime to increase soil pH');
        } else if (latestPh.value > crop.optimalPh + 0.5) {
          recommendations.push('Apply sulfur to decrease soil pH');
        }
      }

      if (latestTds && crop.optimalTds) {
        if (latestTds.value < crop.optimalTds * 0.8) {
          recommendations.push('Apply balanced NPK fertilizer to increase nutrient levels');
        } else if (latestTds.value > crop.optimalTds * 1.2) {
          recommendations.push('Flush with clean water to reduce salt buildup');
        }
      }
    }

    if (recommendations.length > 0) {
      await this.storage.createAdvisory({
        title: 'Fertilizer Recommendation',
        content: recommendations.join('. '),
        type: 'fertilizer',
        farmId,
        plotId,
        cropId
      });
    }
  }
}

export const alertService = new AlertService();
