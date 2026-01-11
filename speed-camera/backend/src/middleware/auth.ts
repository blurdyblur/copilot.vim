import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  isGuest?: boolean;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      isGuest: boolean;
    };

    req.userId = decoded.userId;
    req.isGuest = decoded.isGuest;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const premiumMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.isGuest) {
    return res.status(403).json({ error: 'Premium feature - subscription required' });
  }
  next();
};
