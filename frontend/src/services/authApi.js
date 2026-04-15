import { apiRequest } from './api';

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  getProfile: (token) => apiRequest('/auth/me', { token }),
  updateProfile: (token, payload) => apiRequest('/auth/me', { method: 'PUT', body: payload, token }),
  changePassword: (token, payload) => apiRequest('/auth/password', { method: 'PUT', body: payload, token }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, passwordNuevo) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: { token, passwordNuevo } }),
};