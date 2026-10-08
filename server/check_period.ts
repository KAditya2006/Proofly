require('dotenv').config();
import mongoose from 'mongoose';
import ReportingPeriod from './src/models/ReportingPeriod';
import ESGRecord from './src/models/ESGRecord';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const p1 = await ReportingPeriod.findById('6ac3c7aab986d43a59cc58af');
  const p2 = await ReportingPeriod.findById('6ac73e6cd5dd488031c02894');
  console.log('Current Period (p1):', p1);
  console.log('Record Period (p2):', p2);
  
  // also fix the record to use the current period so it shows up!
  const record = await ESGRecord.findOne({ status: 'SUBMITTED' });
  if (record && p1) {
    record.reportingPeriodId = p1._id as any;
    await record.save();
    console.log('Updated Record to use Current Period!');
  }
  
  process.exit();
}
main().catch(console.error);
