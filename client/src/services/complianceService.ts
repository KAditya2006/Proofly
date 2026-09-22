import api from './api';

export interface BRSRDisclosure {
  _id: string;
  disclosureId: string;
  section: 'A' | 'B' | 'C';
  principle?: string;
  question: string;
  indicatorType: 'ESSENTIAL' | 'LEADERSHIP';
  applicableRoles: string[];
  requiredEvidence: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RegulatoryConfiguration {
  _id: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  remarks?: string;
}

export interface ComplianceControl {
  _id: string;
  controlId: string;
  requirement: string;
  systemControl: string;
  evidenceType: string;
  ownerRole: string;
  status: 'IMPLEMENTED' | 'PARTIALLY_IMPLEMENTED' | 'NOT_APPLICABLE' | 'NEEDS_ATTENTION';
  remarks?: string;
}

export const getDisclosures = async (): Promise<BRSRDisclosure[]> => {
  const response = await api.get('/compliance/disclosures');
  return response.data;
};

export const getActiveConfiguration = async (): Promise<RegulatoryConfiguration> => {
  const response = await api.get('/compliance/configuration/active');
  return response.data;
};

export const getComplianceControls = async (): Promise<ComplianceControl[]> => {
  const response = await api.get('/compliance/controls');
  return response.data;
};
