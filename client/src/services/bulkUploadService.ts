import api from './api';

export const previewBulkUpload = async (formData: FormData) => {
  const response = await api.post('/bulk-upload/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const confirmBulkUpload = async (batchId: string) => {
  const response = await api.post('/bulk-upload/confirm', { batchId });
  return response.data;
};
