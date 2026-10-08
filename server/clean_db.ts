import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ESGRecord from './src/models/ESGRecord';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  await ESGRecord.updateMany(
    {}, // all records
    { 
      $set: { status: 'SUBMITTED' },
      $unset: { 
        approvedBy: 1, 
        approvedAt: 1, 
        buApprovedBy: 1, 
        buApprovedAt: 1 
      } 
    }
  );
  console.log('Cleaned up ALL accidental approval traces.');
  process.exit(0);
}).catch(console.error);
