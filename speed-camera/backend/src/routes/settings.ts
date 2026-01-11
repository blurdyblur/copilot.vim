import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user settings
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId }
    });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { alertDistance, alertSound, speedUnit, disclaimerAccepted } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: {
        ...(alertDistance !== undefined && { alertDistance }),
        ...(alertSound !== undefined && { alertSound }),
        ...(speedUnit !== undefined && { speedUnit }),
        ...(disclaimerAccepted !== undefined && { disclaimerAccepted })
      },
      create: {
        userId: req.userId!,
        alertDistance: alertDistance || 500,
        alertSound: alertSound !== undefined ? alertSound : true,
        speedUnit: speedUnit || 'MPH',
        disclaimerAccepted: disclaimerAccepted || false
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
