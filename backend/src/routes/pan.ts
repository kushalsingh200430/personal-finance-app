import { Router } from 'express';
import * as panController from '../controllers/panController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * PAN verification and management routes
 * All routes require authentication
 */

router.use(authenticate);

// PAN verification
router.post('/verify', panController.verifyPAN);
router.post('/verify-linkage', panController.verifyPANAadhaarLinkage);
router.post('/validate-for-itr', panController.validatePANForITR);

// PAN details
router.get('/details', panController.getPANDetails);
router.get('/verification-history', panController.getVerificationHistory);

// ITR filing
router.get('/filing-history', panController.getFilingHistory);
router.get('/filing/:fiscal_year', panController.getFilingStatus);
router.post('/store-filing', panController.storeFilingRecord);

export default router;
