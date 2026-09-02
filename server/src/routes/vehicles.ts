import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Vehicle } from '../models/types.js';

const router = Router();

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const vehicles = db.prepare(`SELECT * FROM vehicles WHERE userId = ? ORDER BY createdAt DESC`).all(req.user!.id) as Vehicle[];
    res.json({ vehicles });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch vehicles' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { vehicleNumber, vehicleType, model, color } = req.body;
    if (!vehicleNumber || !vehicleType) {
      res.status(400).json({ error: 'vehicleNumber and vehicleType are required' });
      return;
    }

    if (!['CAR', 'BIKE', 'EV_CAR', 'EV_BIKE'].includes(vehicleType)) {
      res.status(400).json({ error: 'Invalid vehicle type' });
      return;
    }

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM vehicles WHERE vehicleNumber = ?`).get(vehicleNumber);
    if (existing) {
      res.status(409).json({ error: 'Vehicle number already registered' });
      return;
    }

    const id = uuidv4();
    const isEV = vehicleType.startsWith('EV') ? 1 : 0;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO vehicles (id, userId, vehicleNumber, vehicleType, model, color, isEV, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, vehicleNumber, vehicleType, model || null, color || null, isEV, createdAt);

    const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(id) as Vehicle;
    res.status(201).json({ vehicle });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add vehicle' });
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ? AND userId = ?`).get(req.params.id, req.user!.id) as Vehicle | undefined;

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const { vehicleNumber, vehicleType, model, color } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (vehicleNumber) { updates.push('vehicleNumber = ?'); params.push(vehicleNumber); }
    if (vehicleType) { updates.push('vehicleType = ?'); params.push(vehicleType); }
    if (model !== undefined) { updates.push('model = ?'); params.push(model); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare(`SELECT * FROM vehicles WHERE id = ?`).get(req.params.id) as Vehicle;
    res.json({ vehicle: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update vehicle' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id = ? AND userId = ?`).get(req.params.id, req.user!.id) as Vehicle | undefined;

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const activeSession = db.prepare(`SELECT id FROM parking_sessions WHERE vehicleId = ? AND status = 'ACTIVE'`).get(req.params.id);
    if (activeSession) {
      res.status(400).json({ error: 'Cannot delete vehicle with active parking session' });
      return;
    }

    db.prepare(`DELETE FROM vehicles WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete vehicle' });
  }
});

export default router;
