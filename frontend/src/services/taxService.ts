import apiClient from './api';

export const getTaxData = async (fiscalYear: string) => {
  const response = await apiClient.get(`/tax/${fiscalYear}`);
  return response.data;
};

export const saveTaxData = async (fiscalYear: string, taxData: any) => {
  const response = await apiClient.post(`/tax/${fiscalYear}`, taxData);
  return response.data;
};

export const calculateTax = async (fiscalYear: string) => {
  const response = await apiClient.get(`/tax/${fiscalYear}/calculate`);
  return response.data;
};

export const submitITR = async (fiscalYear: string, confirm: boolean = true) => {
  const response = await apiClient.post(`/tax/${fiscalYear}/submit-itr1`, { confirm });
  return response.data;
};
