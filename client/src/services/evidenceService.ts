import api from './api';

export interface Evidence {
  _id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  projectId: string;
  reportingPeriodId: string;
  indicatorId?: string;
  uploadedBy: any;
  uploadedAt: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export const getEvidence = async (projectId?: string, reportingPeriodId?: string): Promise<Evidence[]> => {
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (reportingPeriodId) params.append('reportingPeriodId', reportingPeriodId);
  
  const response = await api.get(`/evidence?${params.toString()}`);
  return response.data;
};

export const uploadEvidence = async (file: File, data: { projectId: string, reportingPeriodId: string, indicatorId?: string }): Promise<Evidence> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', data.projectId);
  formData.append('reportingPeriodId', data.reportingPeriodId);
  if (data.indicatorId) formData.append('indicatorId', data.indicatorId);

  const response = await api.post('/evidence', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteEvidence = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/evidence/${id}`);
  return response.data;
};

export const getCoverage = async (reportingPeriodId: string): Promise<{ totalRecords: number; recordsWithEvidence: number; coveragePercent: string }> => {
  const response = await api.get('/evidence/coverage', { params: { reportingPeriodId } });
  return response.data;
};

export const getGaps = async (reportingPeriodId: string): Promise<any[]> => {
  const response = await api.get('/evidence/gaps', { params: { reportingPeriodId } });
  return response.data;
};
