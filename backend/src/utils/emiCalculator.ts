/**
 * EMI Calculator utility for Pocket Guard
 * Implements the standard EMI calculation formula for Indian loans
 */

export interface EMICalculation {
  monthlyEMI: number;
  totalPayable: number;
  totalInterest: number;
  endDate: Date;
}

export interface AmortizationScheduleRow {
  month: number;
  date: Date;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

/**
 * Calculate monthly EMI using the formula:
 * EMI = (P × R × (1 + R)^T) / ((1 + R)^T - 1)
 * Where:
 * P = Principal amount (in INR)
 * R = Monthly interest rate (annual rate / 12 / 100)
 * T = Loan tenure in months
 */
export const calculateEMI = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): EMICalculation => {
  if (principal <= 0 || annualInterestRate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid loan parameters');
  }

  // Convert annual rate to monthly rate
  const monthlyRate = annualInterestRate / 12 / 100;

  // Handle zero interest rate case
  if (monthlyRate === 0) {
    const monthlyEMI = principal / tenureMonths;
    return {
      monthlyEMI: Math.round(monthlyEMI * 100) / 100,
      totalPayable: Math.round(principal * 100) / 100,
      totalInterest: 0,
      endDate: new Date()
    };
  }

  // Apply EMI formula
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
  const monthlyEMI = numerator / denominator;

  const totalPayable = monthlyEMI * tenureMonths;
  const totalInterest = totalPayable - principal;

  // Calculate end date
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + tenureMonths);

  return {
    monthlyEMI: Math.round(monthlyEMI * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    endDate
  };
};

/**
 * Generate full amortization schedule (month-by-month breakdown)
 */
export const generateAmortizationSchedule = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  startDate: Date
): AmortizationScheduleRow[] => {
  const schedule: AmortizationScheduleRow[] = [];
  const monthlyRate = annualInterestRate / 12 / 100;

  // Calculate monthly EMI
  const { monthlyEMI } = calculateEMI(principal, annualInterestRate, tenureMonths);

  let remainingBalance = principal;
  let currentDate = new Date(startDate);

  for (let month = 1; month <= tenureMonths; month++) {
    // Calculate interest for this month
    const interestAmount = Math.round(remainingBalance * monthlyRate * 100) / 100;

    // Calculate principal amount for this month
    const principalAmount = Math.round((monthlyEMI - interestAmount) * 100) / 100;

    // Update remaining balance
    remainingBalance = Math.round((remainingBalance - principalAmount) * 100) / 100;

    // Ensure remaining balance doesn't go negative due to rounding
    if (remainingBalance < 0) {
      remainingBalance = 0;
    }

    // Add to schedule
    schedule.push({
      month,
      date: new Date(currentDate),
      principalAmount,
      interestAmount,
      remainingBalance
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
};

/**
 * Calculate remaining balance at a specific month
 */
export const calculateRemainingBalance = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  atMonth: number
): number => {
  if (atMonth <= 0 || atMonth > tenureMonths) {
    throw new Error('Invalid month parameter');
  }

  const schedule = generateAmortizationSchedule(
    principal,
    annualInterestRate,
    tenureMonths,
    new Date()
  );

  return schedule[atMonth - 1].remainingBalance;
};

/**
 * Format currency to INR with 2 decimal places
 */
export const formatToINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
