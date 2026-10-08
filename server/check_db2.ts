require('dotenv').config();
import mongoose from 'mongoose';
import ESGRecord from './src/models/ESGRecord';
import Evidence from './src/models/Evidence';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const records = await ESGRecord.find({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } });
  console.log(JSON.stringify(records, null, 2));
  
  const evidences = await Evidence.find({});
  console.log(JSON.stringify(evidences, null, 2));
  process.exit();
}
main().catch(console.error);
