import api from './api';

export interface Organization {
  _id: string;
  name: string;
  type: 'GROUP' | 'SUBSIDIARY' | 'BUSINESS_UNIT';
  parentId?: string;
  code: string;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const getOrganizations = async (): Promise<Organization[]> => {
  const response = await api.get('/organizations');
  return response.data;
};

export const getOrganizationById = async (id: string): Promise<Organization> => {
  const response = await api.get(`/organizations/${id}`);
  return response.data;
};

export const createOrganization = async (data: Partial<Organization>): Promise<Organization> => {
  const response = await api.post('/organizations', data);
  return response.data.data || response.data;
};
