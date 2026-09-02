# SmartParking AI

AI-Powered Smart Parking Management System with animated 2D parking simulation, intelligent slot recommendation, A* pathfinding, and real-time dashboards.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Socket.IO Client, Lucide React
- **Backend:** Express.js, TypeScript, Socket.IO, better-sqlite3, JWT Auth, Zod
- **Database:** SQLite (WAL mode)
- **Real-time:** Socket.IO

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Seed Database

```bash
cd server && npm run seed
```

### 3. Start Backend (port 3001)

```bash
cd server && npm run dev
```

### 4. Start Frontend (port 5173)

```bash
cd client && npm run dev
```

Open http://localhost:5173

## Demo Credentials

| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@smartparking.com   | admin123    |
| User  | rahul@example.com        | password123 |
| User  | priya@example.com        | password123 |
| User  | amit@example.com         | password123 |

## Features

### Animated Parking Simulation
- 2D top-down canvas rendering of a parking facility
- Entrance, exit, roads, and 32 parking slots across 4 zones
- Animated vehicle movement with path visualization
- Smooth rotation, interpolation, and parking animations
- Zoom and pan support

### AI Smart Slot Recommendation
- Scores each available slot based on distance, vehicle compatibility, congestion, priority, and EV charging needs
- Provides human-readable explanations for each recommendation
- Real-time confidence scoring

### A* Pathfinding
- Grid-based pathfinding from entrance to slot and slot to exit
- Avoids occupied areas, blocked roads, and restricted zones
- Visual route display on the simulation map

### Parking Zones
| Zone | Type       | Slots |
|------|------------|-------|
| A    | Cars       | 12    |
| B    | Bikes      | 8     |
| C    | EV         | 6     |
| D    | Premium    | 6     |

### Role-Based Access

**User/Driver:**
- Register, login, manage profile
- Add/manage vehicles
- View live parking simulation
- Reserve parking slots
- View AI recommendations
- Simulate vehicle entry/exit
- View parking history and charges

**Admin:**
- Full dashboard with analytics and charts
- Live simulation control panel
- Manage zones, slots, users, pricing
- Simulate parking violations
- View AI decision logs
- Revenue and occupancy analytics

### Additional Features
- Real-time Socket.IO updates
- Parking reservation system with expiry
- Configurable parking fee calculation
- Parking violation simulation and alerts
- Notification system
- Statistical parking prediction
- Dark mode UI

## Project Structure

```
SmartParking/
  client/                    # React frontend
    src/
      components/
        dashboard/           # Charts and stat cards
        layout/              # Sidebar, Header, Layout
        simulation/          # Canvas, Controls, AI Panel
        ui/                  # Reusable UI components
      pages/
        public/              # Landing, Login, Register
        user/                # User dashboard and features
        admin/               # Admin dashboard and management
      services/              # API client
      context/               # Auth and Socket contexts
      hooks/                 # Custom hooks
      types/                 # TypeScript types
  server/                    # Express backend
    src/
      routes/                # API route handlers
      services/              # Business logic services
      middleware/             # Auth middleware
      models/                # Type definitions
      database.ts            # SQLite setup and schema
      seed.ts                # Demo data generation
      index.ts               # Server entry point
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Parking
- `GET /api/parking/zones` - List zones
- `GET /api/parking/slots` - List all slots
- `GET /api/parking/available` - Available slots
- `POST /api/parking/entry` - Simulate vehicle entry
- `POST /api/parking/exit/:sessionId` - Simulate vehicle exit
- `GET /api/parking/sessions` - List sessions

### Simulation
- `POST /api/simulation/entry` - Simulate car/bike/EV entry
- `POST /api/simulation/exit/:vehicleId` - Simulate exit
- `POST /api/simulation/auto-park` - Auto park cycle
- `POST /api/simulation/random-traffic` - Generate traffic
- `POST /api/simulation/pause` - Pause simulation
- `POST /api/simulation/resume` - Resume simulation
- `POST /api/simulation/reset` - Reset simulation
- `GET /api/simulation/state` - Get simulation state

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/analytics/*` - Various analytics
- `GET /api/admin/violations` - List violations
- `POST /api/admin/violations/simulate` - Simulate violation
- `GET /api/admin/pricing` - Pricing config
- `PUT /api/admin/pricing/:id` - Update pricing

## License

MIT
