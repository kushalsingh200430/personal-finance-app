import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: { id: string };
}

/**
 * Middleware to verify JWT token from Authorization header or cookies
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header (Bearer token) or cookie
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as any;

    // Attach user info to request
    req.userId = decoded.userId;
    req.user = { id: decoded.userId };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
};

/**
 * Middleware for optional authentication (doesn't fail if token missing)
 */
export const authenticateOptional = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as any;
      req.userId = decoded.userId;
      req.user = { id: decoded.userId };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
