import { Request, Response } from 'express';
import BRSRDisclosure from '../models/BRSRDisclosure';
import RegulatoryConfiguration from '../models/RegulatoryConfiguration';
import ComplianceControl from '../models/ComplianceControl';

export const getDisclosures = async (req: Request, res: Response) => {
  try {
    const activeConfig = await RegulatoryConfiguration.findOne({ status: 'ACTIVE' });
    let filter: any = {};
    if (activeConfig) {
      filter.regulatoryConfigId = activeConfig._id;
    }

    const disclosures = await BRSRDisclosure.find(filter).sort({ disclosureId: 1 });
    res.json(disclosures);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getActiveConfiguration = async (req: Request, res: Response) => {
  try {
    const config = await RegulatoryConfiguration.findOne({ status: 'ACTIVE' });
    if (!config) return res.status(404).json({ message: 'No active configuration found' });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getComplianceControls = async (req: Request, res: Response) => {
  try {
    const controls = await ComplianceControl.find().sort({ controlId: 1 });
    res.json(controls);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
