import api from './api';

export interface ESGIndicator {
  _id: string;
  code: string;
  name: string;
  category: 'ENVIRONMENT' | 'SOCIAL' | 'GOVERNANCE';
  subcategory: string;
  unit: string;
  dataType: 'NUMBER' | 'BOOLEAN' | 'TEXT' | 'PERCENTAGE';
  description?: string;
  isMandatory: boolean;
}

export const getIndicators = async (): Promise<ESGIndicator[]> => {
  const response = await api.get('/indicators');
  return response.data;
};

export const getIndicatorById = async (id: string): Promise<ESGIndicator> => {
  const response = await api.get(`/indicators/${id}`);
  return response.data;
};
