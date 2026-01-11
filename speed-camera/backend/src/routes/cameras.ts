import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get cameras within bounding box
router.get('/', authMiddleware, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ error: 'Bounding box parameters required' });
    }

    const cameras = await prisma.speedCamera.findMany({
      where: {
        latitude: {
          gte: parseFloat(minLat as string),
          lte: parseFloat(maxLat as string)
        },
        longitude: {
          gte: parseFloat(minLng as string),
          lte: parseFloat(maxLng as string)
        }
      }
    });

    res.json(cameras);
  } catch (error) {
    console.error('Get cameras error:', error);
    res.status(500).json({ error: 'Failed to fetch cameras' });
  }
});

// Get camera by ID
router.get('/:id', authMiddleware, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const cameraId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const camera = await prisma.speedCamera.findUnique({
      where: { id: cameraId }
    });

    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    res.json(camera);
  } catch (error) {
    console.error('Get camera error:', error);
    res.status(500).json({ error: 'Failed to fetch camera' });
  }
});

export default router;
