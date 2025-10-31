import PDFDocument from 'pdfkit';
import { AmortizationScheduleRow } from './emiCalculator';

/**
 * PDF Export utilities for Pocket Guard
 */

/**
 * Generate amortization schedule PDF
 */
export const generateAmortizationPDF = (
  loanName: string,
  principal: number,
  interestRate: number,
  tenure: number,
  schedule: AmortizationScheduleRow[]
): Buffer => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Pocket Guard - Amortization Schedule', {
        align: 'center'
      });

      // Loan details
      doc.moveDown(0.5).fontSize(12).font('Helvetica');
      doc.text(`Loan Name: ${loanName}`);
      doc.text(`Principal Amount: ₹${principal.toFixed(2)}`);
      doc.text(`Annual Interest Rate: ${interestRate}%`);
      doc.text(`Loan Tenure: ${tenure} months`);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`);

      // Table
      doc.moveDown(1).fontSize(10).font('Helvetica-Bold');

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 120;
      const col3X = 220;
      const col4X = 300;
      const col5X = 380;
      const rowHeight = 20;

      // Header row
      doc.text('Month', col1X, tableTop);
      doc.text('Date', col2X, tableTop);
      doc.text('Principal', col3X, tableTop);
      doc.text('Interest', col4X, tableTop);
      doc.text('Balance', col5X, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Data rows
      doc.font('Helvetica').fontSize(9);
      let yPosition = tableTop + rowHeight;

      for (const row of schedule) {
        if (yPosition > doc.page.height - 50) {
          doc.addPage();
          yPosition = 50;

          // Repeat header on new page
          doc.font('Helvetica-Bold').fontSize(10);
          doc.text('Month', col1X, yPosition);
          doc.text('Date', col2X, yPosition);
          doc.text('Principal', col3X, yPosition);
          doc.text('Interest', col4X, yPosition);
          doc.text('Balance', col5X, yPosition);
          doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();

          doc.font('Helvetica').fontSize(9);
          yPosition += rowHeight;
        }

        doc.text(row.month.toString(), col1X, yPosition);
        doc.text(row.date.toLocaleDateString('en-IN'), col2X, yPosition);
        doc.text(`₹${row.principalAmount.toFixed(2)}`, col3X, yPosition);
        doc.text(`₹${row.interestAmount.toFixed(2)}`, col4X, yPosition);
        doc.text(`₹${row.remainingBalance.toFixed(2)}`, col5X, yPosition);

        yPosition += rowHeight;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate expense report PDF
 */
export const generateExpenseReportPDF = (
  month: string,
  totalExpenses: number,
  categoryBreakdown: Record<string, number>,
  expenses: any[]
): Buffer => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Pocket Guard - Expense Report', {
        align: 'center'
      });

      // Month and date
      doc.moveDown(0.5).fontSize(12).font('Helvetica');
      doc.text(`Month: ${month}`);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`);

      // Summary
      doc.moveDown(1).fontSize(12).font('Helvetica-Bold');
      doc.text('Summary');
      doc.font('Helvetica').fontSize(11);
      doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`);

      // Category breakdown
      doc.moveDown(1).fontSize(12).font('Helvetica-Bold');
      doc.text('Breakdown by Category');
      doc.font('Helvetica').fontSize(10);

      for (const [category, amount] of Object.entries(categoryBreakdown)) {
        const percentage = ((amount as number) / totalExpenses * 100).toFixed(1);
        doc.text(`${category}: ₹${(amount as number).toFixed(2)} (${percentage}%)`);
      }

      // Detailed expenses
      doc.moveDown(1).fontSize(12).font('Helvetica-Bold');
      doc.text('Detailed Expenses');

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 120;
      const col3X = 220;
      const col4X = 350;
      const rowHeight = 20;

      // Header row
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Date', col1X, tableTop);
      doc.text('Category', col2X, tableTop);
      doc.text('Amount', col3X, tableTop);
      doc.text('Description', col4X, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Data rows
      doc.font('Helvetica').fontSize(9);
      let yPosition = tableTop + rowHeight;

      for (const expense of expenses) {
        if (yPosition > doc.page.height - 50) {
          doc.addPage();
          yPosition = 50;

          // Repeat header on new page
          doc.font('Helvetica-Bold').fontSize(10);
          doc.text('Date', col1X, yPosition);
          doc.text('Category', col2X, yPosition);
          doc.text('Amount', col3X, yPosition);
          doc.text('Description', col4X, yPosition);
          doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();

          doc.font('Helvetica').fontSize(9);
          yPosition += rowHeight;
        }

        const date = new Date(expense.expense_date).toLocaleDateString('en-IN');
        doc.text(date, col1X, yPosition);
        doc.text(expense.category, col2X, yPosition);
        doc.text(`₹${expense.amount.toFixed(2)}`, col3X, yPosition);
        doc.text(expense.description || '-', col4X, yPosition);

        yPosition += rowHeight;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
