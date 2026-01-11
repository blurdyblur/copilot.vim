import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Track analytics event
router.post('/track', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { eventType, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Event type required' });
    }

    await prisma.analytics.create({
      data: {
        userId: req.userId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

export default router;
