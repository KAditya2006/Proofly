require('dotenv').config();
import mongoose from 'mongoose';
import Evidence from './src/models/Evidence';
import ESGRecord from './src/models/ESGRecord';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const mockId = new mongoose.Types.ObjectId('a45811b7d41d24d5b84cf631');
  const record = await ESGRecord.findOne({ evidenceIds: mockId });
  
  if (record) {
    const existing = await Evidence.findById(mockId);
    if (!existing) {
      await Evidence.create({
        _id: mockId,
        name: 'Zojila_Tunnel_Construction_Project_Total_Electricity_Consumption_(Grid)_-_Scope_2.pdf',
        fileUrl: '/uploads/mock.pdf',
        fileType: 'application/pdf',
        fileSize: 102450,
        verificationStatus: 'VERIFIED',
        projectId: record.projectId,
        reportingPeriodId: record.reportingPeriodId,
        uploadedBy: record.createdBy
      });
      console.log('Created mock evidence in DB');
    } else {
      console.log('Already exists');
    }
  } else {
    console.log('Record not found');
  }
  
  process.exit();
}
main().catch(console.error);
