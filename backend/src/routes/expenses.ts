import { Router } from 'express';
import * as expenseController from '../controllers/expenseController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/summary', expenseController.getExpenseSummary);
router.get('/export', expenseController.exportExpenseReport);
router.put('/:expense_id', expenseController.updateExpense);
router.delete('/:expense_id', expenseController.deleteExpense);

export default router;
