require('dotenv').config();
import mongoose from 'mongoose';
import ESGRecord from './src/models/ESGRecord';
import ReportingPeriod from './src/models/ReportingPeriod';
import User from './src/models/User';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const periods = await ReportingPeriod.find();
  console.log('Periods:', periods.map(p => ({ id: p._id, name: p.name, current: p.isCurrent })));
  
  const sonu = await User.findOne({ name: 'Sonu' });
  console.log('Sonu org:', sonu?.organizationId);
  
  const records = await ESGRecord.find({ status: 'SUBMITTED' });
  console.log('Submitted Records:', records.map(r => ({
    id: r._id,
    period: r.reportingPeriodId,
    org: r.organizationId,
    project: r.projectId
  })));
  
  process.exit();
}
main().catch(console.error);
