import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { reservationService } from '../services/reservationService.js';

const router = Router();

router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, slotId, startTime, expiryTime } = req.body;
    if (!vehicleId || !slotId || !startTime || !expiryTime) {
      res.status(400).json({ error: 'vehicleId, slotId, startTime, and expiryTime are required' });
      return;
    }

    const reservation = reservationService.createReservation(req.user!.id, vehicleId, slotId, startTime, expiryTime);
    res.status(201).json({ reservation });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create reservation' });
  }
});

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const reservations = reservationService.getUserReservations(req.user!.id);
    res.json({ reservations });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reservations' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const reservation = reservationService.cancelReservation(req.params.id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    res.json({ reservation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel reservation' });
  }
});

router.get('/available-slots', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { startTime, expiryTime, vehicleType } = req.query;
    if (!startTime || !expiryTime) {
      res.status(400).json({ error: 'startTime and expiryTime are required' });
      return;
    }

    const slots = reservationService.getAvailableSlotsForReservation(
      startTime as string,
      expiryTime as string,
      vehicleType as string | undefined
    );
    res.json({ slots });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch available slots' });
  }
});

export default router;
