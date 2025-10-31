import apiClient from './api';

export const verifyPAN = async (panData: any) => {
  const response = await apiClient.post('/pan/verify', panData);
  return response.data;
};

export const verifyPANAadhaarLinkage = async (pan: string, aadhaar: string) => {
  const response = await apiClient.post('/pan/verify-linkage', { pan, aadhaar });
  return response.data;
};

export const getPANDetails = async () => {
  const response = await apiClient.get('/pan/details');
  return response.data;
};

export const getVerificationHistory = async () => {
  const response = await apiClient.get('/pan/verification-history');
  return response.data;
};

export const getFilingHistory = async () => {
  const response = await apiClient.get('/pan/filing-history');
  return response.data;
};

export const validatePANForITR = async (pan: string, income: number) => {
  const response = await apiClient.post('/pan/validate-for-itr', { pan, income });
  return response.data;
};

export const storeFilingRecord = async (filingData: any) => {
  const response = await apiClient.post('/pan/store-filing', filingData);
  return response.data;
};

export const getFilingStatus = async (fiscalYear: string) => {
  const response = await apiClient.get(`/pan/filing/${fiscalYear}`);
  return response.data;
};
