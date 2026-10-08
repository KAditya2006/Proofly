import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ESGRecord from './src/models/ESGRecord';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  await ESGRecord.updateMany({ status: 'APPROVED' }, { $set: { status: 'SUBMITTED' } });
  console.log('Fixed');
  process.exit(0);
}).catch(console.error);
