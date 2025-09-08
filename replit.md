# Farm Management System (FMS) + IoT Dashboard

## Overview

This is a full-stack Farm Management System with real-time IoT capabilities built using React, Express.js, and PostgreSQL. The system provides farmers with comprehensive farm management tools including sensor monitoring, actuator control, crop calendar management, task scheduling, and analytics. It features real-time data streaming via WebSockets, MQTT sensor integration, and intelligent alerting systems to help optimize agricultural operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript** - Modern component-based UI framework for type-safe development
- **Vite** - Fast build tool and development server for optimal developer experience
- **TanStack Query** - Server state management for efficient data fetching and caching
- **Wouter** - Lightweight client-side routing solution
- **Tailwind CSS + shadcn/ui** - Utility-first styling with pre-built component library
- **Chart.js/Recharts** - Data visualization for analytics and sensor readings
- **WebSocket client** - Real-time communication with backend services

### Backend Architecture
- **Express.js with TypeScript** - RESTful API server with type safety
- **Drizzle ORM** - Type-safe database operations with PostgreSQL
- **WebSocket Server** - Real-time bidirectional communication for live sensor updates
- **JWT Authentication** - Secure token-based user authentication
- **MQTT Integration** - IoT sensor data ingestion via MQTT protocol
- **Background Services** - Data generation, alert processing, and analytics computation

### Database Design
- **PostgreSQL** - Primary relational database with JSON support for flexible data structures
- **Schema Structure**:
  - Users, Farms, Plots (hierarchical farm organization)
  - Devices (sensors and actuators) with location tracking
  - Time-series sensor data with efficient indexing
  - Crop calendar entries with stage-based recommendations
  - Task management with status tracking
  - Alert system with configurable thresholds
  - Analytics records (WEI, cost-benefit, seasonal reports)

### Authentication & Authorization
- **Role-based access control** - Supports farmer, agronomist, and cooperative admin roles
- **JWT tokens** - Stateless authentication with secure token management
- **Password hashing** - bcrypt for secure credential storage
- **Session validation** - Middleware-based route protection

### Real-time Features
- **WebSocket connections** - Farm-specific real-time data streams
- **Live sensor updates** - Automatic UI updates when new sensor data arrives
- **Alert notifications** - Instant notifications for threshold violations
- **Connection management** - Automatic reconnection and connection status indicators

### IoT Integration
- **MQTT subscriber service** - Processes messages from farm/{farm_id}/device/{device_id}/sensor/{sensor} topics
- **Data validation** - JSON schema validation for incoming sensor data
- **Multi-protocol support** - Both MQTT and REST API endpoints for data ingestion
- **Simulated data generation** - Development and testing support with realistic sensor patterns

### Analytics Engine
- **Water Efficiency Index (WEI)** - Calculates efficiency metrics based on water usage and growth indicators
- **Heatmap generation** - Spatial visualization of sensor data across farm plots
- **Seasonal reporting** - Comparative analysis across different growing seasons
- **Cost-benefit analysis** - ROI calculations for irrigation optimization
- **Predictive suggestions** - Simple trend analysis for irrigation scheduling

## External Dependencies

### Core Infrastructure
- **Neon Database** - Serverless PostgreSQL hosting with connection pooling
- **WebSocket protocol** - Native browser and Node.js WebSocket support

### Development & Build Tools
- **Vite** - Frontend build tool with hot module replacement
- **TypeScript** - Type checking and compilation
- **ESBuild** - Fast JavaScript bundling for production builds

### Third-party Services (Optional)
- **MQTT Broker** - External MQTT service for IoT device connectivity (configurable endpoint)
- **Email service** - Console-based email backend for development (extensible to real providers)
- **SMS/WhatsApp integration** - Webhook adapters for notification services (Twilio ready)

### UI Libraries
- **Radix UI primitives** - Accessible component foundations
- **Lucide React** - Icon library for consistent visual elements
- **Class Variance Authority** - Component variant management
- **Tailwind CSS** - Utility-first styling framework

### Data Management
- **React Hook Form** - Form state management with validation
- **Zod** - Runtime type validation and schema parsing
- **Date-fns** - Date manipulation and formatting utilities