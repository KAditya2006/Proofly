import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: 'PROJECT_OFFICER' | 'BUSINESS_UNIT_REVIEWER' | 'SUBSIDIARY_MANAGER' | 'GROUP_ESG_TEAM' | 'AUDITOR' | 'ADMIN';
  organizationId: string;
  mustChangePassword?: boolean;
  token?: string;
}

export const login = async (employeeId: string, password: string): Promise<User> => {
  const response = await api.post('/auth/login', { employeeId, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<any> => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};
