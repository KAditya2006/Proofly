require('dotenv').config();
import mongoose from 'mongoose';
import User from './src/models/User';
import ESGRecord from './src/models/ESGRecord';
import Project from './src/models/Project';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const sonu = await User.findOne({ name: 'Sonu' });
  const monika = await User.findOne({ name: 'Monika' });
  const records = await ESGRecord.find({ status: 'SUBMITTED' });
  
  console.log('Sonu org:', sonu?.organizationId);
  console.log('Monika org:', monika?.organizationId);
  
  for (const r of records) {
    const proj = await Project.findById(r.projectId);
    console.log(`Record ${r._id} org: ${r.organizationId}, Project org: ${proj?.organizationId}`);
  }
  
  process.exit();
}
main().catch(console.error);
