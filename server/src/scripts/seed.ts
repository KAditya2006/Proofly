import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Organization from '../models/Organization';
import User from '../models/User';
import ReportingPeriod from '../models/ReportingPeriod';
import ESGIndicator from '../models/ESGIndicator';
import Project from '../models/Project';
import ESGRecord from '../models/ESGRecord';
import ValueChainPartner from '../models/ValueChainPartner';
import Report from '../models/Report';
import AuditLog from '../models/AuditLog';
import BRSRDisclosure from '../models/BRSRDisclosure';
import RegulatoryConfiguration from '../models/RegulatoryConfiguration';
import ComplianceControl from '../models/ComplianceControl';
import AssuranceSample from '../models/AssuranceSample';
import AssuranceFinding from '../models/AssuranceFinding';
import Integration from '../models/Integration';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string || 'mongodb://localhost:27017/meil_esg_dev');
    console.log('MongoDB Connected for Full Hackathon Demo Seeding');

    // Clear existing data
    console.log('Clearing old data...');
    await Organization.deleteMany({});
    await User.deleteMany({});
    await ReportingPeriod.deleteMany({});
    await ESGIndicator.deleteMany({});
    await Project.deleteMany({});
    await ESGRecord.deleteMany({});
    await ValueChainPartner.deleteMany({});
    await Report.deleteMany({});
    await AuditLog.deleteMany({});
    await BRSRDisclosure.deleteMany({});
    await RegulatoryConfiguration.deleteMany({});
    await ComplianceControl.deleteMany({});
    await AssuranceSample.deleteMany({});
    await AssuranceFinding.deleteMany({});
    await Integration.deleteMany({});
    const ImportBatch = require('../models/ImportBatch').default;
    await ImportBatch.deleteMany({});

    // 1. Organizations (Hierarchy)
    const group = await Organization.create({ name: 'MEIL Group', type: 'GROUP', code: 'MEIL-GRP', location: 'Hyderabad, India' });
    
    const infraSub = await Organization.create({ name: 'MEIL Infrastructure', type: 'SUBSIDIARY', parentId: group._id, code: 'MEIL-INF', location: 'India' });
    const energySub = await Organization.create({ name: 'MEIL Energy', type: 'SUBSIDIARY', parentId: group._id, code: 'MEIL-ENG', location: 'India' });

    const roadsBu = await Organization.create({ name: 'Roads & Highways', type: 'BUSINESS_UNIT', parentId: infraSub._id, code: 'BU-ROADS', location: 'India' });
    const waterBu = await Organization.create({ name: 'Water Infrastructure', type: 'BUSINESS_UNIT', parentId: infraSub._id, code: 'BU-WATER', location: 'India' });
    const energyBu = await Organization.create({ name: 'Energy Projects', type: 'BUSINESS_UNIT', parentId: energySub._id, code: 'BU-ENG-PROJ', location: 'India' });

    // 4. Users
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    await User.insertMany([
      { name: 'System Admin', email: 'admin@meil-demo.com', employeeId: 'MEIL-ADM-0001', mobileNo: '9876543215', passwordHash, role: 'ADMIN', organizationId: group._id }
    ]);

    // --- DUMMY DATA REMOVED FOR DEMO ---
    // Projects, ESG Records, ValueChainPartners, AssuranceSamples, and AssuranceFindings 
    // have been removed to provide a clean slate for the live demo. Users can now
    // create these entities from scratch using the UI.
    console.log('Seed Data Inserted Successfully for Hackathon Demo! (Clean State - No Projects or Records)');
    process.exit(0);
  } catch (error) {
    console.error('Error with seed data:', error);
    process.exit(1);
  }
};

seedDB();
