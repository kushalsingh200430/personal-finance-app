import { Request, Response, NextFunction } from 'express';

export interface TwoFARequest extends Request {
  userId?: string;
  twoFAVerified?: boolean;
}

/**
 * Middleware to check if 2FA has been verified in current session
 * This is used to ensure sensitive operations are protected
 */
export const validate2FA = (
  req: TwoFARequest,
  res: Response,
  next: NextFunction
): void => {
  // For now, this is a placeholder for future 2FA session validation
  // In production, you would check session store or cache for 2FA verification status

  // Check if 2FA verification flag is set in request
  if (!req.twoFAVerified && !req.session?.twoFAVerified) {
    res.status(403).json({
      success: false,
      error: '2FA verification required',
      code: '2FA_REQUIRED'
    });
    return;
  }

  next();
};

/**
 * Middleware to set 2FA verification flag in session after successful OTP verification
 */
export const set2FAVerified = (
  req: TwoFARequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session) {
    req.session = {};
  }
  req.session.twoFAVerified = true;
  next();
};

/**
 * Middleware to clear 2FA verification on logout
 */
export const clear2FAVerified = (
  req: TwoFARequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.session) {
    req.session.twoFAVerified = false;
  }
  next();
};
