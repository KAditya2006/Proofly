import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const migrateEmployeeIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const users = await User.find({ employeeId: { $exists: false } });
    console.log(`Found ${users.length} users to migrate.`);

    let count = 1;
    for (const user of users) {
      // Create a unique employee ID based on their email prefix or a sequence
      const prefix = user.email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
      const employeeId = `EMP-${prefix}-${count.toString().padStart(3, '0')}`;
      
      await User.updateOne({ _id: user._id }, { $set: { employeeId, mustChangePassword: false } });
      
      console.log(`Migrated user ${user.email} -> ${employeeId}`);
      count++;
    }

    // Also update users that might have mustChangePassword unset
    await User.updateMany(
      { mustChangePassword: { $exists: false } },
      { $set: { mustChangePassword: false } }
    );

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateEmployeeIds();
