import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { getDb, closeDb } from './database.js';
import authRoutes from './routes/auth.js';
import parkingRoutes from './routes/parking.js';
import reservationRoutes from './routes/reservations.js';
import vehicleRoutes from './routes/vehicles.js';
import adminRoutes from './routes/admin.js';
import simulationRoutes from './routes/simulation.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const server = createServer(app);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const isProduction = process.env.NODE_ENV === 'production';

const io = new Server(server, {
  cors: {
    origin: isProduction ? true : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: isProduction ? true : allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Smart Parking Management System API', version: '1.0.0' });
});

if (isProduction) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on('join:parking', () => {
    socket.join('parking-updates');
  });

  socket.on('join:simulation', () => {
    socket.join('simulation-updates');
  });

  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
  });
});

export { io };

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  closeDb();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  closeDb();
  server.close(() => {
    process.exit(0);
  });
});

function startServer() {
  try {
    const database = getDb();
    console.log('Database initialized successfully');

    const userCount = database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
    if (userCount.c === 0) {
      console.log('Empty database detected, seeding...');
      const __dirnameServer = path.dirname(fileURLToPath(import.meta.url));
      execSync('npm run seed', { cwd: path.join(__dirnameServer, '..'), stdio: 'inherit' });
    }

    server.listen(PORT, () => {
      console.log(`\n🚗 Smart Parking Server running on port ${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`🌐 API available at http://localhost:${PORT}`);
      console.log(`📋 Health check at http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
