import { 
  users, farms, plots, devices, sensorData, actuatorStates, crops, 
  cropCalendarEntries, tasks, advisories, alerts, alertThresholds, weiRecords,
  type User, type InsertUser, type Farm, type InsertFarm, type Plot, type InsertPlot,
  type Device, type InsertDevice, type SensorData, type InsertSensorData,
  type ActuatorState, type InsertActuatorState, type Crop, type InsertCrop,
  type CropCalendarEntry, type InsertCropCalendarEntry, type Task, type InsertTask,
  type Advisory, type InsertAdvisory, type Alert, type InsertAlert,
  type AlertThreshold, type InsertAlertThreshold, type WeiRecord, type InsertWeiRecord
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Farms
  getFarm(id: string): Promise<Farm | undefined>;
  getFarmsByOwner(ownerId: string): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: string, farm: Partial<InsertFarm>): Promise<Farm | undefined>;
  
  // Plots
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotsByFarm(farmId: string): Promise<Plot[]>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  
  // Devices
  getDevice(id: string): Promise<Device | undefined>;
  getDevicesByFarm(farmId: string): Promise<Device[]>;
  getDevicesByPlot(plotId: string): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, device: Partial<InsertDevice>): Promise<Device | undefined>;
  
  // Sensor Data
  createSensorData(data: InsertSensorData): Promise<SensorData>;
  getLatestSensorData(deviceId: string, sensorType: string): Promise<SensorData | undefined>;
  getSensorDataByDevice(deviceId: string, limit?: number): Promise<SensorData[]>;
  getSensorDataByTimeRange(deviceId: string, startTime: Date, endTime: Date): Promise<SensorData[]>;
  
  // Actuator States
  createActuatorState(state: InsertActuatorState): Promise<ActuatorState>;
  getLatestActuatorState(deviceId: string, actuatorType: string): Promise<ActuatorState | undefined>;
  getActuatorStatesByDevice(deviceId: string): Promise<ActuatorState[]>;
  
  // Crops
  getCrop(id: string): Promise<Crop | undefined>;
  getAllCrops(): Promise<Crop[]>;
  createCrop(crop: InsertCrop): Promise<Crop>;
  
  // Crop Calendar
  getCropCalendarEntry(id: string): Promise<CropCalendarEntry | undefined>;
  getCropCalendarByPlot(plotId: string): Promise<CropCalendarEntry[]>;
  getCropCalendarByFarm(farmId: string): Promise<CropCalendarEntry[]>;
  createCropCalendarEntry(entry: InsertCropCalendarEntry): Promise<CropCalendarEntry>;
  updateCropCalendarEntry(id: string, entry: Partial<InsertCropCalendarEntry>): Promise<CropCalendarEntry | undefined>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByFarm(farmId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Advisories
  getAdvisory(id: string): Promise<Advisory | undefined>;
  getAdvisoriesByFarm(farmId: string): Promise<Advisory[]>;
  createAdvisory(advisory: InsertAdvisory): Promise<Advisory>;
  
  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  getAlertsByFarm(farmId: string): Promise<Alert[]>;
  getUnacknowledgedAlerts(farmId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  acknowledgeAlert(id: string, userId: string): Promise<Alert | undefined>;
  
  // Alert Thresholds
  getAlertThresholds(farmId: string): Promise<AlertThreshold[]>;
  createAlertThreshold(threshold: InsertAlertThreshold): Promise<AlertThreshold>;
  
  // WEI Records
  getWeiRecords(plotId: string): Promise<WeiRecord[]>;
  createWeiRecord(record: InsertWeiRecord): Promise<WeiRecord>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Farms
  async getFarm(id: string): Promise<Farm | undefined> {
    const [farm] = await db.select().from(farms).where(eq(farms.id, id));
    return farm || undefined;
  }

  async getFarmsByOwner(ownerId: string): Promise<Farm[]> {
    return await db.select().from(farms).where(eq(farms.ownerId, ownerId));
  }

  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const [farm] = await db.insert(farms).values(insertFarm).returning();
    return farm;
  }

  async updateFarm(id: string, farm: Partial<InsertFarm>): Promise<Farm | undefined> {
    const [updated] = await db.update(farms).set(farm).where(eq(farms.id, id)).returning();
    return updated || undefined;
  }

  // Plots
  async getPlot(id: string): Promise<Plot | undefined> {
    const [plot] = await db.select().from(plots).where(eq(plots.id, id));
    return plot || undefined;
  }

  async getPlotsByFarm(farmId: string): Promise<Plot[]> {
    return await db.select().from(plots).where(eq(plots.farmId, farmId));
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const [plot] = await db.insert(plots).values(insertPlot).returning();
    return plot;
  }

  // Devices
  async getDevice(id: string): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device || undefined;
  }

  async getDevicesByFarm(farmId: string): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.farmId, farmId));
  }

  async getDevicesByPlot(plotId: string): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.plotId, plotId));
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const [device] = await db.insert(devices).values(insertDevice).returning();
    return device;
  }

  async updateDevice(id: string, device: Partial<InsertDevice>): Promise<Device | undefined> {
    const [updated] = await db.update(devices).set(device).where(eq(devices.id, id)).returning();
    return updated || undefined;
  }

  // Sensor Data
  async createSensorData(data: InsertSensorData): Promise<SensorData> {
    const [sensorRecord] = await db.insert(sensorData).values(data).returning();
    return sensorRecord;
  }

  async getLatestSensorData(deviceId: string, sensorType: string): Promise<SensorData | undefined> {
    const [latest] = await db.select().from(sensorData)
      .where(and(eq(sensorData.deviceId, deviceId), eq(sensorData.sensorType, sensorType)))
      .orderBy(desc(sensorData.timestamp))
      .limit(1);
    return latest || undefined;
  }

  async getSensorDataByDevice(deviceId: string, limit = 100): Promise<SensorData[]> {
    return await db.select().from(sensorData)
      .where(eq(sensorData.deviceId, deviceId))
      .orderBy(desc(sensorData.timestamp))
      .limit(limit);
  }

  async getSensorDataByTimeRange(deviceId: string, startTime: Date, endTime: Date): Promise<SensorData[]> {
    return await db.select().from(sensorData)
      .where(and(
        eq(sensorData.deviceId, deviceId),
        gte(sensorData.timestamp, startTime),
        lte(sensorData.timestamp, endTime)
      ))
      .orderBy(desc(sensorData.timestamp));
  }

  // Actuator States
  async createActuatorState(state: InsertActuatorState): Promise<ActuatorState> {
    const [actuatorRecord] = await db.insert(actuatorStates).values(state).returning();
    return actuatorRecord;
  }

  async getLatestActuatorState(deviceId: string, actuatorType: string): Promise<ActuatorState | undefined> {
    const [latest] = await db.select().from(actuatorStates)
      .where(and(eq(actuatorStates.deviceId, deviceId), eq(actuatorStates.actuatorType, actuatorType)))
      .orderBy(desc(actuatorStates.timestamp))
      .limit(1);
    return latest || undefined;
  }

  async getActuatorStatesByDevice(deviceId: string): Promise<ActuatorState[]> {
    return await db.select().from(actuatorStates)
      .where(eq(actuatorStates.deviceId, deviceId))
      .orderBy(desc(actuatorStates.timestamp));
  }

  // Crops
  async getCrop(id: string): Promise<Crop | undefined> {
    const [crop] = await db.select().from(crops).where(eq(crops.id, id));
    return crop || undefined;
  }

  async getAllCrops(): Promise<Crop[]> {
    return await db.select().from(crops);
  }

  async createCrop(insertCrop: InsertCrop): Promise<Crop> {
    const [crop] = await db.insert(crops).values(insertCrop).returning();
    return crop;
  }

  // Crop Calendar
  async getCropCalendarEntry(id: string): Promise<CropCalendarEntry | undefined> {
    const [entry] = await db.select().from(cropCalendarEntries).where(eq(cropCalendarEntries.id, id));
    return entry || undefined;
  }

  async getCropCalendarByPlot(plotId: string): Promise<CropCalendarEntry[]> {
    return await db.select().from(cropCalendarEntries)
      .where(eq(cropCalendarEntries.plotId, plotId))
      .orderBy(desc(cropCalendarEntries.plantingDate));
  }

  async getCropCalendarByFarm(farmId: string): Promise<CropCalendarEntry[]> {
    const results = await db.select({ 
      cropCalendarEntry: cropCalendarEntries 
    }).from(cropCalendarEntries)
      .innerJoin(plots, eq(cropCalendarEntries.plotId, plots.id))
      .where(eq(plots.farmId, farmId))
      .orderBy(desc(cropCalendarEntries.plantingDate));
    return results.map(r => r.cropCalendarEntry);
  }

  async createCropCalendarEntry(entry: InsertCropCalendarEntry): Promise<CropCalendarEntry> {
    const [calendarEntry] = await db.insert(cropCalendarEntries).values(entry).returning();
    return calendarEntry;
  }

  async updateCropCalendarEntry(id: string, entry: Partial<InsertCropCalendarEntry>): Promise<CropCalendarEntry | undefined> {
    const [updated] = await db.update(cropCalendarEntries).set(entry).where(eq(cropCalendarEntries.id, id)).returning();
    return updated || undefined;
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByFarm(farmId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.farmId, farmId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const updateData: any = { ...task };
    if (task.status === 'completed') {
      updateData.completedAt = new Date();
    }
    const [updated] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return updated || undefined;
  }

  // Advisories
  async getAdvisory(id: string): Promise<Advisory | undefined> {
    const [advisory] = await db.select().from(advisories).where(eq(advisories.id, id));
    return advisory || undefined;
  }

  async getAdvisoriesByFarm(farmId: string): Promise<Advisory[]> {
    return await db.select().from(advisories)
      .where(and(eq(advisories.farmId, farmId), eq(advisories.isActive, true)))
      .orderBy(desc(advisories.createdAt));
  }

  async createAdvisory(insertAdvisory: InsertAdvisory): Promise<Advisory> {
    const [advisory] = await db.insert(advisories).values(insertAdvisory).returning();
    return advisory;
  }

  // Alerts
  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async getAlertsByFarm(farmId: string): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(eq(alerts.farmId, farmId))
      .orderBy(desc(alerts.createdAt));
  }

  async getUnacknowledgedAlerts(farmId: string): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(and(eq(alerts.farmId, farmId), eq(alerts.isAcknowledged, false)))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert;
  }

  async acknowledgeAlert(id: string, userId: string): Promise<Alert | undefined> {
    const [updated] = await db.update(alerts)
      .set({ 
        isAcknowledged: true, 
        acknowledgedBy: userId, 
        acknowledgedAt: new Date() 
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated || undefined;
  }

  // Alert Thresholds
  async getAlertThresholds(farmId: string): Promise<AlertThreshold[]> {
    return await db.select().from(alertThresholds)
      .where(and(eq(alertThresholds.farmId, farmId), eq(alertThresholds.isActive, true)));
  }

  async createAlertThreshold(threshold: InsertAlertThreshold): Promise<AlertThreshold> {
    const [alertThreshold] = await db.insert(alertThresholds).values(threshold).returning();
    return alertThreshold;
  }

  // WEI Records
  async getWeiRecords(plotId: string): Promise<WeiRecord[]> {
    return await db.select().from(weiRecords)
      .where(eq(weiRecords.plotId, plotId))
      .orderBy(desc(weiRecords.startDate));
  }

  async createWeiRecord(record: InsertWeiRecord): Promise<WeiRecord> {
    const [weiRecord] = await db.insert(weiRecords).values(record).returning();
    return weiRecord;
  }
}

export const storage = new DatabaseStorage();
