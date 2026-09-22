import api from './api';

export interface AnalyticsOverview {
  readiness: {
    overall: number;
    brsrCore: number;
    [key: string]: any;
  };
  attentionRequired: {
    pendingApprovals: number;
    validationErrors: number;
    missingEvidence: number;
    incompleteDisclosures: number;
  };
}

export interface TrendData {
  periodId: string;
  periodName: string;
  financialYear: string;
  value: number;
}

export interface ContributorData {
  projectId: string;
  projectName: string;
  projectCode: string;
  value: number;
  percentage: string;
}

export interface DataQuality {
  _id: string; // Status
  count: number;
}

export interface Anomaly {
  indicatorId: string;
  type: 'SPIKE' | 'DROP';
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export const getOverview = async (reportingPeriodId: string): Promise<AnalyticsOverview> => {
  const response = await api.get('/analytics/overview', { params: { reportingPeriodId } });
  return response.data;
};

export const getTrends = async (indicatorId: string): Promise<TrendData[]> => {
  const response = await api.get('/analytics/trends', { params: { indicatorId } });
  return response.data;
};

export const getContributors = async (indicatorId: string, reportingPeriodId: string): Promise<ContributorData[]> => {
  const response = await api.get('/analytics/contributors', { params: { indicatorId, reportingPeriodId } });
  return response.data;
};

export const getDataQuality = async (reportingPeriodId?: string): Promise<DataQuality[]> => {
  const response = await api.get('/analytics/data-quality', { params: { reportingPeriodId } });
  return response.data;
};

export const getAnomalies = async (indicatorId: string, reportingPeriodId: string, threshold?: number): Promise<Anomaly[]> => {
  const response = await api.get('/analytics/anomalies', { params: { indicatorId, reportingPeriodId, threshold } });
  return response.data;
};
