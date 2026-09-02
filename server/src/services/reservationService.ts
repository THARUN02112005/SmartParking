import { getDb } from '../database.js';
import { Reservation } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class ReservationService {
  createReservation(userId: string, vehicleId: string, slotId: string, startTime: string, expiryTime: string): Reservation {
    const db = getDb();

    const slot = db.prepare(`SELECT * FROM parking_slots WHERE id = ?`).get(slotId) as { status: string } | undefined;
    if (!slot) throw new Error('Slot not found');
    if (slot.status !== 'AVAILABLE') throw new Error('Slot is not available');

    const conflictingReservation = db.prepare(`
      SELECT id FROM reservations
      WHERE slotId = ? AND status = 'ACTIVE'
      AND ((startTime <= ? AND expiryTime > ?) OR (startTime < ? AND expiryTime >= ?) OR (startTime >= ? AND expiryTime <= ?))
    `).get(slotId, expiryTime, startTime, expiryTime, startTime, startTime, expiryTime);

    if (conflictingReservation) throw new Error('Slot is already reserved for this time period');

    const id = uuidv4();

    db.prepare(`
      INSERT INTO reservations (id, userId, vehicleId, slotId, startTime, expiryTime, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(id, userId, vehicleId, slotId, startTime, expiryTime);

    db.prepare(`UPDATE parking_slots SET status = 'RESERVED' WHERE id = ?`).run(slotId);

    return db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(id) as Reservation;
  }

  cancelReservation(reservationId: string): Reservation | undefined {
    const db = getDb();
    const reservation = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(reservationId) as Reservation | undefined;
    if (!reservation) return undefined;

    db.prepare(`UPDATE reservations SET status = 'CANCELLED' WHERE id = ?`).run(reservationId);
    db.prepare(`UPDATE parking_slots SET status = 'AVAILABLE' WHERE id = ?`).run(reservation.slotId);

    return db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(reservationId) as Reservation;
  }

  getActiveReservations(userId: string): Reservation[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM reservations
      WHERE userId = ? AND status = 'ACTIVE' AND expiryTime > ?
      ORDER BY startTime ASC
    `).all(userId, new Date().toISOString()) as Reservation[];
  }

  checkAndExpireReservations(): Reservation[] {
    const db = getDb();
    const now = new Date().toISOString();
    const expired = db.prepare(`
      SELECT * FROM reservations WHERE status = 'ACTIVE' AND expiryTime <= ?
    `).all(now) as Reservation[];

    for (const reservation of expired) {
      db.prepare(`UPDATE reservations SET status = 'EXPIRED' WHERE id = ?`).run(reservation.id);
      const hasActiveSession = db.prepare(`
        SELECT id FROM parking_sessions WHERE slotId = ? AND status = 'ACTIVE'
      `).get(reservation.slotId);
      if (!hasActiveSession) {
        db.prepare(`UPDATE parking_slots SET status = 'AVAILABLE' WHERE id = ? AND status = 'RESERVED'`).run(reservation.slotId);
      }
    }

    return expired;
  }

  getUserReservations(userId: string): any[] {
    const db = getDb();
    return db.prepare(`
      SELECT r.*, p.slotNumber, p.slotType, v.vehicleNumber, v.vehicleType
      FROM reservations r
      LEFT JOIN parking_slots p ON r.slotId = p.id
      LEFT JOIN vehicles v ON r.vehicleId = v.id
      WHERE r.userId = ?
      ORDER BY r.startTime DESC
    `).all(userId);
  }

  getAllReservations(): any[] {
    const db = getDb();
    return db.prepare(`
      SELECT r.*, p.slotNumber, p.slotType, v.vehicleNumber, v.vehicleType, u.name as userName, u.email as userEmail
      FROM reservations r
      LEFT JOIN parking_slots p ON r.slotId = p.id
      LEFT JOIN vehicles v ON r.vehicleId = v.id
      LEFT JOIN users u ON r.userId = u.id
      ORDER BY r.startTime DESC
    `).all();
  }

  getAvailableSlotsForReservation(startTime: string, expiryTime: string, vehicleType?: string): Array<{ id: string; slotNumber: string; zoneId: string; zoneName: string }> {
    const db = getDb();
    let query = `
      SELECT s.id, s.slotNumber, s.zoneId, z.name as zoneName
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      WHERE s.status = 'AVAILABLE'
      AND s.id NOT IN (
        SELECT slotId FROM reservations
        WHERE status = 'ACTIVE'
        AND ((startTime <= ? AND expiryTime > ?) OR (startTime < ? AND expiryTime >= ?) OR (startTime >= ? AND expiryTime <= ?))
      )
    `;
    const params: string[] = [expiryTime, startTime, expiryTime, startTime, startTime, expiryTime];

    if (vehicleType) {
      if (vehicleType === 'EV_CAR' || vehicleType === 'EV_BIKE') {
        query += ` AND (s.slotType = 'EV' OR s.slotType = 'STANDARD' OR s.slotType = 'COMPACT' OR s.slotType = 'PREMIUM')`;
      } else if (vehicleType === 'CAR') {
        query += ` AND (s.slotType = 'STANDARD' OR s.slotType = 'COMPACT' OR s.slotType = 'PREMIUM')`;
      } else if (vehicleType === 'BIKE') {
        query += ` AND (s.slotType = 'STANDARD' OR s.slotType = 'COMPACT')`;
      }
    }

    query += ` ORDER BY z.name, s.slotNumber`;
    return db.prepare(query).all(...params) as Array<{ id: string; slotNumber: string; zoneId: string; zoneName: string }>;
  }
}

export const reservationService = new ReservationService();
