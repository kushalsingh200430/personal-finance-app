import nodemailer from 'nodemailer';

/**
 * Email Service for sending verification and transactional emails
 */

let transporter: any = null;

// Initialize email transporter
if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

/**
 * Send verification email with OTP
 */
export const sendVerificationEmail = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!transporter) {
      console.warn('Email service not configured. Email sending disabled.');
      return { success: true };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Pocket Guard</h2>
        <p>Your email verification code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>Do not share this code with anyone.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Pocket Guard - Email Verification',
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!transporter) {
      console.warn('Email service not configured. Email sending disabled.');
      return { success: true };
    }

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your Pocket Guard password:</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Pocket Guard - Password Reset',
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

/**
 * Send tax filing confirmation email
 */
export const sendTaxFilingConfirmation = async (
  email: string,
  refNumber: string,
  fiscalYear: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!transporter) {
      console.warn('Email service not configured. Email sending disabled.');
      return { success: true };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Tax Return Filed Successfully</h2>
        <p>Your ITR-1 for fiscal year ${fiscalYear} has been successfully filed.</p>
        <p><strong>Reference Number:</strong> ${refNumber}</p>
        <p>Please save this reference number for your records.</p>
        <p>You can check the status of your filing on the Income Tax Department website.</p>
        <p>Thank you for using Pocket Guard!</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Pocket Guard - Tax Return Filed (${refNumber})`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

/**
 * Send expense report email
 */
export const sendExpenseReport = async (
  email: string,
  month: string,
  totalExpenses: number,
  categories: Record<string, number>
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!transporter) {
      console.warn('Email service not configured. Email sending disabled.');
      return { success: true };
    }

    const categoryRows = Object.entries(categories)
      .map(([category, amount]) => `<tr><td>${category}</td><td>₹${amount.toFixed(2)}</td></tr>`)
      .join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Monthly Expense Report - ${month}</h2>
        <p>Here's your expense summary for ${month}:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Category</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Amount</th>
          </tr>
          ${categoryRows}
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <td style="border: 1px solid #ddd; padding: 10px;">Total</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${totalExpenses.toFixed(2)}</td>
          </tr>
        </table>
        <p>Log in to Pocket Guard to view detailed breakdowns and trends.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Pocket Guard - Expense Report for ${month}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};
