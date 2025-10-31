import apiClient from './api';

export const createLoan = async (loanData: any) => {
  const response = await apiClient.post('/loans', loanData);
  return response.data;
};

export const getLoans = async () => {
  const response = await apiClient.get('/loans');
  return response.data;
};

export const getLoanDetail = async (loanId: string) => {
  const response = await apiClient.get(`/loans/${loanId}`);
  return response.data;
};

export const updateLoan = async (loanId: string, data: any) => {
  const response = await apiClient.put(`/loans/${loanId}`, data);
  return response.data;
};

export const deleteLoan = async (loanId: string) => {
  const response = await apiClient.delete(`/loans/${loanId}`);
  return response.data;
};

export const markLoanPaid = async (loanId: string) => {
  const response = await apiClient.patch(`/loans/${loanId}/mark-paid`, {});
  return response.data;
};

export const exportAmortization = async (loanId: string, format: string = 'json') => {
  const response = await apiClient.get(`/loans/${loanId}/amortization?format=${format}`, {
    responseType: format === 'pdf' ? 'blob' : 'json'
  });
  return response.data;
};
