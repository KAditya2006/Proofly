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
        const infraSub = await Organization_1.default.create({ name: 'MEIL Infrastructure', type: 'SUBSIDIARY', parentId: group._id, code: 'MEIL-INF', location: 'India' });
        const energySub = await Organization_1.default.create({ name: 'MEIL Energy', type: 'SUBSIDIARY', parentId: group._id, code: 'MEIL-ENG', location: 'India' });
        const roadsBu = await Organization_1.default.create({ name: 'Roads & Highways', type: 'BUSINESS_UNIT', parentId: infraSub._id, code: 'BU-ROADS', location: 'India' });
        const waterBu = await Organization_1.default.create({ name: 'Water Infrastructure', type: 'BUSINESS_UNIT', parentId: infraSub._id, code: 'BU-WATER', location: 'India' });
        const energyBu = await Organization_1.default.create({ name: 'Energy Projects', type: 'BUSINESS_UNIT', parentId: energySub._id, code: 'BU-ENG-PROJ', location: 'India' });
        // 4. Users
        const passwordHash = await bcryptjs_1.default.hash('Demo123!', 10);
        await User_1.default.insertMany([
            { name: 'System Admin', email: 'admin@meil-demo.com', employeeId: 'MEIL-ADM-0001', mobileNo: '9876543215', passwordHash, role: 'ADMIN', organizationId: group._id }
        ]);
        // --- DUMMY DATA REMOVED FOR DEMO ---
        // Projects, ESG Records, ValueChainPartners, AssuranceSamples, and AssuranceFindings 
        // have been removed to provide a clean slate for the live demo. Users can now
        // create these entities from scratch using the UI.
        console.log('Seed Data Inserted Successfully for Hackathon Demo! (Clean State - No Projects or Records)');
        process.exit(0);
    }
    catch (error) {
        console.error('Error with seed data:', error);
        process.exit(1);
    }
};
seedDB();
