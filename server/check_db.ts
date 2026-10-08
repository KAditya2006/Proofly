import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './src/models/User';
import ESGRecord from './src/models/ESGRecord';
import Project from './src/models/Project';

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const monika = await User.findOne({ name: 'Monika' });
  if(!monika) {
    console.log('Monika not found');
    return process.exit();
  }
  console.log('Monika ID:', monika._id);

  const projects = await Project.find({ assignedOfficers: { $in: [monika._id, monika._id.toString()] } });
  console.log('Projects assigned to Monika:', projects.map(p => p._id));

  const records = await ESGRecord.find({ projectId: { $in: projects.map(p => p._id) } });
  console.log('Records for these projects:', records.length, records.map(r => ({ status: r.status, id: r._id, submittedBy: r.submittedBy })));

  const adminRecords = await ESGRecord.find();
  console.log('All records:', adminRecords.length, adminRecords.map(r => ({ status: r.status, id: r._id, submittedBy: r.submittedBy })));

  process.exit();
}).catch(console.error);
