import { getDb } from '../database.js';
import { DashboardStats } from '../models/types.js';

export class AnalyticsService {
  getDashboardStats(): DashboardStats {
    const db = getDb();
    const totalSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots`).get() as { count: number }).count;
    const availableSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE status = 'AVAILABLE'`).get() as { count: number }).count;
    const occupiedSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE status = 'OCCUPIED'`).get() as { count: number }).count;
    const reservedSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE status = 'RESERVED'`).get() as { count: number }).count;
    const blockedSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE status = 'BLOCKED'`).get() as { count: number }).count;
    const activeVehicles = (db.prepare(`SELECT COUNT(*) as count FROM parking_sessions WHERE status = 'ACTIVE'`).get() as { count: number }).count;

    const today = new Date().toISOString().split('T')[0];
    const todaySessions = (db.prepare(`SELECT COUNT(*) as count FROM parking_sessions WHERE entryTime LIKE ?`).get(`${today}%`) as { count: number }).count;
    const todayRevenueResult = db.prepare(`SELECT COALESCE(SUM(fee), 0) as total FROM parking_sessions WHERE entryTime LIKE ? AND status = 'COMPLETED'`).get(`${today}%`) as { total: number };

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      blockedSlots,
      activeVehicles,
      todaySessions,
      todayRevenue: todayRevenueResult.total,
      occupancyPercentage: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
    };
  }

  getOccupancyOverTime(days: number = 7): Array<{ date: string; hour: number; occupancy: number; total: number }> {
    const db = getDb();
    const result: Array<{ date: string; hour: number; occupancy: number; total: number }> = [];
    const totalSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots`).get() as { count: number }).count;

    for (let d = days - 1; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];

      for (let h = 0; h < 24; h++) {
        const hourStr = `${dateStr}T${String(h).padStart(2, '0')}`;
        const hourEnd = `${dateStr}T${String(h + 1).padStart(2, '0')}`;

        const count = (db.prepare(`
          SELECT COUNT(*) as count FROM parking_sessions
          WHERE entryTime < ? AND (exitTime IS NULL OR exitTime > ?) AND status IN ('ACTIVE', 'COMPLETED')
        `).get(hourEnd, hourStr) as { count: number }).count;

        result.push({
          date: dateStr,
          hour: h,
          occupancy: count,
          total: totalSlots,
        });
      }
    }

    return result;
  }

  getRevenueOverTime(days: number = 7): Array<{ date: string; revenue: number; sessions: number }> {
    const db = getDb();
    const result: Array<{ date: string; revenue: number; sessions: number }> = [];

    for (let d = days - 1; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];

      const row = db.prepare(`
        SELECT COALESCE(SUM(fee), 0) as revenue, COUNT(*) as sessions
        FROM parking_sessions
        WHERE entryTime LIKE ? AND status = 'COMPLETED'
      `).get(`${dateStr}%`) as { revenue: number; sessions: number };

      result.push({
        date: dateStr,
        revenue: row.revenue,
        sessions: row.sessions,
      });
    }

    return result;
  }

  getVehicleTypeDistribution(): Array<{ type: string; count: number; percentage: number }> {
    const db = getDb();
    const total = (db.prepare(`SELECT COUNT(*) as count FROM vehicles`).get() as { count: number }).count;
    const rows = db.prepare(`
      SELECT vehicleType as type, COUNT(*) as count
      FROM vehicles
      GROUP BY vehicleType
    `).all() as Array<{ type: string; count: number }>;

    return rows.map(row => ({
      type: row.type,
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 10000) / 100 : 0,
    }));
  }

  getZoneOccupancy(): Array<{ zoneId: string; zoneName: string; total: number; occupied: number; available: number; occupancyRate: number }> {
    const db = getDb();
    const zones = db.prepare(`SELECT * FROM parking_zones`).all() as Array<{ id: string; name: string }>;

    return zones.map(zone => {
      const total = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE zoneId = ?`).get(zone.id) as { count: number }).count;
      const occupied = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE zoneId = ? AND status = 'OCCUPIED'`).get(zone.id) as { count: number }).count;
      const available = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots WHERE zoneId = ? AND status = 'AVAILABLE'`).get(zone.id) as { count: number }).count;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        total,
        occupied,
        available,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 10000) / 100 : 0,
      };
    });
  }

  getPeakHours(): Array<{ hour: number; avgOccupancy: number; avgRevenue: number }> {
    const db = getDb();
    const result: Array<{ hour: number; avgOccupancy: number; avgRevenue: number }> = [];
    const totalSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots`).get() as { count: number }).count;

    for (let h = 0; h < 24; h++) {
      const hourStr = `%T${String(h).padStart(2, '0')}%`;
      const sessions = (db.prepare(`
        SELECT COUNT(*) as count FROM parking_sessions
        WHERE entryTime LIKE ?
      `).get(hourStr) as { count: number }).count;

      const revenue = (db.prepare(`
        SELECT COALESCE(SUM(fee), 0) as total FROM parking_sessions
        WHERE entryTime LIKE ? AND status = 'COMPLETED'
      `).get(hourStr) as { total: number }).total;

      result.push({
        hour: h,
        avgOccupancy: totalSlots > 0 ? Math.round((sessions / totalSlots) * 10000) / 100 : 0,
        avgRevenue: revenue,
      });
    }

    return result;
  }

  getPredictionForDate(date: string): { date: string; predictedOccupancy: number; predictedRevenue: number; confidence: number } {
    const db = getDb();
    const dayOfWeek = new Date(date).getDay();

    const historicalSessions = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(fee), 0) as revenue
      FROM parking_sessions
      WHERE status = 'COMPLETED'
      AND CAST(strftime('%w', entryTime) AS INTEGER) = ?
    `).get(dayOfWeek) as { count: number; revenue: number };

    const totalSlots = (db.prepare(`SELECT COUNT(*) as count FROM parking_slots`).get() as { count: number }).count;

    const dayCount = (db.prepare(`
      SELECT COUNT(DISTINCT date(entryTime)) as count
      FROM parking_sessions
      WHERE CAST(strftime('%w', entryTime) AS INTEGER) = ?
    `).get(dayOfWeek) as { count: number }).count;

    const avgSessions = dayCount > 0 ? historicalSessions.count / dayCount : 0;
    const avgRevenue = dayCount > 0 ? historicalSessions.revenue / dayCount : 0;

    const predictedOccupancy = totalSlots > 0 ? Math.min(Math.round((avgSessions / totalSlots) * 100), 100) : 0;
    const confidence = Math.min(dayCount * 10 + 30, 95);

    return {
      date,
      predictedOccupancy,
      predictedRevenue: Math.round(avgRevenue * 100) / 100,
      confidence,
    };
  }

  getViolationStats(): { total: number; resolved: number; unresolved: number; byType: Array<{ type: string; count: number }>; bySeverity: Array<{ severity: string; count: number }> } {
    const db = getDb();
    const total = (db.prepare(`SELECT COUNT(*) as count FROM violations`).get() as { count: number }).count;
    const resolved = (db.prepare(`SELECT COUNT(*) as count FROM violations WHERE resolved = 1`).get() as { count: number }).count;

    const byType = db.prepare(`
      SELECT violationType as type, COUNT(*) as count
      FROM violations GROUP BY violationType
    `).all() as Array<{ type: string; count: number }>;

    const bySeverity = db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM violations GROUP BY severity
    `).all() as Array<{ severity: string; count: number }>;

    return {
      total,
      resolved,
      unresolved: total - resolved,
      byType,
      bySeverity,
    };
  }
}

export const analyticsService = new AnalyticsService();
