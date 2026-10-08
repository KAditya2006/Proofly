"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Adjust path to point to the server root .env
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const User_1 = __importDefault(require("../models/User"));
const deleteNonAdmins = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg_dev';
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB.');
        const result = await User_1.default.deleteMany({ role: { $ne: 'ADMIN' } });
        console.log(`Successfully deleted ${result.deletedCount} non-admin users.`);
        // Optional: Let's also enforce mustChangePassword = true for any remaining admins if they also should be forced, 
        // but the user only asked to delete non-admins.
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};
deleteNonAdmins();
