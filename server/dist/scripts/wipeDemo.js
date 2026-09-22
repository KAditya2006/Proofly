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
const wipeDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg_dev');
        console.log('MongoDB Connected. Wiping all demo data...');
        // Clear existing data
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
        // Using require for default exports that might not be consistently typed if missing
        try {
            const ImportBatch = require('../models/ImportBatch').default;
            if (ImportBatch)
                await ImportBatch.deleteMany({});
        }
        catch (e) { }
        // We must retain the root Group organization and the Admin user so you can log in.
        const group = await Organization_1.default.create({
            name: 'MEIL Group',
            type: 'GROUP',
            code: 'MEIL-GRP',
            location: 'Hyderabad, India'
        });
        const passwordHash = await bcryptjs_1.default.hash('Demo123!', 10);
        await User_1.default.create([
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
    }
    catch (error) {
        console.error('Error wiping data:', error);
        process.exit(1);
    }
};
wipeDB();
