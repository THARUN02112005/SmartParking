import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { parkingService } from '../services/parkingService.js';
import { simulationService } from '../services/simulationService.js';

const router = Router();

router.get('/zones', (_req, res: Response) => {
  try {
    const zones = parkingService.getAllZones();
    res.json({ zones });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch zones' });
  }
});

router.get('/slots', (req, res: Response) => {
  try {
    const { zoneId } = req.query;
    const slots = zoneId ? parkingService.getSlotsByZone(zoneId as string) : parkingService.getAllSlots();
    res.json({ slots });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch slots' });
  }
});

router.get('/slots/:id', (req, res: Response) => {
  try {
    const slot = parkingService.getSlotById(req.params.id);
    if (!slot) {
      res.status(404).json({ error: 'Slot not found' });
      return;
    }
    res.json({ slot });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch slot' });
  }
});

router.put('/slots/:id/status', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !['AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED', 'MAINTENANCE'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const slot = parkingService.updateSlotStatus(req.params.id, status);
    if (!slot) {
      res.status(404).json({ error: 'Slot not found' });
      return;
    }

    res.json({ slot });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update slot status' });
  }
});

router.get('/available', (req, res: Response) => {
  try {
    const { vehicleType } = req.query;
    const slots = parkingService.getAvailableSlots(vehicleType as string);
    res.json({ slots });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch available slots' });
  }
});

router.post('/entry', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, slotId } = req.body;

    const result = simulationService.simulateVehicleEntry(req.body.vehicleType || 'CAR');
    const session = parkingService.createParkingSession({
      vehicleId: result.vehicle.vehicleId,
      userId: req.user!.id,
      slotId: result.vehicle.targetSlot ?? undefined,
    });

    res.status(201).json({
      session,
      simulation: result.vehicle,
      recommendation: result.recommendation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process entry' });
  }
});

router.post('/exit/:sessionId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const session = parkingService.closeParkingSession(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process exit' });
  }
});

router.get('/sessions', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const sessions = req.user!.role === 'ADMIN'
      ? parkingService.getActiveSessions()
      : parkingService.getUserSessions(req.user!.id);
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
  }
});

router.get('/sessions/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const session = parkingService.getSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && session.userId !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch session' });
  }
});

router.get('/active', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const sessions = req.user!.role === 'ADMIN'
      ? parkingService.getActiveSessions()
      : parkingService.getUserActiveSessions(req.user!.id);
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch active sessions' });
  }
});

export default router;
