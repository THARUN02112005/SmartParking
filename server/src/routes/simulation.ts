import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { simulationService } from '../services/simulationService.js';
import { getDb } from '../database.js';

const router = Router();

router.post('/entry', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { vehicleType } = req.body;
    if (!vehicleType || !['CAR', 'BIKE', 'EV_CAR', 'EV_BIKE'].includes(vehicleType)) {
      res.status(400).json({ error: 'Valid vehicleType required (CAR, BIKE, EV_CAR, EV_BIKE)' });
      return;
    }

    const result = simulationService.simulateVehicleEntry(vehicleType);
    res.status(201).json({
      vehicle: result.vehicle,
      path: result.path,
      recommendation: result.recommendation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to simulate entry' });
  }
});

router.post('/exit/:vehicleId', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const result = simulationService.simulateVehicleExit(req.params.vehicleId);
    if (!result.vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    res.json({
      vehicle: result.vehicle,
      path: result.path,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to simulate exit' });
  }
});

router.post('/auto-park', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const result = simulationService.autoPark();
    res.status(201).json({
      entry: result.entry,
      exit: result.exit,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to auto-park' });
  }
});

router.post('/violation', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const violation = simulationService.simulateViolation();
    res.status(201).json({ violation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to simulate violation' });
  }
});

router.post('/random-traffic', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = simulationService.generateRandomTraffic();
    res.status(201).json({ vehicles });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate random traffic' });
  }
});

router.post('/pause', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    simulationService.pause();
    res.json({ message: 'Simulation paused' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to pause simulation' });
  }
});

router.post('/resume', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    simulationService.resume();
    res.json({ message: 'Simulation resumed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resume simulation' });
  }
});

router.post('/reset', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    simulationService.reset();
    res.json({ message: 'Simulation reset' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reset simulation' });
  }
});

router.get('/state', (_req, res: Response) => {
  try {
    const state = simulationService.getSimulationState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get simulation state' });
  }
});

router.get('/ai-panel', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const recommendations = db.prepare(`
      SELECT ar.*, v.vehicleNumber, v.vehicleType, s.slotNumber
      FROM ai_recommendations ar
      LEFT JOIN vehicles v ON ar.vehicleId = v.id
      LEFT JOIN parking_slots s ON ar.recommendedSlot = s.id
      ORDER BY ar.createdAt DESC
      LIMIT 20
    `).all();
    res.json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get AI panel data' });
  }
});

export default router;
