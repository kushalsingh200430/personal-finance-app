import { Request, Response } from 'express';
import { query } from '../config/database';
import { calculateTaxLiability, validateTaxDataForFiling, validateDeductionLimits } from '../utils/taxCalculator';
import { submitITR1 } from '../services/govApiService';
import { sendTaxFilingConfirmation } from '../services/emailService';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tax Controller for tax filing and calculations
 */

export const getTaxData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { fiscal_year } = req.params;

    const result = await query(
      'SELECT * FROM tax_data WHERE user_id = $1 AND fiscal_year = $2',
      [req.userId, fiscal_year]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'No tax data found' });
      return;
    }

    res.status(200).json({ success: true, tax_data: result.rows[0] });
  } catch (error: any) {
    console.error('Get tax data error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tax data' });
  }
};

export const saveTaxData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { fiscal_year } = req.params;
    const taxData = req.body;

    // Get user details
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Calculate tax liability
    const calculation = calculateTaxLiability(
      parseFloat(taxData.gross_salary) || 0,
      parseFloat(taxData.hra_received) || 0,
      parseFloat(taxData.lta_transport_allowance) || 0,
      parseFloat(taxData.deduction_80c) || 0,
      parseFloat(taxData.deduction_80d) || 0,
      parseFloat(taxData.deduction_80e) || 0,
      parseFloat(taxData.home_loan_interest) || 0,
      parseFloat(taxData.house_property_income) || 0,
      parseFloat(taxData.other_income) || 0,
      parseFloat(taxData.tds_deducted) || 0
    );

    // Check if tax data exists
    const existingResult = await query(
      'SELECT id FROM tax_data WHERE user_id = $1 AND fiscal_year = $2',
      [req.userId, fiscal_year]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update
      result = await query(
        `UPDATE tax_data SET
         gross_salary = $1, hra_received = $2, lta_transport_allowance = $3,
         deduction_80c = $4, deduction_80d = $5, deduction_80e = $6,
         home_loan_interest = $7, house_property_income = $8,
         other_income = $9, tds_deducted = $10, updated_at = NOW()
         WHERE user_id = $11 AND fiscal_year = $12 RETURNING *`,
        [
          taxData.gross_salary, taxData.hra_received, taxData.lta_transport_allowance,
          taxData.deduction_80c, taxData.deduction_80d, taxData.deduction_80e,
          taxData.home_loan_interest, taxData.house_property_income,
          taxData.other_income, taxData.tds_deducted, req.userId, fiscal_year
        ]
      );
    } else {
      // Insert
      result = await query(
        `INSERT INTO tax_data (id, user_id, fiscal_year, gross_salary, hra_received, lta_transport_allowance,
         deduction_80c, deduction_80d, deduction_80e, home_loan_interest,
         house_property_income, other_income, tds_deducted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          uuidv4(), req.userId, fiscal_year,
          taxData.gross_salary, taxData.hra_received, taxData.lta_transport_allowance,
          taxData.deduction_80c, taxData.deduction_80d, taxData.deduction_80e,
          taxData.home_loan_interest, taxData.house_property_income,
          taxData.other_income, taxData.tds_deducted
        ]
      );
    }

    res.status(200).json({
      success: true,
      tax_data: result.rows[0],
      calculation
    });
  } catch (error: any) {
    console.error('Save tax data error:', error);
    res.status(500).json({ success: false, error: 'Failed to save tax data' });
  }
};

export const calculateTax = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { fiscal_year } = req.params;

    const result = await query(
      'SELECT * FROM tax_data WHERE user_id = $1 AND fiscal_year = $2',
      [req.userId, fiscal_year]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Tax data not found' });
      return;
    }

    const data = result.rows[0];

    const calculation = calculateTaxLiability(
      parseFloat(data.gross_salary),
      parseFloat(data.hra_received),
      parseFloat(data.lta_transport_allowance),
      parseFloat(data.deduction_80c),
      parseFloat(data.deduction_80d),
      parseFloat(data.deduction_80e),
      parseFloat(data.home_loan_interest),
      parseFloat(data.house_property_income),
      parseFloat(data.other_income),
      parseFloat(data.tds_deducted)
    );

    res.status(200).json({ success: true, calculation });
  } catch (error: any) {
    console.error('Calculate tax error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate tax' });
  }
};

export const submitITR = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { fiscal_year } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      res.status(400).json({ success: false, error: 'Submission must be confirmed' });
      return;
    }

    // Get user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Validate user has required data
    if (!user.pan || !user.aadhaar) {
      res.status(400).json({ success: false, error: 'PAN and Aadhaar required' });
      return;
    }

    // Get tax data
    const taxResult = await query(
      'SELECT * FROM tax_data WHERE user_id = $1 AND fiscal_year = $2',
      [req.userId, fiscal_year]
    );

    if (taxResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Tax data not found' });
      return;
    }

    const taxData = taxResult.rows[0];

    // Submit to government
    const submission = await submitITR1({
      pan: user.pan,
      aadhaar: user.aadhaar,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone_number,
      fiscalYear: fiscal_year,
      grossIncome: parseFloat(taxData.gross_salary) + parseFloat(taxData.house_property_income) + parseFloat(taxData.other_income),
      totalDeductions: parseFloat(taxData.deduction_80c) + parseFloat(taxData.deduction_80d) + parseFloat(taxData.deduction_80e),
      taxableIncome: 0, // Calculated by government
      taxLiability: 0, // Calculated by government
      tdsDeducted: parseFloat(taxData.tds_deducted),
      refundOrBalance: 0 // Calculated by government
    });

    if (!submission.success) {
      res.status(500).json({
        success: false,
        error: submission.error || 'Failed to submit ITR'
      });
      return;
    }

    // Send confirmation email
    if (user.email) {
      await sendTaxFilingConfirmation(user.email, submission.refNumber || '', fiscal_year);
    }

    res.status(200).json({
      success: true,
      itr_reference_number: submission.refNumber,
      submission_timestamp: new Date(),
      message: submission.message
    });
  } catch (error: any) {
    console.error('Submit ITR error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit ITR' });
  }
};
