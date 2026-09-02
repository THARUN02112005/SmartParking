import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/types.js';

const router = Router();
const JWT_SECRET = 'smartparking-secret-key-2024';

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, password, phone, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'USER', ?, ?)
    `).run(id, name, email, hashedPassword, phone || null, now, now);

    const token = jwt.sign({ id, email, role: 'USER' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id, name, email, phone, role: 'USER' },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = getDb();
    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const user = db.prepare(`SELECT id, name, email, phone, role, createdAt FROM users WHERE id = ?`).get(req.user!.id) as Omit<User, 'password'> | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

router.put('/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { name, phone } = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    if (name) {
      db.prepare(`UPDATE users SET name = ?, updatedAt = ? WHERE id = ?`).run(name, now, req.user!.id);
    }
    if (phone !== undefined) {
      db.prepare(`UPDATE users SET phone = ?, updatedAt = ? WHERE id = ?`).run(phone, now, req.user!.id);
    }

    const user = db.prepare(`SELECT id, name, email, phone, role, createdAt, updatedAt FROM users WHERE id = ?`).get(req.user!.id) as Omit<User, 'password'>;
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

export default router;
