"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const migrateEmployeeIds = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const users = await User_1.default.find({ employeeId: { $exists: false } });
        console.log(`Found ${users.length} users to migrate.`);
        let count = 1;
        for (const user of users) {
            // Create a unique employee ID based on their email prefix or a sequence
            const prefix = user.email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
            const employeeId = `EMP-${prefix}-${count.toString().padStart(3, '0')}`;
            await User_1.default.updateOne({ _id: user._id }, { $set: { employeeId, mustChangePassword: false } });
            console.log(`Migrated user ${user.email} -> ${employeeId}`);
            count++;
        }
        // Also update users that might have mustChangePassword unset
        await User_1.default.updateMany({ mustChangePassword: { $exists: false } }, { $set: { mustChangePassword: false } });
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};
migrateEmployeeIds();
