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

const wipeDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string || 'mongodb://localhost:27017/meil_esg_dev');
    console.log('MongoDB Connected. Wiping all demo data...');

    // Clear existing data
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
    
    // Using require for default exports that might not be consistently typed if missing
    try {
      const ImportBatch = require('../models/ImportBatch').default;
      if (ImportBatch) await ImportBatch.deleteMany({});
    } catch(e) {}

    // We must retain the root Group organization and the Admin user so you can log in.
    const group = await Organization.create({ 
      name: 'MEIL Group', 
      type: 'GROUP', 
      code: 'MEIL-GRP', 
      location: 'Hyderabad, India' 
    });
    
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    await User.create([
      { 
        name: 'System Admin', 
        email: 'admin@meil-demo.com', 
        employeeId: 'MEIL-ADM-0001', 
        mobileNo: '9876543215', 
        passwordHash, 
        role: 'ADMIN', 
        organizationId: group._id,
        isEmailVerified: true
      }
    ]);

    console.log('Successfully wiped all demo data. A clean MEIL Group root and System Admin user have been retained.');
    process.exit(0);
  } catch (error) {
    console.error('Error wiping data:', error);
    process.exit(1);
  }
};

wipeDB();
