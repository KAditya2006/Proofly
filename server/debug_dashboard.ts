require('dotenv').config();
import mongoose from 'mongoose';
import User from './src/models/User';
import Project from './src/models/Project';
import ESGRecord from './src/models/ESGRecord';
import { getAuthorizedProjectIds } from './src/utils/hierarchy';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const sonu = await User.findOne({ name: 'Sonu' });
  if (!sonu) { console.log('Sonu not found'); process.exit(); }
  
  const authorizedProjectIds = await getAuthorizedProjectIds(sonu.organizationId);
  console.log('Authorized Project IDs:', authorizedProjectIds);
  
  const pendingApprovals = await ESGRecord.countDocuments({
    projectId: { $in: authorizedProjectIds },
    status: 'SUBMITTED'
  });
  
  console.log('Pending Approvals Count:', pendingApprovals);
  
  // also get all submitted records for these projects to debug
  const records = await ESGRecord.find({
    projectId: { $in: authorizedProjectIds },
    status: 'SUBMITTED'
  });
  console.log('Records:', records.map(r => ({ _id: r._id, pId: r.projectId })));
  
  process.exit();
}
main().catch(console.error);
