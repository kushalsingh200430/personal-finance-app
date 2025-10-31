import { Router } from 'express';
import * as taxController from '../controllers/taxController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/:fiscal_year', taxController.getTaxData);
router.post('/:fiscal_year', taxController.saveTaxData);
router.get('/:fiscal_year/calculate', taxController.calculateTax);
router.post('/:fiscal_year/submit-itr1', taxController.submitITR);

export default router;
