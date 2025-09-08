import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { mqttService } from "./services/mqttService";
import { dataGenerator } from "./services/dataGenerator";
import { alertService } from "./services/alertService";
import { authMiddleware } from "./middleware/auth";
import { 
  insertUserSchema, insertFarmSchema, insertPlotSchema, insertDeviceSchema,
  insertSensorDataSchema, insertActuatorStateSchema, insertCropCalendarEntrySchema,
  insertTaskSchema, insertAdvisorySchema, insertAlertThresholdSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface WebSocketClient extends WebSocket {
  userId?: string;
  farmId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('WebSocket connection established');

    // Handle authentication
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        ws.userId = decoded.userId;
        ws.farmId = decoded.farmId;
      } catch (error) {
        console.error('WebSocket auth failed:', error);
        ws.close();
        return;
      }
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle incoming WebSocket messages
        console.log('WebSocket message:', data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (farmId: string, data: any) => {
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.farmId === farmId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Initialize services
  mqttService.initialize(broadcast);
  alertService.initialize(storage, broadcast);

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Protected routes
  app.use('/api', authMiddleware);

  // User routes
  app.get('/api/users/me', async (req, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Farm routes
  app.get('/api/farms', async (req, res) => {
    try {
      const farms = await storage.getFarmsByOwner(req.userId);
      res.json(farms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/farms', async (req, res) => {
    try {
      const farmData = insertFarmSchema.parse({
        ...req.body,
        ownerId: req.userId
      });
      const farm = await storage.createFarm(farmData);
      res.json(farm);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/farms/:farmId', async (req, res) => {
    try {
      const farm = await storage.getFarm(req.params.farmId);
      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }
      res.json(farm);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Plot routes
  app.get('/api/farms/:farmId/plots', async (req, res) => {
    try {
      const plots = await storage.getPlotsByFarm(req.params.farmId);
      res.json(plots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/farms/:farmId/plots', async (req, res) => {
    try {
      const plotData = insertPlotSchema.parse({
        ...req.body,
        farmId: req.params.farmId
      });
      const plot = await storage.createPlot(plotData);
      res.json(plot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Device routes
  app.get('/api/farms/:farmId/devices', async (req, res) => {
    try {
      const devices = await storage.getDevicesByFarm(req.params.farmId);
      res.json(devices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/farms/:farmId/devices', async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse({
        ...req.body,
        farmId: req.params.farmId
      });
      const device = await storage.createDevice(deviceData);
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Sensor data routes
  app.get('/api/devices/:deviceId/sensors', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const sensorData = await storage.getSensorDataByDevice(req.params.deviceId, limit);
      res.json(sensorData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/devices/:deviceId/sensors/latest', async (req, res) => {
    try {
      const { sensorType } = req.query;
      if (!sensorType) {
        return res.status(400).json({ error: 'sensorType is required' });
      }
      const data = await storage.getLatestSensorData(req.params.deviceId, sensorType as string);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/devices/:deviceId/sensors', async (req, res) => {
    try {
      const sensorData = insertSensorDataSchema.parse({
        ...req.body,
        deviceId: req.params.deviceId
      });
      const data = await storage.createSensorData(sensorData);
      
      // Broadcast real-time update
      const device = await storage.getDevice(req.params.deviceId);
      if (device) {
        broadcast(device.farmId, {
          type: 'sensorUpdate',
          data: data
        });
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Actuator control routes
  app.get('/api/devices/:deviceId/actuators', async (req, res) => {
    try {
      const states = await storage.getActuatorStatesByDevice(req.params.deviceId);
      res.json(states);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/devices/:deviceId/actuators', async (req, res) => {
    try {
      const actuatorData = insertActuatorStateSchema.parse({
        ...req.body,
        deviceId: req.params.deviceId
      });
      const state = await storage.createActuatorState(actuatorData);
      
      // Broadcast real-time update
      const device = await storage.getDevice(req.params.deviceId);
      if (device) {
        broadcast(device.farmId, {
          type: 'actuatorUpdate',
          data: state
        });
      }
      
      res.json(state);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Crop calendar routes
  app.get('/api/farms/:farmId/calendar', async (req, res) => {
    try {
      const entries = await storage.getCropCalendarByFarm(req.params.farmId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/farms/:farmId/calendar', async (req, res) => {
    try {
      const entryData = insertCropCalendarEntrySchema.parse(req.body);
      const entry = await storage.createCropCalendarEntry(entryData);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Task routes
  app.get('/api/farms/:farmId/tasks', async (req, res) => {
    try {
      const tasks = await storage.getTasksByFarm(req.params.farmId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/farms/:farmId/tasks', async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        farmId: req.params.farmId,
        assignedTo: req.body.assignedTo || req.userId
      });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/tasks/:taskId', async (req, res) => {
    try {
      const updates = req.body;
      const task = await storage.updateTask(req.params.taskId, updates);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Advisory routes
  app.get('/api/farms/:farmId/advisories', async (req, res) => {
    try {
      const advisories = await storage.getAdvisoriesByFarm(req.params.farmId);
      res.json(advisories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Alert routes
  app.get('/api/farms/:farmId/alerts', async (req, res) => {
    try {
      const alerts = await storage.getAlertsByFarm(req.params.farmId);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/alerts/:alertId/acknowledge', async (req, res) => {
    try {
      const alert = await storage.acknowledgeAlert(req.params.alertId, req.userId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Analytics routes
  app.get('/api/analytics/wei/:plotId', async (req, res) => {
    try {
      const records = await storage.getWeiRecords(req.params.plotId);
      const latestRecord = records[0];
      
      if (!latestRecord) {
        return res.json({ score: 0, records: [] });
      }
      
      res.json({
        score: latestRecord.weiScore,
        waterUsed: latestRecord.waterUsed,
        yieldObtained: latestRecord.yieldObtained,
        records: records
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/heatmap/:farmId', async (req, res) => {
    try {
      const { sensorType = 'soil_moisture' } = req.query;
      const devices = await storage.getDevicesByFarm(req.params.farmId);
      
      const heatmapData = await Promise.all(
        devices.map(async (device) => {
          const latestData = await storage.getLatestSensorData(device.id, sensorType as string);
          return {
            deviceId: device.id,
            location: device.location,
            value: latestData?.value || 0,
            timestamp: latestData?.timestamp
          };
        })
      );
      
      res.json(heatmapData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data generation for demo
  app.post('/api/data/generate/:farmId', async (req, res) => {
    try {
      await dataGenerator.generateSensorData(req.params.farmId);
      res.json({ message: 'Sensor data generated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/data/start-generation/:farmId', async (req, res) => {
    try {
      dataGenerator.startContinuousGeneration(req.params.farmId, broadcast);
      res.json({ message: 'Continuous data generation started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/data/stop-generation/:farmId', async (req, res) => {
    try {
      dataGenerator.stopContinuousGeneration(req.params.farmId);
      res.json({ message: 'Continuous data generation stopped' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
