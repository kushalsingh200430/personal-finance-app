/**
 * Tax Calculator utility for Pocket Guard
 * Implements ITR-1 tax calculation for Indian residents
 * Based on FY 2024-25 tax slabs
 */

export interface TaxCalculationResult {
  grossIncome: number;
  totalDeductions: number;
  standardDeduction: number;
  taxableIncome: number;
  taxLiability: number;
  refundOrBalance: number;
  effectiveTaxRate: number;
}

// Tax slabs for FY 2024-25 (in INR)
const TAX_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 0.05 },
  { min: 600000, max: 900000, rate: 0.10 },
  { min: 900000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 }
];

// Health and Education Cess
const HEALTH_EDUCATION_CESS_RATE = 0.04;

// Standard Deduction (50% of salary, max 50,000)
const STANDARD_DEDUCTION_RATE = 0.5;
const STANDARD_DEDUCTION_MAX = 50000;

/**
 * Calculate tax liability based on ITR-1 rules
 */
export const calculateTaxLiability = (
  grossSalary: number,
  hraReceived: number,
  ltaTransportAllowance: number,
  deduction80C: number,
  deduction80D: number,
  deduction80E: number,
  homeLoanInterest: number,
  housePropertyIncome: number,
  otherIncome: number,
  tdsDeducted: number
): TaxCalculationResult => {
  // Calculate gross income
  const grossIncome = grossSalary + housePropertyIncome + otherIncome;

  // Calculate total income from other sources (eligible deductions)
  const incomeFromOtherSources = housePropertyIncome + otherIncome;

  // Calculate taxable income
  // For salary: Gross salary - HRA - LTA - Standard Deduction
  const standardDeduction = Math.min(grossSalary * STANDARD_DEDUCTION_RATE, STANDARD_DEDUCTION_MAX);
  const salaryIncome = grossSalary - hraReceived - ltaTransportAllowance - standardDeduction;

  // Total income before deductions
  const totalIncomeBeforeDeductions = Math.max(salaryIncome + incomeFromOtherSources, 0);

  // Total deductions (80C, 80D, 80E, Home Loan Interest)
  const totalDeductions = deduction80C + deduction80D + deduction80E + homeLoanInterest;

  // Taxable income
  const taxableIncome = Math.max(totalIncomeBeforeDeductions - totalDeductions, 0);

  // Calculate tax
  let taxLiability = calculateTaxOnIncome(taxableIncome);

  // Add Health and Education Cess (4% on tax)
  const cess = taxLiability * HEALTH_EDUCATION_CESS_RATE;
  taxLiability += cess;

  // Round to nearest rupee
  taxLiability = Math.round(taxLiability);

  // Calculate refund or balance due
  const refundOrBalance = tdsDeducted - taxLiability;

  // Calculate effective tax rate
  const effectiveTaxRate = grossIncome > 0 ? (taxLiability / grossIncome) * 100 : 0;

  return {
    grossIncome: Math.round(grossIncome * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    standardDeduction: Math.round(standardDeduction * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    taxLiability: taxLiability,
    refundOrBalance: Math.round(refundOrBalance * 100) / 100,
    effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100
  };
};

/**
 * Calculate tax based on slab system
 */
export const calculateTaxOnIncome = (taxableIncome: number): number => {
  if (taxableIncome <= 0) {
    return 0;
  }

  let tax = 0;

  for (const slab of TAX_SLABS) {
    if (taxableIncome > slab.min) {
      const incomeInSlab = Math.min(taxableIncome, slab.max) - slab.min;
      tax += incomeInSlab * slab.rate;
    }
  }

  return tax;
};

/**
 * Validate tax data for ITR-1 filing
 */
export const validateTaxDataForFiling = (
  grossSalary: number,
  pan: string,
  aadhaar: string,
  tdsDeducted: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Income must be under 50 lakhs for ITR-1
  if (grossSalary >= 5000000) {
    errors.push('Income exceeds Rs. 50 lakhs limit for ITR-1');
  }

  // PAN must be valid
  if (!pan || pan.length !== 10) {
    errors.push('Invalid PAN format');
  }

  // Aadhaar validation
  if (!aadhaar || aadhaar.length !== 12) {
    errors.push('Invalid Aadhaar format');
  }

  // TDS deducted must be reasonable
  if (tdsDeducted < 0) {
    errors.push('TDS deducted cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate deduction limits
 */
export const validateDeductionLimits = (
  deduction80C: number,
  deduction80D: number,
  deduction80E: number,
  homeLoanInterest: number,
  age: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 80C limit: Rs. 1.5 lakhs
  if (deduction80C > 150000) {
    errors.push('Deduction under 80C exceeds maximum limit of Rs. 1,50,000');
  }

  // 80D limit: Rs. 25,000 for individuals, Rs. 50,000 for senior citizens, Rs. 1 lakh for very senior citizens
  const deduction80DLimit = age >= 80 ? 100000 : age >= 60 ? 50000 : 25000;
  if (deduction80D > deduction80DLimit) {
    errors.push(`Deduction under 80D exceeds maximum limit of Rs. ${deduction80DLimit}`);
  }

  // 80E limit: Rs. 1 lakh
  if (deduction80E > 100000) {
    errors.push('Deduction under 80E exceeds maximum limit of Rs. 1,00,000');
  }

  // Home loan interest limit: Rs. 2 lakhs
  if (homeLoanInterest > 200000) {
    errors.push('Home loan interest deduction exceeds maximum limit of Rs. 2,00,000');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format currency to INR
 */
export const formatToINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate tax savings suggestions (future feature)
 */
export const getTaxSavingsSuggestions = (
  currentDeduction80C: number,
  currentDeduction80D: number,
  age: number
): string[] => {
  const suggestions: string[] = [];

  const max80C = 150000;
  if (currentDeduction80C < max80C) {
    const gap = max80C - currentDeduction80C;
    suggestions.push(`You can save up to Rs. ${formatToINR(gap)} more under section 80C (ELSS, PPF, Insurance, etc.)`);
  }

  const max80DLimit = age >= 80 ? 100000 : age >= 60 ? 50000 : 25000;
  if (currentDeduction80D < max80DLimit) {
    const gap = max80DLimit - currentDeduction80D;
    suggestions.push(`You can save up to Rs. ${formatToINR(gap)} more under section 80D (Health Insurance)`);
  }

  return suggestions;
};
