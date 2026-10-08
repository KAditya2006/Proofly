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
const cleanDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg_dev');
        console.log('MongoDB Connected. Cleaning up dummy data...');
        // Clear everything
        await Organization_1.default.deleteMany({});
        await User_1.default.deleteMany({});
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
        // Check for ImportBatch without failing if it doesn't exist
        try {
            const ImportBatch = require('../models/ImportBatch').default;
            await ImportBatch.deleteMany({});
        }
        catch (e) { }
        // We MUST keep at least one Admin user and Group organization so you can login.
        const group = await Organization_1.default.create({ name: 'MEIL Group (Real)', type: 'GROUP', code: 'MEIL-GRP', location: 'Hyderabad, India' });
        const passwordHash = await bcryptjs_1.default.hash('Demo123!', 10);
        await User_1.default.create({
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
    }
    catch (error) {
        console.error('Error cleaning data:', error);
        process.exit(1);
    }
};
cleanDB();
