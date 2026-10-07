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

const cleanDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string || 'mongodb://localhost:27017/meil_esg_dev');
    console.log('MongoDB Connected. Cleaning up dummy data...');

    // Clear everything
    await Organization.deleteMany({});
    await User.deleteMany({});
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
    
    // Check for ImportBatch without failing if it doesn't exist
    try {
      const ImportBatch = require('../models/ImportBatch').default;
      await ImportBatch.deleteMany({});
    } catch(e) {}

    // We MUST keep at least one Admin user and Group organization so you can login.
    const group = await Organization.create({ name: 'MEIL Group (Real)', type: 'GROUP', code: 'MEIL-GRP', location: 'Hyderabad, India' });
    
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    await User.create({ 
      name: 'Main Admin', 
      email: 'admin@meil-demo.com', // You can change this later from UI or update code
      employeeId: 'MEIL-ADM-0001', 
      mobileNo: '9876543215', 
      passwordHash, 
      role: 'ADMIN', 
      organizationId: group._id 
    });

    console.log('Dummy data cleared successfully! Only Main Admin and Group Organization remain.');
    console.log('Login with: admin@meil-demo.com / Demo123!');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning data:', error);
    process.exit(1);
  }
};

cleanDB();
