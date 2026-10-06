import api from './api';

export const generateReport = async (data: {
  reportingPeriodId: string;
  scopeLevel: string;
  scopeId?: string;
  reportType: string;
}) => {
  const response = await api.post('/reports/generate', data);
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const getReportById = async (id: string) => {
  const response = await api.get(`/reports/${id}`);
  return response.data;
};

export const qualityCheckReport = async (id: string) => {
  const response = await api.post(`/reports/${id}/quality-check`);
  return response.data;
};

export const submitReportReview = async (id: string) => {
  const response = await api.post(`/reports/${id}/submit-review`);
  return response.data;
};

export const finalizeReport = async (id: string) => {
  const response = await api.post(`/reports/${id}/finalize`);
  return response.data;
};

export const archiveReport = async (id: string) => {
  const response = await api.post(`/reports/${id}/archive`);
  return response.data;
};

export const getReportVersions = async (id: string) => {
  const response = await api.get(`/reports/${id}/versions`);
  return response.data;
};

export const compareReports = async (id: string, compareWithId?: string) => {
  const url = compareWithId ? `/reports/${id}/compare?compareWith=${compareWithId}` : `/reports/${id}/compare`;
  const response = await api.get(url);
  return response.data;
};

export const getReportLineage = async (id: string) => {
  const response = await api.get(`/reports/${id}/lineage`);
  return response.data;
};

export const getEvidencePack = async (id: string) => {
  const response = await api.get(`/reports/${id}/evidence-pack`);
  return response.data;
};

export const exportReport = async (id: string, format: string) => {
  const response = await api.get(`/reports/${id}/export?format=${format}`, {
    responseType: 'blob'
  });
  return response.data;
};
