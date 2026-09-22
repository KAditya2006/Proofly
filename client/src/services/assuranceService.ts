import api from './api';

export interface AssuranceSample {
  _id: string;
  recordId: any;
  reportingPeriodId: string;
  selectedBy: {
    _id: string;
    name: string;
    role: string;
  };
  reason: string;
  status: 'SELECTED' | 'UNDER_REVIEW' | 'CLEARED' | 'ISSUE_FOUND';
  createdAt: string;
}

export interface AssuranceFinding {
  _id: string;
  sampleId: any;
  recordId: any;
  reportingPeriodId: string;
  findingTitle: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  resolvedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  resolutionRemarks?: string;
  createdAt: string;
}

export const getSamples = async (reportingPeriodId: string): Promise<AssuranceSample[]> => {
  const response = await api.get('/assurance/samples', { params: { reportingPeriodId } });
  return response.data;
};

export const createSample = async (data: { recordId: string; reportingPeriodId: string; reason: string }): Promise<AssuranceSample> => {
  const response = await api.post('/assurance/samples', data);
  return response.data;
};

export const updateSampleStatus = async (id: string, status: string): Promise<AssuranceSample> => {
  const response = await api.patch(`/assurance/samples/${id}`, { status });
  return response.data;
};

export const getFindings = async (reportingPeriodId?: string): Promise<AssuranceFinding[]> => {
  const response = await api.get('/assurance/findings', { params: { reportingPeriodId } });
  return response.data;
};

export const createFinding = async (data: { sampleId: string; findingTitle: string; description: string; severity: string }): Promise<AssuranceFinding> => {
  const response = await api.post('/assurance/findings', data);
  return response.data;
};

export const resolveFinding = async (id: string, resolutionRemarks: string): Promise<AssuranceFinding> => {
  const response = await api.patch(`/assurance/findings/${id}/resolve`, { resolutionRemarks });
  return response.data;
};
