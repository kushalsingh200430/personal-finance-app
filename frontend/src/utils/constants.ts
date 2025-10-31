export const EXPENSE_CATEGORIES = [
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

export const LOAN_TYPES = ['Home', 'Auto', 'Personal', 'Education', 'Other'];

export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI'];

export const DATE_FORMAT = 'DD/MM/YYYY';

export const CURRENCY = 'INR';

export const CURRENCY_SYMBOL = '₹';

export const TAX_SLABS_2024_25 = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 5 },
  { min: 600000, max: 900000, rate: 10 },
  { min: 900000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 }
];
