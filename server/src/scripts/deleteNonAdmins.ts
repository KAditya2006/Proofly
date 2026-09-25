import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Adjust path to point to the server root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';

const deleteNonAdmins = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meil_esg_dev';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const result = await User.deleteMany({ role: { $ne: 'ADMIN' } });
    console.log(`Successfully deleted ${result.deletedCount} non-admin users.`);

    // Optional: Let's also enforce mustChangePassword = true for any remaining admins if they also should be forced, 
    // but the user only asked to delete non-admins.
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteNonAdmins();
