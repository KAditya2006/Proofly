import api from './api';
import type { Project } from './projectService';
import type { ReportingPeriod } from './reportingService';
import type { ESGIndicator } from './indicatorService';

export interface ESGRecord {
  _id: string;
  indicatorId: ESGIndicator | string;
  projectId: Project | string;
  organizationId: string;
  reportingPeriodId: ReportingPeriod | string;
  value: number | string | boolean;
  unit: string;
  source?: string;
  calculationMethod?: string;
  remarks?: string;
  evidenceIds: any[];
  status: 'DRAFT' | 'VALIDATION_FAILED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'APPROVED' | 'REJECTED';
  correctionReason?: string;
  submittedBy?: any;
  approvedBy?: any;
  createdBy?: any;
  updatedBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const getRecords = async (page = 1, limit = 50, params: any = {}): Promise<ESGRecord[]> => {
  const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  const response = await api.get(`/esg/records?${queryParams.toString()}`);
  return response.data.data || response.data;
};

export const getRecordById = async (id: string): Promise<ESGRecord> => {
  const response = await api.get(`/esg/records/${id}`);
  return response.data;
};

export const createRecord = async (data: Partial<ESGRecord>): Promise<ESGRecord> => {
  const response = await api.post('/esg/records', data);
  return response.data;
};

export const updateRecord = async (id: string, data: Partial<ESGRecord>): Promise<ESGRecord> => {
  const response = await api.put(`/esg/records/${id}`, data);
  return response.data;
};

export const validateRecord = async (id: string): Promise<{ record: ESGRecord, validation: ValidationResult }> => {
  const response = await api.post(`/esg/records/${id}/validate`);
  return response.data;
};

export const submitRecord = async (id: string): Promise<ESGRecord> => {
  const response = await api.post(`/esg/records/${id}/submit`);
  return response.data;
};
