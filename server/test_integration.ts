import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Integration from './src/models/Integration';
import { ImportService } from './src/services/importService';

dotenv.config();

const runTest = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string || 'mongodb://localhost:27017/meil_esg_dev');
  console.log('Connected to DB');
  
  const integration = await Integration.findOne({ type: 'ERP' });
  if (!integration) {
    console.log('No integration found');
    process.exit(1);
  }
  
  console.log('Testing integration sync for:', integration.name);
  
  // Fake user ID for createdBy
  const fakeUserId = new mongoose.Types.ObjectId();
  
  const batch = await ImportService.runSync(integration._id as string, fakeUserId.toString());
  console.log('Sync Batch Result:', batch);
  
  process.exit(0);
};

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
