import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/authenticate';
import * as panService from '../services/panService';
import * as validators from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';

/**
 * PAN Verification Controller
 * Handles PAN input, verification, and management
 */

/**
 * POST /api/pan/verify
 * Verify PAN with government database
 */
export const verifyPAN = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { pan, name, dateOfBirth, fatherName } = req.body;

    // Validate input
    if (!pan || !name) {
      res.status(400).json({
        success: false,
        error: 'PAN and name are required'
      });
      return;
    }

    // Validate PAN format
    if (!validators.validatePAN(pan)) {
      res.status(400).json({
        success: false,
        error: 'Invalid PAN format. Expected: 10 characters (e.g., AAAPL5055K)'
      });
      return;
    }

    // Call PAN verification service
    const verificationResult = await panService.verifyPAN({
      pan: pan.toUpperCase(),
      name,
      dateOfBirth,
      fatherName
    });

    if (!verificationResult.success) {
      res.status(400).json({
        success: false,
        error: verificationResult.error || 'PAN verification failed'
      });
      return;
    }

    // Store verification result
    const verificationId = uuidv4();
    await query(
      `INSERT INTO pan_verifications (id, user_id, pan, verification_status, name_verified, date_of_birth_verified, father_name_verified, verified_at, verification_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'government_api')`,
      [verificationId, req.userId, pan.toUpperCase(), 'verified', verificationResult.data?.name, dateOfBirth, fatherName]
    );

    // Update user PAN status
    await panService.updatePANVerificationStatus(req.userId, { pan: pan.toUpperCase(), name }, 'verified');

    res.status(200).json({
      success: true,
      verified: true,
      data: verificationResult.data,
      message: 'PAN verified successfully',
      verification_id: verificationId
    });
  } catch (error: any) {
    console.error('PAN verification error:', error);
    res.status(500).json({
      success: false,
      error: 'PAN verification failed'
    });
  }
};

/**
 * POST /api/pan/verify-linkage
 * Verify PAN-Aadhaar linkage
 */
export const verifyPANAadhaarLinkage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { pan, aadhaar } = req.body;

    if (!pan || !aadhaar) {
      res.status(400).json({
        success: false,
        error: 'PAN and Aadhaar are required'
      });
      return;
    }

    if (!validators.validatePAN(pan)) {
      res.status(400).json({
        success: false,
        error: 'Invalid PAN format'
      });
      return;
    }

    if (!validators.validateAadhaar(aadhaar)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Aadhaar format'
      });
      return;
    }

    const linkageResult = await panService.verifyPANAadhaarLinkage(pan, aadhaar);

    res.status(200).json({
      success: true,
      linked: linkageResult.linked,
      message: linkageResult.message
    });
  } catch (error: any) {
    console.error('Linkage verification error:', error);
    res.status(500).json({
      success: false,
      error: 'PAN-Aadhaar linkage verification failed'
    });
  }
};

/**
 * GET /api/pan/verification-history
 * Get PAN verification history for user
 */
export const getVerificationHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await query(
      `SELECT * FROM pan_verifications WHERE user_id = $1 ORDER BY verified_at DESC`,
      [req.userId]
    );

    res.status(200).json({
      success: true,
      verifications: result.rows
    });
  } catch (error: any) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verification history'
    });
  }
};

/**
 * GET /api/pan/filing-history
 * Get ITR filing history for PAN
 */
export const getFilingHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await query(
      `SELECT * FROM itr_filings WHERE user_id = $1 ORDER BY fiscal_year DESC`,
      [req.userId]
    );

    res.status(200).json({
      success: true,
      filings: result.rows
    });
  } catch (error: any) {
    console.error('Get filing history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filing history'
    });
  }
};

/**
 * GET /api/pan/details
 * Get current user PAN details
 */
export const getPANDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await query(
      `SELECT pan, pan_verified_at, pan_verification_status FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      pan_details: result.rows[0]
    });
  } catch (error: any) {
    console.error('Get PAN details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PAN details'
    });
  }
};

/**
 * POST /api/pan/validate-for-itr
 * Validate PAN eligibility for ITR filing
 */
export const validatePANForITR = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { pan, income } = req.body;

    if (!pan || income === undefined) {
      res.status(400).json({
        success: false,
        error: 'PAN and income are required'
      });
      return;
    }

    const validationResult = await panService.validatePANForITRFiling(pan, income);

    res.status(200).json({
      success: true,
      eligible: validationResult.eligible,
      reason: validationResult.reason
    });
  } catch (error: any) {
    console.error('PAN validation error:', error);
    res.status(500).json({
      success: false,
      error: 'PAN validation failed'
    });
  }
};

/**
 * POST /api/pan/store-filing
 * Store ITR filing record
 */
export const storeFilingRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { fiscalYear, itrForm, referenceNumber, submissionTimestamp, ackNumber } = req.body;

    if (!fiscalYear || !itrForm || !referenceNumber) {
      res.status(400).json({
        success: false,
        error: 'Fiscal year, ITR form, and reference number are required'
      });
      return;
    }

    const filingId = uuidv4();
    const result = await query(
      `INSERT INTO itr_filings (id, user_id, fiscal_year, itr_form, reference_number, filing_status, submission_timestamp, ack_number)
       VALUES ($1, $2, $3, $4, $5, 'filed', $6, $7)
       ON CONFLICT (user_id, fiscal_year) DO UPDATE SET
       reference_number = $5, filing_status = 'filed', submission_timestamp = $6, ack_number = $7, updated_at = NOW()
       RETURNING *`,
      [filingId, req.userId, fiscalYear, itrForm, referenceNumber, submissionTimestamp, ackNumber]
    );

    res.status(201).json({
      success: true,
      filing: result.rows[0]
    });
  } catch (error: any) {
    console.error('Store filing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store filing record'
    });
  }
};

/**
 * GET /api/pan/filing/:fiscal_year
 * Get filing status for specific fiscal year
 */
export const getFilingStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { fiscal_year } = req.params;

    const result = await query(
      `SELECT * FROM itr_filings WHERE user_id = $1 AND fiscal_year = $2`,
      [req.userId, fiscal_year]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No filing found for this fiscal year'
      });
      return;
    }

    res.status(200).json({
      success: true,
      filing: result.rows[0]
    });
  } catch (error: any) {
    console.error('Get filing status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filing status'
    });
  }
};
