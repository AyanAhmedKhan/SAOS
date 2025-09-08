import { apiRequest } from './queryClient';

const API_BASE = '/api';

export const api = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },

  register: async (userData: any) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await apiRequest('GET', `${API_BASE}/users/me`);
    return response.json();
  },

  // Farms
  getFarms: async () => {
    const response = await apiRequest('GET', `${API_BASE}/farms`);
    return response.json();
  },

  createFarm: async (farmData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/farms`, farmData);
    return response.json();
  },

  getFarm: async (farmId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/farms/${farmId}`);
    return response.json();
  },

  // Plots
  getPlots: async (farmId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/farms/${farmId}/plots`);
    return response.json();
  },

  createPlot: async (farmId: string, plotData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/farms/${farmId}/plots`, plotData);
    return response.json();
  },

  // Devices
  getDevices: async (farmId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/farms/${farmId}/devices`);
    return response.json();
  },

  createDevice: async (farmId: string, deviceData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/farms/${farmId}/devices`, deviceData);
    return response.json();
  },

  // Sensor Data
  getSensorData: async (deviceId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiRequest('GET', `${API_BASE}/devices/${deviceId}/sensors${params}`);
    return response.json();
  },

  getLatestSensorData: async (deviceId: string, sensorType: string) => {
    const response = await apiRequest('GET', `${API_BASE}/devices/${deviceId}/sensors/latest?sensorType=${sensorType}`);
    return response.json();
  },

  createSensorData: async (deviceId: string, sensorData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/devices/${deviceId}/sensors`, sensorData);
    return response.json();
  },

  // Actuators
  getActuatorStates: async (deviceId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/devices/${deviceId}/actuators`);
    return response.json();
  },

  controlActuator: async (deviceId: string, actuatorData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/devices/${deviceId}/actuators`, actuatorData);
    return response.json();
  },

  // Tasks
  getTasks: async (farmId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/farms/${farmId}/tasks`);
    return response.json();
  },

  createTask: async (farmId: string, taskData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/farms/${farmId}/tasks`, taskData);
    return response.json();
  },

  updateTask: async (taskId: string, updates: any) => {
    const response = await apiRequest('PATCH', `${API_BASE}/tasks/${taskId}`, updates);
    return response.json();
  },

  // Alerts
  getAlerts: async (farmId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/farms/${farmId}/alerts`);
    return response.json();
  },

  acknowledgeAlert: async (alertId: string) => {
    const response = await apiRequest('POST', `${API_BASE}/alerts/${alertId}/acknowledge`);
    return response.json();
  },

  // Analytics
  getWeiData: async (plotId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/analytics/wei/${plotId}`);
    return response.json();
  },

  getHeatmapData: async (farmId: string, sensorType?: string) => {
    const params = sensorType ? `?sensorType=${sensorType}` : '';
    const response = await apiRequest('GET', `${API_BASE}/analytics/heatmap/${farmId}${params}`);
    return response.json();
  },

  // Crop Calendar
  getCropCalendar: async (farmId: string) => {
    const response = await apiRequest('GET', `${API_BASE}/farms/${farmId}/calendar`);
    return response.json();
  },

  createCropCalendarEntry: async (farmId: string, entryData: any) => {
    const response = await apiRequest('POST', `${API_BASE}/farms/${farmId}/calendar`, entryData);
    return response.json();
  },

  // Data Generation
  generateData: async (farmId: string) => {
    const response = await apiRequest('POST', `${API_BASE}/data/generate/${farmId}`);
    return response.json();
  },

  startDataGeneration: async (farmId: string) => {
    const response = await apiRequest('POST', `${API_BASE}/data/start-generation/${farmId}`);
    return response.json();
  },

  stopDataGeneration: async (farmId: string) => {
    const response = await apiRequest('POST', `${API_BASE}/data/stop-generation/${farmId}`);
    return response.json();
  },
};
