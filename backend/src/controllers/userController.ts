import { Request, Response } from 'express';
import { query } from '../config/database';
import * as validators from '../utils/validators';
import { AuthenticatedRequest } from '../middleware/authenticate';

/**
 * User Controller for profile management
 */

/**
 * GET /api/users/profile
 * Get user profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
      return;
    }

    const result = await query(
      'SELECT id, email, phone_number, first_name, last_name, pan, created_at FROM users WHERE id = $1',
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
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

/**
 * PUT /api/users/profile
 * Update user profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
      return;
    }

    const { first_name, last_name, pan, aadhaar } = req.body;

    // Validate PAN if provided
    if (pan && !validators.validatePAN(pan)) {
      res.status(400).json({
        success: false,
        error: 'Invalid PAN format'
      });
      return;
    }

    // Validate Aadhaar if provided
    if (aadhaar && !validators.validateAadhaar(aadhaar)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Aadhaar format'
      });
      return;
    }

    // Check PAN uniqueness if updating PAN
    if (pan) {
      const existing = await query(
        'SELECT id FROM users WHERE pan = $1 AND id != $2',
        [pan, req.userId]
      );
      if (existing.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'PAN already in use'
        });
        return;
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (pan !== undefined) {
      updates.push(`pan = $${paramCount++}`);
      values.push(pan);
    }
    if (aadhaar !== undefined) {
      updates.push(`aadhaar = $${paramCount++}`);
      values.push(aadhaar);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.userId);

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, phone_number, first_name, last_name, pan, created_at`;

    const result = await query(updateQuery, values);

    res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};
