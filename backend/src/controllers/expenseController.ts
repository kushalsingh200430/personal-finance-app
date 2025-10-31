import { Request, Response } from 'express';
import { query } from '../config/database';
import * as validators from '../utils/validators';
import { generateExpenseReportCSV } from '../utils/csvExporter';
import { generateExpenseReportPDF } from '../utils/pdfExporter';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { v4 as uuidv4 } from 'uuid';

/**
 * Expense Controller for tracking expenses
 */

export const createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { expense_date, category, amount, description, payment_method } = req.body;

    if (!expense_date || !category || !amount || !payment_method) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    if (!validators.validateExpenseCategory(category)) {
      res.status(400).json({ success: false, error: 'Invalid category' });
      return;
    }

    if (!validators.validatePaymentMethod(payment_method)) {
      res.status(400).json({ success: false, error: 'Invalid payment method' });
      return;
    }

    const expenseId = uuidv4();
    await query(
      `INSERT INTO expenses (id, user_id, expense_date, category, amount, description, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [expenseId, req.userId, expense_date, category, amount, description || null, payment_method]
    );

    res.status(201).json({ success: true, expense: { id: expenseId, ...req.body } });
  } catch (error: any) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, error: 'Failed to create expense' });
  }
};

export const getExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { start_date, end_date, category } = req.query;
    let whereClause = 'user_id = $1';
    const params: any[] = [req.userId];

    if (start_date) {
      whereClause += ` AND expense_date >= $${params.length + 1}`;
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ` AND expense_date <= $${params.length + 1}`;
      params.push(end_date);
    }
    if (category) {
      whereClause += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    const result = await query(
      `SELECT * FROM expenses WHERE ${whereClause} ORDER BY expense_date DESC`,
      params
    );

    res.status(200).json({ success: true, expenses: result.rows });
  } catch (error: any) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
};

export const getExpenseSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { month, year } = req.query;
    const date = new Date();

    if (month && year) {
      date.setFullYear(parseInt(year as string), parseInt(month as string) - 1);
    }

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const result = await query(
      `SELECT category, SUM(amount) as total FROM expenses
       WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3
       GROUP BY category`,
      [req.userId, startOfMonth, endOfMonth]
    );

    let totalSpending = 0;
    const byCategory: Record<string, number> = {};

    for (const row of result.rows) {
      byCategory[row.category] = parseFloat(row.total);
      totalSpending += parseFloat(row.total);
    }

    res.status(200).json({
      success: true,
      total_spending: totalSpending,
      by_category: byCategory
    });
  } catch (error: any) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
};

export const exportExpenseReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { format, month, year } = req.query;
    const date = new Date();

    if (month && year) {
      date.setFullYear(parseInt(year as string), parseInt(month as string) - 1);
    }

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const expensesResult = await query(
      `SELECT * FROM expenses WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3 ORDER BY expense_date`,
      [req.userId, startOfMonth, endOfMonth]
    );

    const summaryResult = await query(
      `SELECT category, SUM(amount) as total FROM expenses
       WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3
       GROUP BY category`,
      [req.userId, startOfMonth, endOfMonth]
    );

    let totalSpending = 0;
    const byCategory: Record<string, number> = {};

    for (const row of summaryResult.rows) {
      byCategory[row.category] = parseFloat(row.total);
      totalSpending += parseFloat(row.total);
    }

    const monthStr = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    if (format === 'pdf') {
      const pdf = await generateExpenseReportPDF(
        monthStr,
        totalSpending,
        byCategory,
        expensesResult.rows
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="expenses_${monthStr}.pdf"`);
      res.send(pdf);
    } else {
      const csv = generateExpenseReportCSV(monthStr, totalSpending, byCategory, expensesResult.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses_${monthStr}.csv"`);
      res.send(csv);
    }
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export' });
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { expense_id } = req.params;
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(expense_id);
    values.push(req.userId);

    const result = await query(
      `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    res.status(200).json({ success: true, expense: result.rows[0] });
  } catch (error: any) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, error: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { expense_id } = req.params;

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [expense_id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete' });
  }
};
