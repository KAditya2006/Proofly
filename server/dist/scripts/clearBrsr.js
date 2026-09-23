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
const clearBrsr = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg360');
        console.log('MongoDB Connected. Removing dummy BRSR data...');
        await BRSRCoreConfig_1.default.deleteMany({});
        // We only added these 4 dummy indicators
        await ESGIndicator_1.default.deleteMany({
            code: { $in: ['E1', 'E2', 'E3', 'E4'] }
        });
        console.log('Dummy BRSR Core Configs and Indicators removed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error removing dummy BRSR data:', error);
        process.exit(1);
    }
};
clearBrsr();
