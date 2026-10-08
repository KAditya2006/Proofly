require('dotenv').config();
import mongoose from 'mongoose';
import Project from './src/models/Project';
import { getAuthorizedProjectIds } from './src/utils/hierarchy';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const p = await Project.findById('6ac69332dbd829bd35144b5c');
  console.log('Project Details:', p);
  
  const authorizedIds = await getAuthorizedProjectIds(new mongoose.Types.ObjectId('6ac68104f8a5b6d3fdf34b46'));
  console.log('Sonu Authorized Project IDs:', authorizedIds.map(i => i.toString()));
  
  process.exit();
}
main().catch(console.error);
