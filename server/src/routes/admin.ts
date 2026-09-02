import { Router, Response } from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analyticsService.js';
import { notificationService } from '../services/notificationService.js';
import { simulationService } from '../services/simulationService.js';
import { reservationService } from '../services/reservationService.js';
import { User } from '../models/types.js';

const router = Router();

router.get('/dashboard', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const stats = analyticsService.getDashboardStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
  }
});

router.get('/reservations', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const reservations = reservationService.getAllReservations();
    res.json({ reservations });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reservations' });
  }
});

router.get('/analytics/occupancy', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = analyticsService.getOccupancyOverTime(days);
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch occupancy data' });
  }
});

router.get('/analytics/revenue', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = analyticsService.getRevenueOverTime(days);
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch revenue data' });
  }
});

router.get('/analytics/vehicle-types', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const data = analyticsService.getVehicleTypeDistribution();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch vehicle type distribution' });
  }
});

router.get('/analytics/zone-occupancy', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const data = analyticsService.getZoneOccupancy();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch zone occupancy' });
  }
});

router.get('/analytics/peak-hours', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const data = analyticsService.getPeakHours();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch peak hours' });
  }
});

router.get('/analytics/predictions', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const prediction = analyticsService.getPredictionForDate(date);
    res.json({ prediction });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch prediction' });
  }
});

router.get('/violations', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const violations = db.prepare(`SELECT * FROM violations ORDER BY createdAt DESC`).all();
    const stats = analyticsService.getViolationStats();
    res.json({ violations, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch violations' });
  }
});

router.post('/violations/simulate', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const violation = simulationService.simulateViolation();
    res.status(201).json({ violation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to simulate violation' });
  }
});

router.get('/users', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const users = db.prepare(`SELECT id, name, email, phone, role, createdAt FROM users ORDER BY createdAt DESC`).all();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

router.put('/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { role, name, phone } = req.body;
    const now = new Date().toISOString();

    if (role && ['USER', 'ADMIN'].includes(role)) {
      db.prepare(`UPDATE users SET role = ?, updatedAt = ? WHERE id = ?`).run(role, now, req.params.id);
    }
    if (name) {
      db.prepare(`UPDATE users SET name = ?, updatedAt = ? WHERE id = ?`).run(name, now, req.params.id);
    }
    if (phone !== undefined) {
      db.prepare(`UPDATE users SET phone = ?, updatedAt = ? WHERE id = ?`).run(phone, now, req.params.id);
    }

    const user = db.prepare(`SELECT id, name, email, phone, role, createdAt, updatedAt FROM users WHERE id = ?`).get(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

router.get('/pricing', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const pricing = db.prepare(`SELECT * FROM pricing ORDER BY vehicleType`).all();
    res.json({ pricing });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pricing' });
  }
});

router.put('/pricing/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { pricePerHour, minimumFee } = req.body;

    if (pricePerHour !== undefined) {
      db.prepare(`UPDATE pricing SET pricePerHour = ? WHERE id = ?`).run(pricePerHour, req.params.id);
    }
    if (minimumFee !== undefined) {
      db.prepare(`UPDATE pricing SET minimumFee = ? WHERE id = ?`).run(minimumFee, req.params.id);
    }

    const pricing = db.prepare(`SELECT * FROM pricing WHERE id = ?`).get(req.params.id);
    if (!pricing) {
      res.status(404).json({ error: 'Pricing not found' });
      return;
    }
    res.json({ pricing });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update pricing' });
  }
});

router.get('/ai-logs', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const logs = db.prepare(`
      SELECT ar.*, v.vehicleNumber, v.vehicleType
      FROM ai_recommendations ar
      LEFT JOIN vehicles v ON ar.vehicleId = v.id
      ORDER BY ar.createdAt DESC
      LIMIT 50
    `).all();
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch AI logs' });
  }
});

export default router;
