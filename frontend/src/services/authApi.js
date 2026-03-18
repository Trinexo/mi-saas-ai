import { apiRequest } from './api';

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  getProfile: (token) => apiRequest('/auth/me', { token }),
  updateProfile: (token, payload) => apiRequest('/auth/me', { method: 'PUT', body: payload, token }),
  changePassword: (token, payload) => apiRequest('/auth/password', { method: 'PUT', body: payload, token }),
};