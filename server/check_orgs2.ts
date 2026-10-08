require('dotenv').config();
import mongoose from 'mongoose';
import Organization from './src/models/Organization';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const org1 = await Organization.findById('6ac68104f8a5b6d3fdf34b46');
  const org2 = await Organization.findById('6ac6753624c126f910c01cda');
  console.log('Sonu org:', org1);
  console.log('Project org:', org2);
  process.exit();
}
main().catch(console.error);
