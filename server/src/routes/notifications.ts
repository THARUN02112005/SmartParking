import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

const router = Router();

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const notifications = notificationService.getUserNotifications(req.user!.id);
    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const notification = notificationService.markAsRead(req.params.id, req.user!.id);
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

router.put('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    notificationService.markAllAsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark all as read' });
  }
});

router.get('/unread-count', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const count = notificationService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get unread count' });
  }
});

export default router;
