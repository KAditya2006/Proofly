import api from './api';

export interface Project {
  _id: string;
  name: string;
  projectCode: string;
  organizationId: any;
  businessUnitId?: any;
  subsidiaryId?: any;
  location: string;
  sector: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  assignedOfficers: any[];
}

export const getProjects = async (page = 1, limit = 50): Promise<Project[]> => {
  const response = await api.get(`/projects?page=${page}&limit=${limit}`);
  return response.data.data || response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  const response = await api.post('/projects', projectData);
  return response.data.data || response.data;
};
