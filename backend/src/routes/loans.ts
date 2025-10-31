import { Router } from 'express';
import * as loanController from '../controllers/loanController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * Loan/EMI routes - all protected
 */

router.use(authenticate);

router.post('/', loanController.createLoan);
router.get('/', loanController.getAllLoans);
router.get('/:loan_id', loanController.getLoanDetail);
router.put('/:loan_id', loanController.updateLoan);
router.delete('/:loan_id', loanController.deleteLoan);
router.patch('/:loan_id/mark-paid', loanController.markLoanPaid);
router.get('/:loan_id/amortization', loanController.exportAmortization);

export default router;
