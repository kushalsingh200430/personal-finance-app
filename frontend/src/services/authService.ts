import apiClient from './api';

export const signup = async (email?: string, password?: string, phone?: string, pan: string, firstName?: string, lastName?: string) => {
  const response = await apiClient.post('/auth/signup', {
    email, password, phone_number: phone, pan, first_name: firstName, last_name: lastName
  });
  return response.data;
};

export const login = async (email?: string, password?: string, phone?: string) => {
  const response = await apiClient.post('/auth/login', {
    email, password, phone_number: phone
  });
  return response.data;
};

export const verifyOTP = async (userId: string, otp: string, purpose: string = '2fa') => {
  const response = await apiClient.post('/auth/verify-otp', {
    user_id: userId, otp_code: otp, purpose
  });
  if (response.data.session_token) {
    localStorage.setItem('accessToken', response.data.session_token);
    localStorage.setItem('userId', userId);
  }
  return response.data;
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userId');
};

export const getProfile = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await apiClient.put('/users/profile', data);
  return response.data;
};
