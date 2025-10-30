# 🌱 FarmMonitor - Smart Agriculture IoT Platform

A modern, full-stack IoT platform for precision agriculture that enables farmers to monitor and control their farming operations through real-time sensor data, automated systems, and intelligent analytics.

## ✨ Features

### 🔧 Core Functionality
- **Real-time Sensor Monitoring** - Track pH, TDS, soil moisture, water levels, temperature, humidity, and rainfall
- **Actuator Control** - Remote control of pumps, irrigation systems, and environmental controls
- **Multi-Farm Management** - Manage multiple farms and plots from a single dashboard
- **User Role Management** - Support for farmers, agronomists, and cooperative administrators
- **Real-time Alerts** - Configurable thresholds with severity-based notifications

### 📊 Smart Analytics
- **Interactive Dashboards** - Real-time data visualization with charts and gauges
- **Crop Calendar** - Track planting schedules, growth stages, and harvest predictions
- **Task Management** - Assign and track farming tasks with priority levels
- **Water Efficiency Index (WEI)** - Monitor and optimize water usage efficiency
- **Historical Data Analysis** - Trend analysis and performance insights

### 🌐 Modern Architecture
- **WebSocket Integration** - Real-time data streaming for instant updates
- **MQTT Support** - IoT device communication protocol (configurable)
- **Responsive Design** - Mobile-first UI with dark/light theme support
- **RESTful API** - Clean, documented API endpoints
- **Type-safe Development** - Full TypeScript implementation

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Radix UI** components for accessibility
- **Recharts** for data visualization
- **React Query** for state management
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **WebSocket** for real-time communication
- **MQTT** for IoT device integration
- **JWT Authentication** with sessions

### Database & Infrastructure
- **PostgreSQL** with Drizzle ORM
- **Neon Database** support
- **WebSocket Server** for real-time updates
- **MQTT Broker** integration ready

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd FarmMonitor
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/farmmonitor"

# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET="your-jwt-secret-key"
SESSION_SECRET="your-session-secret"

# MQTT (Optional)
MQTT_URL="mqtt://localhost:1883"
```

4. **Database Setup**
```bash
# Push database schema
npm run db:push
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🏗️ Project Structure

```
FarmMonitor/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API client
│   │   └── types/         # TypeScript type definitions
├── server/                # Express backend application
│   ├── routes.ts          # API route definitions
│   ├── db.ts             # Database connection
│   ├── storage.ts        # Data access layer
│   └── services/         # Business logic services
├── shared/               # Shared code between client/server
│   └── schema.ts         # Database schema and types
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run check        # TypeScript type checking

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to database
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Farms & Devices
- `GET /api/farms` - List user's farms
- `GET /api/farms/:id/devices` - Get farm devices
- `POST /api/farms` - Create new farm

### Sensor Data
- `GET /api/devices/:id/sensor/:type/latest` - Latest sensor reading
- `GET /api/devices/:id/sensor/:type/history` - Historical sensor data
- `POST /api/sensor-data` - Record sensor data

### Actuator Control
- `POST /api/actuators/:id/control` - Control actuator state
- `GET /api/devices/:id/actuator-states` - Get actuator states

### Tasks & Alerts
- `GET /api/farms/:id/tasks` - Get farm tasks
- `POST /api/tasks` - Create new task
- `GET /api/farms/:id/alerts` - Get farm alerts

## 🌐 WebSocket Events

Real-time updates are delivered via WebSocket connection:

```javascript
// Connect to WebSocket
const ws = new WebSocket(`ws://localhost:5000/ws/${farmId}`);

// Listen for sensor updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'sensorUpdate') {
    // Handle real-time sensor data
  }
};
```

## 🔌 IoT Device Integration

### MQTT Topics
The platform supports MQTT communication with IoT devices:

```
# Sensor data publishing
farm/{farmId}/device/{deviceId}/sensor/{sensorType}

# Actuator control
farm/{farmId}/device/{deviceId}/actuator/{actuatorType}/command
```

### Supported Sensors
- **pH Sensors** - Soil/water acidity measurement
- **TDS Sensors** - Total dissolved solids in water
- **Soil Moisture** - Soil water content percentage
- **Water Depth** - Water level monitoring
- **Water Flow** - Flow rate measurement
- **Rainfall** - Precipitation monitoring
- **Temperature** - Environmental temperature
- **Humidity** - Air humidity levels

### Supported Actuators
- **Water Pumps** - Irrigation system control
- **Humidifiers** - Environmental humidity control
- **Valves** - Water flow control
- **Fans** - Ventilation control

## 🎯 User Roles

### Farmer
- Monitor their own farms and devices
- Control actuators and irrigation systems
- View analytics and reports
- Manage tasks and crop calendar

### Agronomist
- Access multiple farms for consultation
- Provide recommendations and advisories
- Analyze crop performance data
- Create specialized reports

### Cooperative Admin
- Oversee multiple farms in cooperative
- Manage user access and permissions
- Generate aggregate reports
- Coordinate resources and tasks

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Granular permissions system
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Parameterized queries with Drizzle ORM
- **CORS Configuration** - Cross-origin request security

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
Ensure all production environment variables are set:
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong JWT signing key
- `SESSION_SECRET` - Session encryption key
- `PORT` - Server port (default: 5000)

### Database Migration
```bash
npm run db:push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints and WebSocket events

## 🔮 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced ML analytics and predictions
- [ ] Weather API integration
- [ ] Satellite imagery integration
- [ ] Multi-language support
- [ ] Advanced reporting and export features
- [ ] Integration with agricultural marketplaces

---

Built with ❤️ for modern agriculture and sustainable farming practices.