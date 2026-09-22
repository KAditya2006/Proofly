import api from './api';

export const getTasks = async (params?: Record<string, any>) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const createTask = async (data: Record<string, any>) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTaskStatus = async (id: string, status: string) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data;
};
