import { AmortizationScheduleRow } from './emiCalculator';

/**
 * CSV Export utilities for Pocket Guard
 */

/**
 * Generate amortization schedule CSV
 */
export const generateAmortizationCSV = (
  loanName: string,
  principal: number,
  interestRate: number,
  tenure: number,
  schedule: AmortizationScheduleRow[]
): string => {
  let csv = 'Pocket Guard - Amortization Schedule\n';
  csv += `Loan Name,${loanName}\n`;
  csv += `Principal Amount,₹${principal.toFixed(2)}\n`;
  csv += `Annual Interest Rate,${interestRate}%\n`;
  csv += `Loan Tenure,${tenure} months\n`;
  csv += `Generated on,${new Date().toLocaleDateString('en-IN')}\n\n`;

  // Header row
  csv += 'Month,Date,Principal Amount,Interest Amount,Remaining Balance\n';

  // Data rows
  for (const row of schedule) {
    csv += `${row.month},${row.date.toLocaleDateString('en-IN')},${row.principalAmount.toFixed(2)},${row.interestAmount.toFixed(2)},${row.remainingBalance.toFixed(2)}\n`;
  }

  return csv;
};

/**
 * Generate expense report CSV
 */
export const generateExpenseReportCSV = (
  month: string,
  totalExpenses: number,
  categoryBreakdown: Record<string, number>,
  expenses: any[]
): string => {
  let csv = 'Pocket Guard - Expense Report\n';
  csv += `Month,${month}\n`;
  csv += `Generated on,${new Date().toLocaleDateString('en-IN')}\n`;
  csv += `Total Expenses,₹${totalExpenses.toFixed(2)}\n\n`;

  // Category breakdown
  csv += 'Category Breakdown\n';
  csv += 'Category,Amount,Percentage\n';

  for (const [category, amount] of Object.entries(categoryBreakdown)) {
    const percentage = ((amount as number) / totalExpenses * 100).toFixed(1);
    csv += `${category},${(amount as number).toFixed(2)},${percentage}%\n`;
  }

  csv += '\n';

  // Detailed expenses
  csv += 'Detailed Expenses\n';
  csv += 'Date,Category,Amount,Description,Payment Method\n';

  for (const expense of expenses) {
    const date = new Date(expense.expense_date).toLocaleDateString('en-IN');
    const description = (expense.description || '').replace(/,/g, ';'); // Handle commas in description
    csv += `${date},${expense.category},${expense.amount.toFixed(2)},"${description}",${expense.payment_method}\n`;
  }

  return csv;
};

/**
 * Generate tax summary CSV
 */
export const generateTaxSummaryCSV = (
  fiscalYear: string,
  taxData: any,
  calculation: any
): string => {
  let csv = 'Pocket Guard - Tax Summary\n';
  csv += `Fiscal Year,${fiscalYear}\n`;
  csv += `Generated on,${new Date().toLocaleDateString('en-IN')}\n\n`;

  // Income details
  csv += 'Income Details\n';
  csv += 'Item,Amount\n';
  csv += `Gross Salary,₹${taxData.gross_salary.toFixed(2)}\n`;
  csv += `HRA Received,₹${taxData.hra_received.toFixed(2)}\n`;
  csv += `LTA/Transport Allowance,₹${taxData.lta_transport_allowance.toFixed(2)}\n`;
  csv += `House Property Income,₹${taxData.house_property_income.toFixed(2)}\n`;
  csv += `Other Income,₹${taxData.other_income.toFixed(2)}\n\n`;

  // Deductions
  csv += 'Deductions\n';
  csv += 'Item,Amount\n';
  csv += `Deduction 80C,₹${taxData.deduction_80c.toFixed(2)}\n`;
  csv += `Deduction 80D,₹${taxData.deduction_80d.toFixed(2)}\n`;
  csv += `Deduction 80E,₹${taxData.deduction_80e.toFixed(2)}\n`;
  csv += `Home Loan Interest,₹${taxData.home_loan_interest.toFixed(2)}\n\n`;

  // Tax calculation
  csv += 'Tax Calculation\n';
  csv += 'Item,Amount\n';
  csv += `Gross Income,₹${calculation.grossIncome.toFixed(2)}\n`;
  csv += `Total Deductions,₹${calculation.totalDeductions.toFixed(2)}\n`;
  csv += `Standard Deduction,₹${calculation.standardDeduction.toFixed(2)}\n`;
  csv += `Taxable Income,₹${calculation.taxableIncome.toFixed(2)}\n`;
  csv += `Tax Liability,₹${calculation.taxLiability.toFixed(2)}\n`;
  csv += `TDS Deducted,₹${taxData.tds_deducted.toFixed(2)}\n`;
  csv += `Refund/Balance,₹${calculation.refundOrBalance.toFixed(2)}\n`;
  csv += `Effective Tax Rate,${calculation.effectiveTaxRate}%\n`;

  return csv;
};

/**
 * Escape CSV field (handle special characters)
 */
const escapeCSVField = (field: string | number): string => {
  const fieldStr = field.toString();
  if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  return fieldStr;
};
