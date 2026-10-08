require('dotenv').config();
import mongoose from 'mongoose';
import ReportingPeriod from './src/models/ReportingPeriod';
import ESGRecord from './src/models/ESGRecord';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  // Set all periods to isCurrent: false
  await ReportingPeriod.updateMany({}, { $set: { isCurrent: false } });
  
  // Set FY 2024-25 to isCurrent: true
  const p24_25 = await ReportingPeriod.findOne({ name: 'FY 2024-25' });
  if (p24_25) {
    p24_25.isCurrent = true;
    await p24_25.save();
    console.log('Set FY 2024-25 as Current Period');
    
    // Move any SUBMITTED records to this current period to ensure they show up on the dashboard
    const result = await ESGRecord.updateMany(
      { status: 'SUBMITTED' },
      { $set: { reportingPeriodId: p24_25._id } }
    );
    console.log(`Moved ${result.modifiedCount} records to the current period`);
  }
  
  process.exit();
}
main().catch(console.error);
