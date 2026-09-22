import api from './api';

export interface ConsolidatedKPI {
  indicator: {
    _id: string;
    code: string;
    name: string;
    unit: string;
    category: string;
    aggregationMethod: string;
  };
  value: number;
  contributorsCount: number;
}

export interface ReadinessMetrics {
  overall: number;
  dataCompleteness: number;
  evidenceCoverage: number;
  approval: number;
  mapping: number;
  breakdown: {
    missingData: number;
    missingEvidence: number;
    pendingApproval: number;
    missingMapping: number;
  };
}

export const getConsolidatedKPIs = async (reportingPeriodId: string, scopeLevel: string, scopeId?: string): Promise<ConsolidatedKPI[]> => {
  const params = new URLSearchParams({ reportingPeriodId, scopeLevel });
  if (scopeId) params.append('scopeId', scopeId);

  const response = await api.get(`/consolidation/kpis?${params.toString()}`);
  return response.data;
};

export const getConsolidationLineage = async (indicatorId: string, reportingPeriodId: string, scopeLevel: string, scopeId?: string) => {
  const params = new URLSearchParams({ reportingPeriodId, scopeLevel, indicatorId });
  if (scopeId) params.append('scopeId', scopeId);

  const response = await api.get(`/consolidation/lineage?${params.toString()}`);
  return response.data; // Array of detailed ESGRecords
};

export const getReadiness = async (reportingPeriodId: string): Promise<ReadinessMetrics> => {
  const response = await api.get(`/consolidation/readiness?reportingPeriodId=${reportingPeriodId}`);
  return response.data;
};
