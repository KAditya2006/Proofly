"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const BRSRCoreConfig_1 = __importDefault(require("../models/BRSRCoreConfig"));
const ESGIndicator_1 = __importDefault(require("../models/ESGIndicator"));
dotenv_1.default.config();
const seedBrsr = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg_dev');
        console.log('MongoDB Connected for BRSR Seeding');
        let indicators = await ESGIndicator_1.default.find().limit(5);
        if (indicators.length === 0) {
            console.log('No indicators found. Creating dummy indicators...');
            await ESGIndicator_1.default.insertMany([
                { name: 'Scope 1 Emissions', code: 'E1', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'tCO2e', status: 'ACTIVE' },
                { name: 'Renewable Energy', code: 'E2', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'MWh', status: 'ACTIVE' },
                { name: 'Total Energy', code: 'E3', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'MWh', status: 'ACTIVE' },
                { name: 'Water Withdrawal', code: 'E4', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'kL', status: 'ACTIVE' }
            ]);
            indicators = await ESGIndicator_1.default.find().limit(5);
        }
        const configs = [
            {
                attributeName: 'GHG Emissions',
                description: 'Scope 1 and Scope 2 emissions tracking',
                indicatorIds: [indicators[0]?._id].filter(Boolean),
                status: 'ACTIVE'
            },
            {
                attributeName: 'Energy Management',
                description: 'Total energy consumed from renewable sources',
                indicatorIds: [indicators[1]?._id, indicators[2]?._id].filter(Boolean),
                status: 'ACTIVE'
            },
            {
                attributeName: 'Water & Effluents',
                description: 'Water withdrawal and discharge metrics',
                indicatorIds: [indicators[3]?._id].filter(Boolean),
                status: 'ACTIVE'
            }
        ];
        await BRSRCoreConfig_1.default.deleteMany({});
        await BRSRCoreConfig_1.default.insertMany(configs);
        console.log('BRSR Core Configs seeded successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error with BRSR seed:', error);
        process.exit(1);
    }
};
seedBrsr();
