import api from './api';

export const getComments = async (referenceId: string, referenceType: string) => {
  const response = await api.get('/comments', { params: { referenceId, referenceType } });
  return response.data;
};

export const createComment = async (data: { referenceId: string, referenceType: string, commentText: string }) => {
  const response = await api.post('/comments', data);
  return response.data;
};
