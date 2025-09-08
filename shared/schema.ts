import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["farmer", "agronomist", "coop_admin"]);
export const cropStageEnum = pgEnum("crop_stage", ["seeding", "germination", "vegetative", "flowering", "fruiting", "harvest"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "cancelled"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["low", "medium", "high", "critical"]);
export const deviceStatusEnum = pgEnum("device_status", ["active", "inactive", "maintenance", "error"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("farmer"),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Farms table
export const farms = pgTable("farms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  area: real("area").notNull(), // in hectares
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  coordinates: jsonb("coordinates"), // GeoJSON polygon
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Plots table (subdivisions of farms)
export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  farmId: varchar("farm_id").notNull().references(() => farms.id),
  area: real("area").notNull(), // in hectares
  soilType: text("soil_type"),
  coordinates: jsonb("coordinates"), // GeoJSON polygon
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Devices table
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // sensor, actuator
  farmId: varchar("farm_id").notNull().references(() => farms.id),
  plotId: varchar("plot_id").references(() => plots.id),
  status: deviceStatusEnum("status").notNull().default("active"),
  location: jsonb("location"), // lat, lng coordinates
  config: jsonb("config"), // device-specific configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sensor Data table
export const sensorData = pgTable("sensor_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  sensorType: text("sensor_type").notNull(), // ph, tds, soil_moisture, water_depth, water_flow, rainfall, temperature, humidity
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Actuator States table
export const actuatorStates = pgTable("actuator_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  actuatorType: text("actuator_type").notNull(), // pump1, pump2, pump3, humidifier
  isActive: boolean("is_active").notNull().default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Crops table
export const crops = pgTable("crops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  variety: text("variety"),
  optimalPh: real("optimal_ph"),
  optimalTds: real("optimal_tds"),
  optimalMoisture: real("optimal_moisture"),
  growthDays: integer("growth_days").notNull(),
  stages: jsonb("stages"), // Array of stage definitions with durations
});

// Crop Calendar Entries
export const cropCalendarEntries = pgTable("crop_calendar_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").notNull().references(() => plots.id),
  cropId: varchar("crop_id").notNull().references(() => crops.id),
  plantingDate: timestamp("planting_date").notNull(),
  expectedHarvest: timestamp("expected_harvest").notNull(),
  currentStage: cropStageEnum("current_stage").notNull().default("seeding"),
  stageStartDate: timestamp("stage_start_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to").notNull().references(() => users.id),
  farmId: varchar("farm_id").notNull().references(() => farms.id),
  plotId: varchar("plot_id").references(() => plots.id),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Advisories table
export const advisories = pgTable("advisories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // fertilizer, pesticide, irrigation, general
  farmId: varchar("farm_id").notNull().references(() => farms.id),
  plotId: varchar("plot_id").references(() => plots.id),
  cropId: varchar("crop_id").references(() => crops.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  farmId: varchar("farm_id").notNull().references(() => farms.id),
  deviceId: varchar("device_id").references(() => devices.id),
  isAcknowledged: boolean("is_acknowledged").notNull().default(false),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alert Thresholds table
export const alertThresholds = pgTable("alert_thresholds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull().references(() => farms.id),
  sensorType: text("sensor_type").notNull(),
  minValue: real("min_value"),
  maxValue: real("max_value"),
  severity: alertSeverityEnum("severity").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Water Efficiency Index Records
export const weiRecords = pgTable("wei_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").notNull().references(() => plots.id),
  waterUsed: real("water_used").notNull(), // in liters
  yieldObtained: real("yield_obtained"), // in kg
  weiScore: real("wei_score").notNull(),
  period: text("period").notNull(), // weekly, monthly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  farms: many(farms),
  tasks: many(tasks),
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  owner: one(users, { fields: [farms.ownerId], references: [users.id] }),
  plots: many(plots),
  devices: many(devices),
  tasks: many(tasks),
  advisories: many(advisories),
  alerts: many(alerts),
  alertThresholds: many(alertThresholds),
}));

export const plotsRelations = relations(plots, ({ one, many }) => ({
  farm: one(farms, { fields: [plots.farmId], references: [farms.id] }),
  devices: many(devices),
  cropCalendarEntries: many(cropCalendarEntries),
  tasks: many(tasks),
  advisories: many(advisories),
  weiRecords: many(weiRecords),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  farm: one(farms, { fields: [devices.farmId], references: [farms.id] }),
  plot: one(plots, { fields: [devices.plotId], references: [plots.id] }),
  sensorData: many(sensorData),
  actuatorStates: many(actuatorStates),
  alerts: many(alerts),
}));

export const sensorDataRelations = relations(sensorData, ({ one }) => ({
  device: one(devices, { fields: [sensorData.deviceId], references: [devices.id] }),
}));

export const actuatorStatesRelations = relations(actuatorStates, ({ one }) => ({
  device: one(devices, { fields: [actuatorStates.deviceId], references: [devices.id] }),
}));

export const cropsRelations = relations(crops, ({ many }) => ({
  cropCalendarEntries: many(cropCalendarEntries),
  advisories: many(advisories),
}));

export const cropCalendarEntriesRelations = relations(cropCalendarEntries, ({ one }) => ({
  plot: one(plots, { fields: [cropCalendarEntries.plotId], references: [plots.id] }),
  crop: one(crops, { fields: [cropCalendarEntries.cropId], references: [crops.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
  farm: one(farms, { fields: [tasks.farmId], references: [farms.id] }),
  plot: one(plots, { fields: [tasks.plotId], references: [plots.id] }),
}));

export const advisoriesRelations = relations(advisories, ({ one }) => ({
  farm: one(farms, { fields: [advisories.farmId], references: [farms.id] }),
  plot: one(plots, { fields: [advisories.plotId], references: [plots.id] }),
  crop: one(crops, { fields: [advisories.cropId], references: [crops.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  farm: one(farms, { fields: [alerts.farmId], references: [farms.id] }),
  device: one(devices, { fields: [alerts.deviceId], references: [devices.id] }),
  acknowledgedByUser: one(users, { fields: [alerts.acknowledgedBy], references: [users.id] }),
}));

export const alertThresholdsRelations = relations(alertThresholds, ({ one }) => ({
  farm: one(farms, { fields: [alertThresholds.farmId], references: [farms.id] }),
}));

export const weiRecordsRelations = relations(weiRecords, ({ one }) => ({
  plot: one(plots, { fields: [weiRecords.plotId], references: [plots.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertFarmSchema = createInsertSchema(farms).omit({ id: true, createdAt: true });
export const insertPlotSchema = createInsertSchema(plots).omit({ id: true, createdAt: true });
export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true, createdAt: true });
export const insertSensorDataSchema = createInsertSchema(sensorData).omit({ id: true, timestamp: true });
export const insertActuatorStateSchema = createInsertSchema(actuatorStates).omit({ id: true, timestamp: true });
export const insertCropSchema = createInsertSchema(crops).omit({ id: true });
export const insertCropCalendarEntrySchema = createInsertSchema(cropCalendarEntries).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertAdvisorySchema = createInsertSchema(advisories).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true, acknowledgedAt: true });
export const insertAlertThresholdSchema = createInsertSchema(alertThresholds).omit({ id: true, createdAt: true });
export const insertWeiRecordSchema = createInsertSchema(weiRecords).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Farm = typeof farms.$inferSelect;
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Plot = typeof plots.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type ActuatorState = typeof actuatorStates.$inferSelect;
export type InsertActuatorState = z.infer<typeof insertActuatorStateSchema>;
export type Crop = typeof crops.$inferSelect;
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type CropCalendarEntry = typeof cropCalendarEntries.$inferSelect;
export type InsertCropCalendarEntry = z.infer<typeof insertCropCalendarEntrySchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Advisory = typeof advisories.$inferSelect;
export type InsertAdvisory = z.infer<typeof insertAdvisorySchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = z.infer<typeof insertAlertThresholdSchema>;
export type WeiRecord = typeof weiRecords.$inferSelect;
export type InsertWeiRecord = z.infer<typeof insertWeiRecordSchema>;
