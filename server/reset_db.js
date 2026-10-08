require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Record = require('./src/models/ESGRecord').default;
  await Record.updateMany({ status: 'APPROVED' }, { $set: { status: 'SUBMITTED' } });
  console.log('Fixed');
  process.exit();
}).catch(console.error);
