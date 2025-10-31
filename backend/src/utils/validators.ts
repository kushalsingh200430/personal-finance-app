/**
 * Validator utility functions for Pocket Guard
 * Includes PAN, Aadhaar, phone, email validations
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Indian phone format: +91 followed by 10 digits
  const phoneRegex = /^\+91\d{10}$/;
  return phoneRegex.test(phone);
};

export const validatePAN = (pan: string): boolean => {
  // PAN format: 10-character alphanumeric
  // Format: AAAPL5055K
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validateAadhaar = (aadhaar: string): boolean => {
  // Aadhaar format: 12-digit numeric
  const aadhaarRegex = /^[0-9]{12}$/;
  return aadhaarRegex.test(aadhaar);
};

export const validatePassword = (password: string): boolean => {
  // Password should be at least 8 characters, contain uppercase, lowercase, number, and special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateOTP = (otp: string): boolean => {
  // OTP should be 6 digits
  const otpRegex = /^[0-9]{6}$/;
  return otpRegex.test(otp);
};

export const validateCurrency = (amount: number): boolean => {
  // Check if amount is a valid positive number with max 2 decimal places
  return amount > 0 && /^\d+(\.\d{1,2})?$/.test(amount.toString());
};

export const validateExpenseCategory = (category: string): boolean => {
  const validCategories = [
    'Groceries & Food',
    'Transportation',
    'Utilities',
    'Rent/Housing',
    'Entertainment',
    'Healthcare',
    'Education',
    'Shopping/Retail',
    'Insurance',
    'Subscriptions',
    'Other'
  ];
  return validCategories.includes(category);
};

export const validateLoanType = (loanType: string): boolean => {
  const validTypes = ['Home', 'Auto', 'Personal', 'Education', 'Other'];
  return validTypes.includes(loanType);
};

export const validatePaymentMethod = (method: string): boolean => {
  const validMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI'];
  return validMethods.includes(method);
};

export const validateDeductionLimits = (deductionType: string, amount: number): boolean => {
  // Validate deduction limits as per Indian tax rules
  switch (deductionType) {
    case '80C':
      return amount <= 150000; // Max Rs. 1.5 lakhs
    case '80D':
      return amount <= 100000; // Max Rs. 1 lakh for senior citizens
    case '80E':
      return amount <= 100000; // Max Rs. 1 lakh
    default:
      return true;
  }
};

export const validateIncome = (income: number): boolean => {
  // ITR-1 is for income < Rs. 50 lakhs
  return income < 5000000;
};

export const validateFiscalYear = (fiscalYear: string): boolean => {
  // Format should be YYYY-YY (e.g., 2024-25)
  const fy Regex = /^\d{4}-\d{2}$/;
  return fyRegex.test(fiscalYear);
};
