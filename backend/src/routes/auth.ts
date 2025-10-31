import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * Authentication routes for Pocket Guard
 */

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);

export default router;
