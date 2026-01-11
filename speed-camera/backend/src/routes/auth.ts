import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        settings: {
          create: {}
        }
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, isGuest: false },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, isGuest: user.isGuest },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Guest login
router.post('/guest', authLimiter, async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: `guest_${Date.now()}@speedcamera.app`,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        isGuest: true,
        settings: {
          create: {}
        }
      }
    });

    const token = jwt.sign(
      { userId: user.id, isGuest: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, isGuest: true } });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

export default router;
