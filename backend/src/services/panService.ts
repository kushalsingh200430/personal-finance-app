import axios from 'axios';
import { query } from '../config/database';

/**
 * PAN Verification Service for Income Tax Return Filing
 * Integrates with government APIs and NSDL for PAN verification
 */

export interface PANData {
  pan: string;
  name: string;
  dateOfBirth?: string;
  fatherName?: string;
  entityType?: string;
}

export interface PANVerificationResult {
  success: boolean;
  verified: boolean;
  data?: {
    pan: string;
    name: string;
    entity_type: string;
    date_of_birth?: string;
    father_name?: string;
    status: string;
  };
  error?: string;
  message?: string;
}

/**
 * Validate PAN format
 */
export const validatePANFormat = (pan: string): boolean => {
  // PAN format: 5 letters, 4 numbers, 1 letter (e.g., AAAPL5055K)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

/**
 * Verify PAN with government database
 * Note: This is a mock implementation. Real implementation would use:
 * - NSDL API (https://www.nsdl.co.in/)
 * - Income Tax e-filing API
 * - Aadhaar-PAN linking verification
 */
export const verifyPAN = async (panData: PANData): Promise<PANVerificationResult> => {
  try {
    // Validate format first
    if (!validatePANFormat(panData.pan)) {
      return {
        success: false,
        verified: false,
        error: 'Invalid PAN format'
      };
    }

    // In production, integrate with:
    // 1. NSDL API for PAN validation
    // 2. Income Tax Department API
    // 3. Aadhaar-PAN linking verification

    const panUpper = panData.pan.toUpperCase();

    // Mock API call to government verification service
    if (process.env.GOVERNMENT_API_KEY && process.env.NODE_ENV === 'production') {
      return await callGovernmentPANAPI(panUpper, panData);
    } else {
      // Development mode: mock successful verification
      return generateMockPANVerification(panUpper, panData);
    }
  } catch (error: any) {
    console.error('PAN verification error:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'PAN verification failed'
    };
  }
};

/**
 * Call government PAN API (placeholder for real API integration)
 */
const callGovernmentPANAPI = async (
  pan: string,
  panData: PANData
): Promise<PANVerificationResult> => {
  try {
    // Example: NSDL API endpoint
    const response = await axios.post(
      process.env.GOVERNMENT_PAN_VERIFICATION_URL || 'https://api.nsdl.co.in/v1/pan/verify',
      {
        pan,
        name: panData.name,
        date_of_birth: panData.dateOfBirth
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GOVERNMENT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.success || response.status === 200) {
      return {
        success: true,
        verified: true,
        data: {
          pan: pan,
          name: response.data.name || panData.name,
          entity_type: response.data.entity_type || 'Individual',
          date_of_birth: response.data.dob,
          father_name: response.data.father_name,
          status: 'Active'
        },
        message: 'PAN verified successfully'
      };
    } else {
      return {
        success: false,
        verified: false,
        error: response.data.error || 'PAN verification failed'
      };
    }
  } catch (error: any) {
    console.error('Government API error:', error.message);
    return {
      success: false,
      verified: false,
      error: 'Could not connect to verification service'
    };
  }
};

/**
 * Generate mock PAN verification for development
 */
const generateMockPANVerification = (
  pan: string,
  panData: PANData
): PANVerificationResult => {
  return {
    success: true,
    verified: true,
    data: {
      pan: pan,
      name: panData.name,
      entity_type: panData.entityType || 'Individual',
      date_of_birth: panData.dateOfBirth,
      father_name: panData.fatherName,
      status: 'Active'
    },
    message: 'PAN verified successfully (mock mode)'
  };
};

/**
 * Update PAN verification status in database
 */
export const updatePANVerificationStatus = async (
  userId: string,
  panData: PANData,
  verificationStatus: string
): Promise<boolean> => {
  try {
    const result = await query(
      `UPDATE users SET
       pan = $1,
       pan_verified_at = NOW(),
       pan_verification_status = $2,
       updated_at = NOW()
       WHERE id = $3`,
      [panData.pan.toUpperCase(), verificationStatus, userId]
    );
    return result.rowCount > 0;
  } catch (error: any) {
    console.error('Update PAN status error:', error);
    return false;
  }
};

/**
 * Get PAN verification history for user
 */
export const getPANVerificationHistory = async (userId: string): Promise<any[]> => {
  try {
    const result = await query(
      `SELECT pan, pan_verified_at, pan_verification_status FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows;
  } catch (error: any) {
    console.error('Get PAN history error:', error);
    return [];
  }
};

/**
 * Verify PAN-Aadhaar linkage
 * Checks if PAN and Aadhaar are linked in government records
 */
export const verifyPANAadhaarLinkage = async (
  pan: string,
  aadhaar: string
): Promise<{ linked: boolean; message: string }> => {
  try {
    // In production, this would check with:
    // 1. Income Tax Department API
    // 2. Aadhaar-PAN database

    if (process.env.GOVERNMENT_API_KEY && process.env.NODE_ENV === 'production') {
      // Call real API
      const response = await axios.post(
        process.env.GOVERNMENT_LINKAGE_CHECK_URL || 'https://api.incometax.gov.in/v1/pan-aadhaar/verify',
        { pan: pan.toUpperCase(), aadhaar },
        {
          headers: { 'Authorization': `Bearer ${process.env.GOVERNMENT_API_KEY}` },
          timeout: 15000
        }
      );

      return {
        linked: response.data.linked || false,
        message: response.data.message || 'Verification complete'
      };
    } else {
      // Mock verification for development
      return {
        linked: true,
        message: 'PAN-Aadhaar linkage verified (mock mode)'
      };
    }
  } catch (error: any) {
    console.error('PAN-Aadhaar linkage check error:', error);
    return {
      linked: false,
      message: 'Could not verify linkage'
    };
  }
};

/**
 * Extract PAN details from document (mock - would use OCR in production)
 */
export const extractPANFromDocument = async (documentFile: Buffer): Promise<{
  success: boolean;
  pan?: string;
  name?: string;
  error?: string;
}> => {
  try {
    // In production, this would use:
    // 1. Tesseract OCR for document scanning
    // 2. AI/ML for field extraction
    // 3. Computer Vision for document validation

    console.log('Document processing requested (OCR not yet implemented)');

    return {
      success: false,
      error: 'Document OCR processing not yet implemented'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check PAN tax filing history
 */
export const getPANFilingHistory = async (pan: string): Promise<any[]> => {
  try {
    // This would query government records for ITR filings
    // For now, return from local database

    const result = await query(
      `SELECT td.* FROM tax_data td
       JOIN users u ON td.user_id = u.id
       WHERE u.pan = $1
       ORDER BY td.fiscal_year DESC`,
      [pan.toUpperCase()]
    );

    return result.rows;
  } catch (error: any) {
    console.error('Get filing history error:', error);
    return [];
  }
};

/**
 * Validate PAN eligibility for ITR filing
 */
export const validatePANForITRFiling = async (
  pan: string,
  income: number
): Promise<{ eligible: boolean; reason?: string }> => {
  try {
    // Validate PAN format
    if (!validatePANFormat(pan)) {
      return {
        eligible: false,
        reason: 'Invalid PAN format'
      };
    }

    // ITR-1 is for income < 50 lakhs
    if (income >= 5000000) {
      return {
        eligible: false,
        reason: 'Income exceeds ₹50 lakhs limit. Use ITR-2 or higher forms.'
      };
    }

    // Check if PAN is active in government records (mock check)
    const verificationResult = await verifyPAN({ pan });

    if (!verificationResult.verified) {
      return {
        eligible: false,
        reason: 'PAN verification failed. Please verify your PAN details.'
      };
    }

    return {
      eligible: true
    };
  } catch (error: any) {
    return {
      eligible: false,
      reason: 'Could not validate PAN'
    };
  }
};
