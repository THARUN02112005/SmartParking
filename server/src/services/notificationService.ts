import { getDb } from '../database.js';
import { Notification } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  createNotification(userId: string, title: string, message: string, type: Notification['type']): Notification {
    const db = getDb();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, userId, title, message, type, createdAt);

    return db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(id) as Notification;
  }

  getUserNotifications(userId: string): Notification[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50
    `).all(userId) as Notification[];
  }

  markAsRead(notificationId: string, userId?: string): Notification | undefined {
    const db = getDb();
    let query = `SELECT * FROM notifications WHERE id = ?`;
    const params: string[] = [notificationId];
    if (userId) {
      query += ` AND userId = ?`;
      params.push(userId);
    }
    const notification = db.prepare(query).get(...params) as Notification | undefined;
    if (!notification) return undefined;

    db.prepare(`UPDATE notifications SET isRead = 1 WHERE id = ?`).run(notificationId);
    return db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(notificationId) as Notification;
  }

  markAllAsRead(userId: string): void {
    const db = getDb();
    db.prepare(`UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0`).run(userId);
  }

  getUnreadCount(userId: string): number {
    const db = getDb();
    const result = db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`).get(userId) as { count: number };
    return result.count;
  }
}

export const notificationService = new NotificationService();
