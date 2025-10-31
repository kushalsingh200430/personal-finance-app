import { Request, Response } from 'express';
import { query } from '../config/database';
import * as validators from '../utils/validators';
import { sendOTP } from '../services/smsService';
import { sendVerificationEmail } from '../services/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Authentication Controller for Pocket Guard
 * Handles signup, login, OTP verification, and token refresh
 */

/**
 * POST /api/auth/signup
 * Sign up a new user with email/password or phone
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phone_number, pan, first_name, last_name } = req.body;

    // Validate input
    if (!pan || !validators.validatePAN(pan)) {
      res.status(400).json({
        success: false,
        error: 'Valid PAN is required'
      });
      return;
    }

    if (email && !validators.validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
      return;
    }

    if (phone_number && !validators.validatePhone(phone_number)) {
      res.status(400).json({
        success: false,
        error: 'Invalid phone format (use +91 with 10 digits)'
      });
      return;
    }

    if (password && !validators.validatePassword(password)) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
      return;
    }

    if (!email && !phone_number) {
      res.status(400).json({
        success: false,
        error: 'Either email or phone_number is required'
      });
      return;
    }

    // Check if user already exists
    if (email) {
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
        return;
      }
    }

    if (phone_number) {
      const existingUser = await query('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'Phone number already registered'
        });
        return;
      }
    }

    // Check PAN uniqueness
    const existingPAN = await query('SELECT id FROM users WHERE pan = $1', [pan]);
    if (existingPAN.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'User with this PAN already exists'
      });
      return;
    }

    // Create user
    const userId = uuidv4();
    let passwordHash = null;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await query(
      `INSERT INTO users (id, email, phone_number, password_hash, pan, first_name, last_name, two_fa_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [userId, email || null, phone_number || null, passwordHash, pan, first_name || null, last_name || null]
    );

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `INSERT INTO otp (id, user_id, otp_code, purpose, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, otp, 'signup', expiresAt]
    );

    // Send OTP
    if (phone_number) {
      await sendOTP(phone_number, otp, 'signup');
    } else if (email) {
      await sendVerificationEmail(email, otp);
    }

    res.status(201).json({
      success: true,
      user_id: userId,
      requires_otp: true,
      message: 'User created. Please verify with OTP sent to your phone/email.'
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed'
    });
  }
};

/**
 * POST /api/auth/login
 * Login user with email/password or phone
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phone_number } = req.body;

    let user: any = null;

    if (email && password) {
      // Email + password login
      if (!validators.validateEmail(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      user = result.rows[0];

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }
    } else if (phone_number) {
      // Phone-based login
      if (!validators.validatePhone(phone_number)) {
        res.status(400).json({
          success: false,
          error: 'Invalid phone format'
        });
        return;
      }

      const result = await query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      user = result.rows[0];
    } else {
      res.status(400).json({
        success: false,
        error: 'Email/password or phone_number required'
      });
      return;
    }

    // Send 2FA OTP to registered phone
    if (user.phone_number) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        `INSERT INTO otp (id, user_id, otp_code, purpose, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), user.id, otp, '2fa', expiresAt]
      );

      await sendOTP(user.phone_number, otp, 'login');
    }

    res.status(200).json({
      success: true,
      user_id: user.id,
      requires_otp: true,
      message: 'OTP sent to registered phone'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT token
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, otp_code, purpose } = req.body;

    if (!user_id || !otp_code) {
      res.status(400).json({
        success: false,
        error: 'user_id and otp_code required'
      });
      return;
    }

    if (!validators.validateOTP(otp_code)) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP format'
      });
      return;
    }

    // Find valid OTP
    const otpResult = await query(
      `SELECT * FROM otp
       WHERE user_id = $1 AND otp_code = $2 AND is_used = false
       AND expires_at > NOW() AND purpose = $3
       ORDER BY created_at DESC LIMIT 1`,
      [user_id, otp_code, purpose || '2fa']
    );

    if (otpResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
      return;
    }

    // Mark OTP as used
    await query(
      'UPDATE otp SET is_used = true WHERE id = $1',
      [otpResult.rows[0].id]
    );

    // Get user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const user = userResult.rows[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '30m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    // Set cookies (httpOnly for security)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      session_token: accessToken
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'OTP verification failed'
    });
  }
};

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
      return;
    }

    const decoded: any = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your_secret_key');

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '30m' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      new_token: newAccessToken
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};
