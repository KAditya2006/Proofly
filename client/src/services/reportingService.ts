import api from './api';

export interface ReportingPeriod {
  _id: string;
  name: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  status: 'PLANNING' | 'OPEN' | 'DATA_COLLECTION' | 'REVIEW' | 'ASSURANCE' | 'FINALIZATION' | 'CLOSED' | 'ARCHIVED';
  isCurrent: boolean;
}

export const getReportingPeriods = async (): Promise<ReportingPeriod[]> => {
  const response = await api.get('/reporting-periods');
  return response.data;
};
export const createReportingPeriod = async (data: any) => {
  const response = await api.post('/reporting-periods', data);
  return response.data;
};
export const updateReportingPeriod = async (id: string, data: any) => {
  const response = await api.put(`/reporting-periods/${id}`, data);
  return response.data;
};
export const getActiveReportingPeriods = async (): Promise<ReportingPeriod[]> => {
  const response = await api.get('/reporting-periods/active');
  return response.data;
};
