import { getDb } from '../database.js';
import { ParkingSlot, ParkingSession, ParkingZone, SlotWithZone } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class ParkingService {
  getAllSlots(): SlotWithZone[] {
    const db = getDb();
    return db.prepare(`
      SELECT s.*, z.name as zoneName, z.color as zoneColor
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      ORDER BY z.name, s.slotNumber
    `).all() as SlotWithZone[];
  }

  getSlotsByZone(zoneId: string): SlotWithZone[] {
    const db = getDb();
    return db.prepare(`
      SELECT s.*, z.name as zoneName, z.color as zoneColor
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      WHERE s.zoneId = ?
      ORDER BY s.slotNumber
    `).all(zoneId) as SlotWithZone[];
  }

  getAvailableSlots(vehicleType?: string): SlotWithZone[] {
    const db = getDb();
    let query = `
      SELECT s.*, z.name as zoneName, z.color as zoneColor
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      WHERE s.status = 'AVAILABLE'
    `;
    const params: string[] = [];

    if (vehicleType) {
      if (vehicleType === 'EV_CAR' || vehicleType === 'EV_BIKE') {
        query += ` AND (s.slotType = 'EV' OR s.slotType = 'STANDARD' OR s.slotType = 'COMPACT' OR s.slotType = 'PREMIUM')`;
      } else if (vehicleType === 'CAR') {
        query += ` AND (s.slotType = 'STANDARD' OR s.slotType = 'COMPACT' OR s.slotType = 'PREMIUM' OR s.slotType = 'HANDICAP')`;
      } else if (vehicleType === 'BIKE') {
        query += ` AND (s.slotType = 'STANDARD' OR s.slotType = 'COMPACT')`;
      }
    }

    query += ` ORDER BY s.priority DESC, z.name, s.slotNumber`;
    return db.prepare(query).all(...params) as SlotWithZone[];
  }

  getSlotById(slotId: string): SlotWithZone | undefined {
    const db = getDb();
    return db.prepare(`
      SELECT s.*, z.name as zoneName, z.color as zoneColor
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      WHERE s.id = ?
    `).get(slotId) as SlotWithZone | undefined;
  }

  updateSlotStatus(slotId: string, status: ParkingSlot['status']): ParkingSlot | undefined {
    const db = getDb();
    const stmt = db.prepare(`UPDATE parking_slots SET status = ? WHERE id = ?`);
    stmt.run(status, slotId);
    return db.prepare(`SELECT * FROM parking_slots WHERE id = ?`).get(slotId) as ParkingSlot | undefined;
  }

  createParkingSession(data: {
    vehicleId: string;
    userId?: string;
    slotId?: string;
  }): ParkingSession {
    const db = getDb();
    const id = uuidv4();
    const entryTime = new Date().toISOString();

    db.prepare(`
      INSERT INTO parking_sessions (id, vehicleId, userId, slotId, entryTime, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).run(id, data.vehicleId, data.userId || null, data.slotId || null, entryTime);

    if (data.slotId) {
      this.updateSlotStatus(data.slotId, 'OCCUPIED');
    }

    return db.prepare(`SELECT * FROM parking_sessions WHERE id = ?`).get(id) as ParkingSession;
  }

  closeParkingSession(sessionId: string): ParkingSession | undefined {
    const db = getDb();
    const session = db.prepare(`SELECT * FROM parking_sessions WHERE id = ?`).get(sessionId) as ParkingSession | undefined;
    if (!session) return undefined;

    const exitTime = new Date().toISOString();
    const entryDate = new Date(session.entryTime);
    const exitDate = new Date(exitTime);
    const durationMs = exitDate.getTime() - entryDate.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    let vehicleType = 'CAR';
    if (session.vehicleId) {
      const vehicle = db.prepare(`SELECT vehicleType FROM vehicles WHERE id = ?`).get(session.vehicleId) as { vehicleType: string } | undefined;
      if (vehicle) vehicleType = vehicle.vehicleType;
    }

    const fee = this.calculateParkingFee(session.entryTime, exitTime, vehicleType);

    db.prepare(`
      UPDATE parking_sessions
      SET exitTime = ?, duration = ?, fee = ?, paymentStatus = 'PAID', status = 'COMPLETED'
      WHERE id = ?
    `).run(exitTime, durationHours, fee, sessionId);

    if (session.slotId) {
      this.updateSlotStatus(session.slotId, 'AVAILABLE');
    }

    return db.prepare(`SELECT * FROM parking_sessions WHERE id = ?`).get(sessionId) as ParkingSession;
  }

  calculateParkingFee(entryTime: string, exitTime: string, vehicleType: string): number {
    const db = getDb();
    const entryDate = new Date(entryTime);
    const exitDate = new Date(exitTime);
    const durationMs = exitDate.getTime() - entryDate.getTime();
    const durationHours = Math.max(durationMs / (1000 * 60 * 60), 0);

    const pricing = db.prepare(`SELECT * FROM pricing WHERE vehicleType = ?`).get(vehicleType) as { pricePerHour: number; minimumFee: number } | undefined;

    if (!pricing) {
      return Math.max(durationHours * 30, 10);
    }

    const fee = Math.max(durationHours * pricing.pricePerHour, pricing.minimumFee);
    return Math.round(fee * 100) / 100;
  }

  getActiveSessions(): ParkingSession[] {
    const db = getDb();
    return db.prepare(`SELECT * FROM parking_sessions WHERE status = 'ACTIVE' ORDER BY entryTime DESC`).all() as ParkingSession[];
  }

  getUserActiveSessions(userId: string): ParkingSession[] {
    const db = getDb();
    return db.prepare(`SELECT * FROM parking_sessions WHERE status = 'ACTIVE' AND userId = ? ORDER BY entryTime DESC`).all(userId) as ParkingSession[];
  }

  getUserSessions(userId: string): ParkingSession[] {
    const db = getDb();
    return db.prepare(`SELECT * FROM parking_sessions WHERE userId = ? ORDER BY entryTime DESC`).all(userId) as ParkingSession[];
  }

  getAllZones(): ParkingZone[] {
    const db = getDb();
    return db.prepare(`SELECT * FROM parking_zones ORDER BY name`).all() as ParkingZone[];
  }

  getSessionById(sessionId: string): ParkingSession | undefined {
    const db = getDb();
    return db.prepare(`SELECT * FROM parking_sessions WHERE id = ?`).get(sessionId) as ParkingSession | undefined;
  }
}

export const parkingService = new ParkingService();
