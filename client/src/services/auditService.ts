import api from './api';

export const auditService = {
  getAuditLogs: async (filters: any) => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.userId) params.append('userId', filters.userId);
    
    const response = await api.get(`/audit?${params.toString()}`);
    return response.data;
  },
  
  getAuditLogById: async (id: string) => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  }
};
