import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  organizationId?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  mobileNo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  mustChangePassword?: boolean;
}

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  disableUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
