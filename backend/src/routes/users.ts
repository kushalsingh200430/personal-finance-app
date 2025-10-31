import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * User profile routes
 */

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

export default router;
