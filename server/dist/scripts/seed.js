"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const Organization_1 = __importDefault(require("../models/Organization"));
const User_1 = __importDefault(require("../models/User"));
const ReportingPeriod_1 = __importDefault(require("../models/ReportingPeriod"));
const ESGIndicator_1 = __importDefault(require("../models/ESGIndicator"));
const Project_1 = __importDefault(require("../models/Project"));
const ESGRecord_1 = __importDefault(require("../models/ESGRecord"));
const ValueChainPartner_1 = __importDefault(require("../models/ValueChainPartner"));
const Report_1 = __importDefault(require("../models/Report"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const BRSRDisclosure_1 = __importDefault(require("../models/BRSRDisclosure"));
const RegulatoryConfiguration_1 = __importDefault(require("../models/RegulatoryConfiguration"));
const ComplianceControl_1 = __importDefault(require("../models/ComplianceControl"));
const AssuranceSample_1 = __importDefault(require("../models/AssuranceSample"));
const AssuranceFinding_1 = __importDefault(require("../models/AssuranceFinding"));
const Integration_1 = __importDefault(require("../models/Integration"));
dotenv_1.default.config();
const seedDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg_dev');
        console.log('MongoDB Connected for Full Hackathon Demo Seeding');
        // Clear existing data
        console.log('Clearing old data...');
        await Organization_1.default.deleteMany({});
        await User_1.default.deleteMany({});
        await ReportingPeriod_1.default.deleteMany({});
        await ESGIndicator_1.default.deleteMany({});
        await Project_1.default.deleteMany({});
        await ESGRecord_1.default.deleteMany({});
        await ValueChainPartner_1.default.deleteMany({});
        await Report_1.default.deleteMany({});
        await AuditLog_1.default.deleteMany({});
        await BRSRDisclosure_1.default.deleteMany({});
        await RegulatoryConfiguration_1.default.deleteMany({});
        await ComplianceControl_1.default.deleteMany({});
        await AssuranceSample_1.default.deleteMany({});
        await AssuranceFinding_1.default.deleteMany({});
        await Integration_1.default.deleteMany({});
        const ImportBatch = require('../models/ImportBatch').default;
        await ImportBatch.deleteMany({});
        // 1. Organizations (Hierarchy)
        const group = await Organization_1.default.create({ name: 'MEIL Group', type: 'GROUP', code: 'MEIL-GRP', location: 'Hyderabad, India' });
        // 1 Subsidiary
        const mainSub = await Organization_1.default.create({ name: 'Main Subsidiary', type: 'SUBSIDIARY', parentId: group._id, code: 'SUB-MAIN', location: 'India' });
        // 25 Business Units under the Subsidiary
        const bus = [];
        for (let i = 1; i <= 25; i++) {
            const bu = await Organization_1.default.create({ name: `Business Unit ${i}`, type: 'BUSINESS_UNIT', parentId: mainSub._id, code: `BU-${i.toString().padStart(2, '0')}`, location: 'India' });
            bus.push(bu);
        }
        // 2. Users
        const passwordHash = await bcryptjs_1.default.hash('Demo123!', 10);
        const usersToInsert = [
            { name: 'System Admin', email: 'admin@meil-demo.com', employeeId: 'MEIL-ADM-0001', mobileNo: '9876543215', passwordHash, role: 'ADMIN', organizationId: group._id },
            { name: 'Subsidiary Manager', email: 'manager@meil-demo.com', employeeId: 'MEIL-SM-0001', mobileNo: '9876543210', passwordHash, role: 'SUBSIDIARY_MANAGER', organizationId: mainSub._id }
        ];
        // 25 BU Reviewers (1 per BU)
        for (let i = 0; i < 25; i++) {
            usersToInsert.push({
                name: `BU Reviewer ${i + 1}`,
                email: `reviewer${i + 1}@meil-demo.com`,
                employeeId: `MEIL-BU-${(i + 1).toString().padStart(4, '0')}`,
                mobileNo: `987654321${i % 10}`,
                passwordHash,
                role: 'BUSINESS_UNIT_REVIEWER',
                organizationId: bus[i]._id
            });
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
                });
                poCounter++;
            }
        }
        const createdUsers = await User_1.default.insertMany(usersToInsert);
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
        await Project_1.default.insertMany(projectsToInsert);
        console.log('Seed Data Inserted Successfully: 1 Subsidiary, 25 BUs, 25 Reviewers, 250 POs, 250 Projects!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error with seed data:', error);
        process.exit(1);
    }
};
seedDB();
