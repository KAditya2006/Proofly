const mongoose = require('mongoose');

async function runTestMatrix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/meil_esg360');
  const db = mongoose.connection.useDb('meil_esg360');
  
  const hacker = await db.collection('users').findOne({ email: 'hacker@test.com' });
  
  // Find a Business Unit Reviewer
  const buReviewer = await db.collection('users').findOne({ role: 'BUSINESS_UNIT_REVIEWER' });
  const otherBuReviewer = await db.collection('users').findOne({ email: 'bur2@meil-demo.com' }); // We'll just try to use a different organization
  
  // Get active period
  const period = await db.collection('reportingperiods').findOne({ status: 'DATA_COLLECTION' });
  const closedPeriod = await db.collection('reportingperiods').findOne({ status: 'CLOSED' });
  
  const indicator = await db.collection('esgindicators').findOne({ name: 'Total Electricity Consumption' });
  
  // Assign reviewer's BU
  const myBuId = buReviewer.organizationId;
  const project1 = await db.collection('projects').findOne();
  await db.collection('projects').updateOne({ _id: project1._id }, { $set: { businessUnitId: myBuId } });
  
  // Find a project outside their BU (create a dummy BU id)
  const project2 = await db.collection('projects').findOne({ _id: { $ne: project1._id } });
  const otherBuId = new mongoose.Types.ObjectId();
  await db.collection('projects').updateOne({ _id: project2._id }, { $set: { businessUnitId: otherBuId } });

  // Let's manually generate a valid JWT for the buReviewer
  require('dotenv').config();
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: buReviewer._id, role: buReviewer.role, organizationId: buReviewer.organizationId },
    process.env.JWT_SECRET || 'meil-esg360-super-secret-key-2026',
    { expiresIn: '1d' }
  );

  async function api(path, method, body) {
    const res = await fetch(`http://localhost:5000/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    try { return { status: res.status, data: JSON.parse(text) }; } 
    catch { return { status: res.status, data: text }; }
  }

  console.log("=== 1. Reviewer Dashboard Access ===");
  const authRes1 = await api('/reviews', 'GET');
  console.log(`Access pending reviews: ${authRes1.status} (Should be 200)`);

  console.log("\n=== 2. Create Dummy Records ===");
  // Create a SUBMITTED record in our project
  const r1 = await db.collection('esgrecords').insertOne({
    projectId: project1._id,
    indicatorId: indicator._id,
    reportingPeriodId: period._id,
    organizationId: myBuId,
    createdBy: hacker._id,
    value: 100,
    unit: 'kWh',
    status: 'SUBMITTED',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const validRecordId = r1.insertedId;
  
  // Create a DRAFT record in our project
  const r2 = await db.collection('esgrecords').insertOne({
    projectId: project1._id,
    indicatorId: indicator._id,
    reportingPeriodId: period._id,
    organizationId: myBuId,
    createdBy: hacker._id,
    value: 100,
    unit: 'kWh',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const draftRecordId = r2.insertedId;

  // Create a SUBMITTED record in another BU's project
  const r3 = await db.collection('esgrecords').insertOne({
    projectId: project2._id,
    indicatorId: indicator._id,
    reportingPeriodId: period._id,
    organizationId: otherBuId,
    createdBy: hacker._id,
    value: 100,
    unit: 'kWh',
    status: 'SUBMITTED',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const otherBuRecordId = r3.insertedId;
  
  // Create a SUBMITTED record in a CLOSED period (if available)
  let closedPeriodRecordId;
  if (closedPeriod) {
    const r4 = await db.collection('esgrecords').insertOne({
      projectId: project1._id,
      indicatorId: indicator._id,
      reportingPeriodId: closedPeriod._id,
      organizationId: myBuId,
      createdBy: hacker._id,
      value: 100,
      unit: 'kWh',
      status: 'SUBMITTED',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    closedPeriodRecordId = r4.insertedId;
  }

  console.log("\n=== 3. IDOR / Object-Level Auth ===");
  const approveOtherBu = await api(`/reviews/${otherBuRecordId}/approve`, 'POST');
  console.log(`Approve other BU's record: ${approveOtherBu.status} (Should be 403)`);

  console.log("\n=== 4. State Machine Bypass ===");
  const approveDraft = await api(`/reviews/${draftRecordId}/approve`, 'POST');
  console.log(`Approve DRAFT record: ${approveDraft.status} (Should be 400)`);

  console.log("\n=== 5. Closed Period Enforcement ===");
  if (closedPeriodRecordId) {
    const approveClosed = await api(`/reviews/${closedPeriodRecordId}/approve`, 'POST');
    console.log(`Approve record in CLOSED period: ${approveClosed.status} (Should be 400)`);
  }

  console.log("\n=== 6. Valid Approval ===");
  const approveValid = await api(`/reviews/${validRecordId}/approve`, 'POST');
  console.log(`Approve valid record: ${approveValid.status} (Should be 200) - Error:`, approveValid.data);
  
  console.log("\n=== 7. Double Approval (Concurrency/State) ===");
  const doubleApprove = await api(`/reviews/${validRecordId}/approve`, 'POST');
  console.log(`Approve already APPROVED record: ${doubleApprove.status} (Should be 400) - Error:`, doubleApprove.data);

  console.log("\n=== 8. Validation Rejection Tests ===");
  const rejectWithoutReason = await api(`/reviews/${validRecordId}/reject`, 'POST');
  console.log(`Reject with no reason: ${rejectWithoutReason.status} (Should be 400)`);

  console.log("\n=== Cleaning Up Test Data ===");
  await db.collection('esgrecords').deleteMany({ _id: { $in: [validRecordId, draftRecordId, otherBuRecordId, closedPeriodRecordId].filter(Boolean) } });

  process.exit(0);
}

runTestMatrix();
