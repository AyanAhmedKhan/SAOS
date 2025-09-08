import mqtt from "mqtt";
import { storage } from "../storage";
import { alertService } from "./alertService";

class MqttService {
  private client: mqtt.MqttClient | null = null;
  private broadcast: ((farmId: string, data: any) => void) | null = null;

  initialize(broadcastFunction: (farmId: string, data: any) => void) {
    this.broadcast = broadcastFunction;
    
    const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";
    
    try {
      this.client = mqtt.connect(mqttUrl);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        // Subscribe to farm sensor topics
        this.client?.subscribe('farm/+/device/+/sensor/+', (err) => {
          if (err) {
            console.error('MQTT subscription error:', err);
          } else {
            console.log('Subscribed to farm sensor topics');
          }
        });

        // Subscribe to actuator control topics
        this.client?.subscribe('farm/+/device/+/actuator/+', (err) => {
          if (err) {
            console.error('MQTT actuator subscription error:', err);
          } else {
            console.log('Subscribed to farm actuator topics');
          }
        });
      });

      this.client.on('message', async (topic, message) => {
        try {
          await this.handleMessage(topic, message);
        } catch (error) {
          console.error('Error handling MQTT message:', error);
        }
      });

      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
      });

    } catch (error) {
      console.error('Failed to initialize MQTT service:', error);
    }
  }

  private async handleMessage(topic: string, message: Buffer) {
    const topicParts = topic.split('/');
    
    if (topicParts.length >= 6 && topicParts[0] === 'farm') {
      const farmId = topicParts[1];
      const deviceId = topicParts[3];
      const type = topicParts[4]; // 'sensor' or 'actuator'
      const subType = topicParts[5]; // sensor type or actuator type

      try {
        const data = JSON.parse(message.toString());

        if (type === 'sensor') {
          await this.handleSensorMessage(farmId, deviceId, subType, data);
        } else if (type === 'actuator') {
          await this.handleActuatorMessage(farmId, deviceId, subType, data);
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    }
  }

  private async handleSensorMessage(farmId: string, deviceId: string, sensorType: string, data: any) {
    // Validate device exists
    const device = await storage.getDevice(deviceId);
    if (!device || device.farmId !== farmId) {
      console.error(`Device ${deviceId} not found or farm mismatch`);
      return;
    }

    // Store sensor data
    const sensorData = await storage.createSensorData({
      deviceId,
      sensorType,
      value: data.value,
      unit: data.unit || this.getDefaultUnit(sensorType)
    });

    // Check for alerts
    await alertService.checkSensorThresholds(farmId, sensorType, data.value, deviceId);

    // Broadcast real-time update
    if (this.broadcast) {
      this.broadcast(farmId, {
        type: 'sensorUpdate',
        data: sensorData
      });
    }

    console.log(`Sensor data received: ${sensorType} = ${data.value} for device ${deviceId}`);
  }

  private async handleActuatorMessage(farmId: string, deviceId: string, actuatorType: string, data: any) {
    // Validate device exists
    const device = await storage.getDevice(deviceId);
    if (!device || device.farmId !== farmId) {
      console.error(`Device ${deviceId} not found or farm mismatch`);
      return;
    }

    // Store actuator state
    const actuatorState = await storage.createActuatorState({
      deviceId,
      actuatorType,
      isActive: data.isActive || false
    });

    // Broadcast real-time update
    if (this.broadcast) {
      this.broadcast(farmId, {
        type: 'actuatorUpdate',
        data: actuatorState
      });
    }

    console.log(`Actuator state received: ${actuatorType} = ${data.isActive} for device ${deviceId}`);
  }

  private getDefaultUnit(sensorType: string): string {
    const unitMap: Record<string, string> = {
      'ph': 'pH',
      'tds': 'ppm',
      'soil_moisture': '%',
      'water_depth': 'm',
      'water_flow': 'L/min',
      'rainfall': 'mm',
      'temperature': '°C',
      'humidity': '%'
    };
    return unitMap[sensorType] || '';
  }

  // Method to publish actuator commands
  publishActuatorCommand(farmId: string, deviceId: string, actuatorType: string, command: any) {
    if (!this.client) {
      console.error('MQTT client not initialized');
      return;
    }

    const topic = `farm/${farmId}/device/${deviceId}/actuator/${actuatorType}/command`;
    const message = JSON.stringify(command);

    this.client.publish(topic, message, (error) => {
      if (error) {
        console.error('MQTT publish error:', error);
      } else {
        console.log(`Actuator command sent: ${topic} - ${message}`);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttService = new MqttService();
