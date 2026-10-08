require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User').default;
  const Record = require('./src/models/ESGRecord').default;
  const Project = require('./src/models/Project').default;

  const monika = await User.findOne({ name: 'Monika' });
  if(!monika) {
    console.log('Monika not found');
    return process.exit();
  }
  console.log('Monika ID:', monika._id);

  const projects = await Project.find({ assignedOfficers: { $in: [monika._id, monika._id.toString()] } });
  console.log('Projects assigned to Monika:', projects.map(p => p._id));

  const records = await Record.find({ projectId: { $in: projects.map(p => p._id) } });
  console.log('Records for these projects:', records.length, records.map(r => ({ status: r.status, id: r._id, submittedBy: r.submittedBy })));

  const adminRecords = await Record.find();
  console.log('All records:', adminRecords.length, adminRecords.map(r => ({ status: r.status, id: r._id, submittedBy: r.submittedBy })));

  process.exit();
}).catch(console.error);
