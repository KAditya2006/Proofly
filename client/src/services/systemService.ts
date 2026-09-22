import api from './api';
export interface SystemSettings {
  _id?: string;
  sessionTimeout: string;
  maxFailedLogins: string;
  passwordComplexity: 'low' | 'medium' | 'high';
  maintenanceMode: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  enableAuditLogging: boolean;
  dataRetentionDays: string;
}

export const systemService = {
  getDetailedHealth: async () => {
    const response = await api.get('/health/detailed');
    return response.data;
  },
  
  getIntegrityStatus: async () => {
    const response = await api.get('/system/integrity');
    return response.data;
  },
  
  getJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },
  
  retryJob: async (jobId: string) => {
    const response = await api.post(`/jobs/${jobId}/retry`);
    return response.data;
  },

  getSettings: async (): Promise<SystemSettings> => {
    const response = await api.get('/system/settings');
    return response.data;
  },

  updateSettings: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await api.put('/system/settings', data);
    return response.data;
  }
};
