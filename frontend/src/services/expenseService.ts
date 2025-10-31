import apiClient from './api';

export const createExpense = async (expenseData: any) => {
  const response = await apiClient.post('/expenses', expenseData);
  return response.data;
};

export const getExpenses = async (startDate?: string, endDate?: string, category?: string) => {
  const response = await apiClient.get('/expenses', {
    params: { start_date: startDate, end_date: endDate, category }
  });
  return response.data;
};

export const getExpenseSummary = async (month?: number, year?: number) => {
  const response = await apiClient.get('/expenses/summary', {
    params: { month, year }
  });
  return response.data;
};

export const exportExpenseReport = async (format: string = 'pdf', month?: number, year?: number) => {
  const response = await apiClient.get('/expenses/export', {
    params: { format, month, year },
    responseType: format === 'pdf' ? 'blob' : 'text'
  });
  return response.data;
};

export const updateExpense = async (expenseId: string, data: any) => {
  const response = await apiClient.put(`/expenses/${expenseId}`, data);
  return response.data;
};

export const deleteExpense = async (expenseId: string) => {
  const response = await apiClient.delete(`/expenses/${expenseId}`);
  return response.data;
};
