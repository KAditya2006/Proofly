import api from './api';
import type { ESGRecord } from './esgRecordService';

export const getPendingReviews = async (): Promise<ESGRecord[]> => {
  const response = await api.get('/reviews');
  return response.data;
};

export const approveSubmission = async (id: string): Promise<ESGRecord> => {
  const response = await api.post(`/reviews/${id}/approve`);
  return response.data;
};

export const requestCorrection = async (id: string, reason: string): Promise<ESGRecord> => {
  const response = await api.post(`/reviews/${id}/correction`, { reason });
  return response.data;
};

export const rejectSubmission = async (id: string, reason: string): Promise<ESGRecord> => {
  const response = await api.post(`/reviews/${id}/reject`, { reason });
  return response.data;
};

export const escalateSubmission = async (id: string): Promise<ESGRecord> => {
  const response = await api.post(`/reviews/${id}/escalate`);
  return response.data;
};
