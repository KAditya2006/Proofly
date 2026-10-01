const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Org = mongoose.model('Organization', new mongoose.Schema({}, { strict: false }), 'organizations');
  await Org.deleteMany({});
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  await User.deleteMany({ role: { $ne: 'ADMIN' } });
  
  console.log('All organizations and non-admin users deleted.');
  process.exit(0);
});
