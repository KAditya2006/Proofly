require('dotenv').config();
import mongoose from 'mongoose';
import ESGRecord from './src/models/ESGRecord';
import User from './src/models/User';
import { getAuthorizedProjectIds } from './src/utils/hierarchy';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const sonu = await User.findOne({ name: 'Sonu' });
  const reportingPeriodId = '6ac73e6cd5dd488031c02894';
  
  const authorizedProjectIds = await getAuthorizedProjectIds(sonu?.organizationId as any);
  console.log('Auth Projects:', authorizedProjectIds.map(id => id.toString()));
  
  const baseMatch = { 
    reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId), 
    projectId: { $in: authorizedProjectIds } 
  };
  
  console.log('Base Match:', JSON.stringify(baseMatch, null, 2));
  
  const pendingApprovals = await ESGRecord.countDocuments({ ...baseMatch, status: 'SUBMITTED' });
  console.log('Pending Approvals Count:', pendingApprovals);
  
  // Try querying without projectId filter
  const pendingApprovalsNoAuth = await ESGRecord.countDocuments({ 
    reportingPeriodId: new mongoose.Types.ObjectId(reportingPeriodId), 
    status: 'SUBMITTED' 
  });
  console.log('Pending Approvals Count (no auth filter):', pendingApprovalsNoAuth);
  
  const record = await ESGRecord.findOne({ status: 'SUBMITTED' });
  console.log('Record ID:', record?._id?.toString());
  // @ts-ignore
  console.log('Record ProjectId:', record?.projectId?.toString());
  // @ts-ignore
  console.log('Is ProjectId in AuthProjects?', authorizedProjectIds.map(id => id.toString()).includes(record?.projectId?.toString() as string));

  process.exit();
}
main().catch(console.error);
