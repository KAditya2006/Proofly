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
    
    // 1 Subsidiary
    const mainSub = await Organization.create({ name: 'Main Subsidiary', type: 'SUBSIDIARY', parentId: group._id, code: 'SUB-MAIN', location: 'India' });
    
    // 25 Business Units under the Subsidiary
    const bus = [];
    for (let i = 1; i <= 25; i++) {
      const bu = await Organization.create({ name: `Business Unit ${i}`, type: 'BUSINESS_UNIT', parentId: mainSub._id, code: `BU-${i.toString().padStart(2, '0')}`, location: 'India' });
      bus.push(bu);
    }

    // 2. Users
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    const usersToInsert = [
      { name: 'System Admin', email: 'admin@meil-demo.com', employeeId: 'MEIL-ADM-0001', mobileNo: '9876543215', passwordHash, role: 'ADMIN', organizationId: group._id },
      { name: 'Subsidiary Manager', email: 'manager@meil-demo.com', employeeId: 'MEIL-SM-0001', mobileNo: '9876543210', passwordHash, role: 'SUBSIDIARY_MANAGER', organizationId: mainSub._id }
    ];

    // 25 BU Reviewers (1 per BU)
    for (let i = 0; i < 25; i++) {
      usersToInsert.push({
        name: `BU Reviewer ${i+1}`,
        email: `reviewer${i+1}@meil-demo.com`,
        employeeId: `MEIL-BU-${(i+1).toString().padStart(4, '0')}`,
        mobileNo: `987654321${i % 10}`,
        passwordHash,
        role: 'BUSINESS_UNIT_REVIEWER',
        organizationId: bus[i]._id
      } as any);
    }

    // 250 Project Officers (10 per BU)
    let poCounter = 1;
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 10; j++) {
        usersToInsert.push({
          name: `Project Officer ${poCounter}`,
          email: `po${poCounter}@meil-demo.com`,
          employeeId: `MEIL-PO-${poCounter.toString().padStart(4, '0')}`,
          mobileNo: `887654321${j % 10}`,
          passwordHash,
          role: 'PROJECT_OFFICER',
          organizationId: bus[i]._id
        } as any);
        poCounter++;
      }
    }

    const createdUsers = await User.insertMany(usersToInsert);
    const pos = createdUsers.filter(u => u.role === 'PROJECT_OFFICER');

    // 3. 250 Projects (1 per PO)
    const projectsToInsert = [];
    let projectCounter = 1;
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 10; j++) {
        const currentPOIndex = (i * 10) + j;
        projectsToInsert.push({
          name: `Project ${projectCounter}`,
          projectCode: `PRJ-${projectCounter.toString().padStart(4, '0')}`,
          organizationId: group._id,
          businessUnitId: bus[i]._id,
          subsidiaryId: mainSub._id,
          location: 'Various, India',
          sector: 'Infrastructure',
          status: 'ACTIVE',
          assignedOfficers: [pos[currentPOIndex]._id]
        });
        projectCounter++;
      }
    }
    
    await Project.insertMany(projectsToInsert);

    console.log('Seed Data Inserted Successfully: 1 Subsidiary, 25 BUs, 25 Reviewers, 250 POs, 250 Projects!');
    process.exit(0);
  } catch (error) {
    console.error('Error with seed data:', error);
    process.exit(1);
  }
};

seedDB();
