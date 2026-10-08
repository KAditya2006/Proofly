require('dotenv').config();
import mongoose from 'mongoose';
import Project from './src/models/Project';
import ESGRecord from './src/models/ESGRecord';
import User from './src/models/User';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const sonu = await User.findOne({ name: 'Sonu' });
  const monika = await User.findOne({ name: 'Monika' });
  
  const project = await Project.findOne({ name: /Zojila/i });
  if (project && sonu) {
    console.log(`Original Project Org: ${project.organizationId}`);
    // Update project to belong to Sonu's BU
    project.organizationId = sonu.organizationId;
    await project.save();
    console.log(`Updated Project Org to Sonu's BU: ${sonu.organizationId}`);
    
    // Also update any records for this project
    const result = await ESGRecord.updateMany(
      { projectId: project._id },
      { $set: { organizationId: sonu.organizationId } }
    );
    console.log(`Updated ${result.modifiedCount} records to Sonu's BU`);
  }
  
  process.exit();
}
main().catch(console.error);
