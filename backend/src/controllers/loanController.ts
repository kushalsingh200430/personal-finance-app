import { Request, Response } from 'express';
import { query } from '../config/database';
import * as validators from '../utils/validators';
import { calculateEMI, generateAmortizationSchedule, formatToINR } from '../utils/emiCalculator';
import { generateAmortizationCSV } from '../utils/csvExporter';
import { generateAmortizationPDF } from '../utils/pdfExporter';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { v4 as uuidv4 } from 'uuid';

/**
 * Loan Controller for EMI calculations and tracking
 */

/**
 * POST /api/loans
 * Create a new loan and calculate EMI
 */
export const createLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const {
      loan_name,
      loan_type,
      principal_amount,
      annual_interest_rate,
      loan_tenure_months,
      start_date
    } = req.body;

    // Validation
    if (!loan_name || !loan_type || !principal_amount || annual_interest_rate === undefined || !loan_tenure_months || !start_date) {
      res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
      return;
    }

    if (!validators.validateLoanType(loan_type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid loan type'
      });
      return;
    }

    if (principal_amount <= 0 || annual_interest_rate < 0 || loan_tenure_months <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid loan parameters'
      });
      return;
    }

    // Calculate EMI
    const emiCalc = calculateEMI(principal_amount, annual_interest_rate, loan_tenure_months);

    // Create loan
    const loanId = uuidv4();
    await query(
      `INSERT INTO loans (id, user_id, loan_name, loan_type, principal_amount, annual_interest_rate, loan_tenure_months, start_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
      [
        loanId,
        req.userId,
        loan_name,
        loan_type,
        principal_amount,
        annual_interest_rate,
        loan_tenure_months,
        start_date
      ]
    );

    res.status(201).json({
      success: true,
      loan: {
        id: loanId,
        loan_name,
        principal_amount,
        annual_interest_rate,
        monthly_emi: emiCalc.monthlyEMI,
        total_payable: emiCalc.totalPayable,
        total_interest: emiCalc.totalInterest,
        end_date: emiCalc.endDate,
        status: 'active'
      }
    });
  } catch (error: any) {
    console.error('Create loan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create loan'
    });
  }
};

/**
 * GET /api/loans
 * Get all loans for user
 */
export const getAllLoans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await query(
      'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    // Calculate EMI for each loan
    const loansWithEMI = result.rows.map(loan => {
      const emiCalc = calculateEMI(
        parseFloat(loan.principal_amount),
        parseFloat(loan.annual_interest_rate),
        loan.loan_tenure_months
      );

      return {
        ...loan,
        monthly_emi: emiCalc.monthlyEMI,
        total_payable: emiCalc.totalPayable,
        total_interest: emiCalc.totalInterest,
        end_date: emiCalc.endDate
      };
    });

    res.status(200).json({
      success: true,
      loans: loansWithEMI
    });
  } catch (error: any) {
    console.error('Get loans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loans'
    });
  }
};

/**
 * GET /api/loans/:loan_id
 * Get loan details with amortization schedule
 */
export const getLoanDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { loan_id } = req.params;

    const result = await query(
      'SELECT * FROM loans WHERE id = $1 AND user_id = $2',
      [loan_id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
      return;
    }

    const loan = result.rows[0];

    // Generate amortization schedule
    const schedule = generateAmortizationSchedule(
      parseFloat(loan.principal_amount),
      parseFloat(loan.annual_interest_rate),
      loan.loan_tenure_months,
      new Date(loan.start_date)
    );

    const emiCalc = calculateEMI(
      parseFloat(loan.principal_amount),
      parseFloat(loan.annual_interest_rate),
      loan.loan_tenure_months
    );

    res.status(200).json({
      success: true,
      loan: {
        ...loan,
        monthly_emi: emiCalc.monthlyEMI,
        total_payable: emiCalc.totalPayable,
        total_interest: emiCalc.totalInterest,
        end_date: emiCalc.endDate,
        amortization_schedule: schedule
      }
    });
  } catch (error: any) {
    console.error('Get loan detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan details'
    });
  }
};

/**
 * PUT /api/loans/:loan_id
 * Update loan details (name, principal, interest rate)
 */
export const updateLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { loan_id } = req.params;
    const { loan_name, principal_amount, annual_interest_rate } = req.body;

    // Check if loan exists
    const loanResult = await query(
      'SELECT * FROM loans WHERE id = $1 AND user_id = $2',
      [loan_id, req.userId]
    );

    if (loanResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
      return;
    }

    const loan = loanResult.rows[0];

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (loan_name !== undefined) {
      updates.push(`loan_name = $${paramCount++}`);
      values.push(loan_name);
    }
    if (principal_amount !== undefined) {
      updates.push(`principal_amount = $${paramCount++}`);
      values.push(principal_amount);
    }
    if (annual_interest_rate !== undefined) {
      updates.push(`annual_interest_rate = $${paramCount++}`);
      values.push(annual_interest_rate);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(loan_id);

    const updateQuery = `UPDATE loans SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const updateResult = await query(updateQuery, values);

    const updatedLoan = updateResult.rows[0];
    const emiCalc = calculateEMI(
      parseFloat(updatedLoan.principal_amount),
      parseFloat(updatedLoan.annual_interest_rate),
      updatedLoan.loan_tenure_months
    );

    res.status(200).json({
      success: true,
      loan: {
        ...updatedLoan,
        monthly_emi: emiCalc.monthlyEMI,
        total_payable: emiCalc.totalPayable,
        total_interest: emiCalc.totalInterest,
        end_date: emiCalc.endDate
      }
    });
  } catch (error: any) {
    console.error('Update loan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update loan'
    });
  }
};

/**
 * DELETE /api/loans/:loan_id
 * Delete a loan
 */
export const deleteLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { loan_id } = req.params;

    const result = await query(
      'DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING id',
      [loan_id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete loan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete loan'
    });
  }
};

/**
 * PATCH /api/loans/:loan_id/mark-paid
 * Mark loan as paid off
 */
export const markLoanPaid = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { loan_id } = req.params;

    const result = await query(
      'UPDATE loans SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      ['paid_off', loan_id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      loan: result.rows[0]
    });
  } catch (error: any) {
    console.error('Mark loan paid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark loan as paid'
    });
  }
};

/**
 * GET /api/loans/:loan_id/amortization
 * Export amortization schedule as CSV or PDF
 */
export const exportAmortization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { loan_id } = req.params;
    const { format } = req.query;

    const loanResult = await query(
      'SELECT * FROM loans WHERE id = $1 AND user_id = $2',
      [loan_id, req.userId]
    );

    if (loanResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
      return;
    }

    const loan = loanResult.rows[0];
    const schedule = generateAmortizationSchedule(
      parseFloat(loan.principal_amount),
      parseFloat(loan.annual_interest_rate),
      loan.loan_tenure_months,
      new Date(loan.start_date)
    );

    if (format === 'csv') {
      const csv = generateAmortizationCSV(
        loan.loan_name,
        parseFloat(loan.principal_amount),
        parseFloat(loan.annual_interest_rate),
        loan.loan_tenure_months,
        schedule
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="amortization_${loan_id}.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      const pdf = await generateAmortizationPDF(
        loan.loan_name,
        parseFloat(loan.principal_amount),
        parseFloat(loan.annual_interest_rate),
        loan.loan_tenure_months,
        schedule
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="amortization_${loan_id}.pdf"`);
      res.send(pdf);
    } else {
      res.status(200).json({
        success: true,
        amortization_schedule: schedule
      });
    }
  } catch (error: any) {
    console.error('Export amortization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export amortization'
    });
  }
};
