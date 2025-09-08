export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'farmer' | 'agronomist' | 'coop_admin';
  phone?: string;
  createdAt: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  area: number;
  ownerId: string;
  coordinates?: any;
  createdAt: string;
}

export interface Plot {
  id: string;
  name: string;
  farmId: string;
  area: number;
  soilType?: string;
  coordinates?: any;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'sensor' | 'actuator';
  farmId: string;
  plotId?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  location?: { lat: number; lng: number };
  config?: any;
  createdAt: string;
}

export interface SensorData {
  id: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface ActuatorState {
  id: string;
  deviceId: string;
  actuatorType: string;
  isActive: boolean;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  farmId: string;
  plotId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  farmId: string;
  deviceId?: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface CropCalendarEntry {
  id: string;
  plotId: string;
  cropId: string;
  plantingDate: string;
  expectedHarvest: string;
  currentStage: 'seeding' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  stageStartDate: string;
  notes?: string;
  createdAt: string;
}

export interface WeiRecord {
  id: string;
  plotId: string;
  waterUsed: number;
  yieldObtained?: number;
  weiScore: number;
  period: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface SensorReading {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface HeatmapPoint {
  deviceId: string;
  location?: { lat: number; lng: number };
  value: number;
  timestamp?: string;
}
