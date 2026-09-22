const mongoose = require('mongoose');

async function runTestMatrix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/meil_esg360');
  const db = mongoose.connection.useDb('meil_esg360');
  
  const hacker = await db.collection('users').findOne({ email: 'hacker@test.com' });
  const otherUser = await db.collection('users').findOne({ email: 'po1@meil-demo.com' });

  // Get active period
  const period = await db.collection('reportingperiods').findOne({ status: 'DATA_COLLECTION' });
  const closedPeriod = await db.collection('reportingperiods').findOne({ status: 'CLOSED' });
  
  // Get an indicator
  const indicator = await db.collection('esgindicators').findOne({ name: 'Total Electricity Consumption' });
  const renewableIndicator = await db.collection('esgindicators').findOne({ name: 'Lost Time Injury Frequency Rate (LTIFR)' });
  
  // Assign hacker to a single project
  const project1 = await db.collection('projects').findOne({ projectCode: 'P-001' });
  await db.collection('projects').updateOne({ _id: project1._id }, { $addToSet: { assignedOfficers: hacker._id } });

  const project2 = await db.collection('projects').findOne({ projectCode: 'P-002' });
  // Make sure hacker is not in project2
  await db.collection('projects').updateOne({ _id: project2._id }, { $pull: { assignedOfficers: hacker._id } });

  const token = require('fs').readFileSync('../hacker_token.txt', 'utf-8');

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

  console.log("=== 1. Project Officer Access ===");
  const authRes1 = await api('/esg/records', 'GET');
  console.log(`Access records: ${authRes1.status} (Should be 200) - Error: ${JSON.stringify(authRes1.data)}`);

  console.log("\n=== 2. Project Selection / 12. RBAC ===");
  const createUnauth = await api('/esg/records', 'POST', {
    projectId: project2._id,
    indicatorId: indicator._id,
    reportingPeriodId: period._id,
    value: 100,
    unit: 'kWh'
  });
  console.log(`Create on unauthorized project: ${createUnauth.status} - Data: ${JSON.stringify(createUnauth.data)} (Should be 403)`);

  const createMalformed = await api('/esg/records', 'POST', {
    projectId: 'invalid_id',
    indicatorId: indicator._id,
    reportingPeriodId: period._id,
    value: 100,
    unit: 'kWh'
  });
  console.log(`Create with malformed project ID: ${createMalformed.status} - Data: ${JSON.stringify(createMalformed.data)} (Should be 400 or 500)`);

  console.log("\n=== 3. Reporting Period ===");
  if (closedPeriod) {
    const createClosed = await api('/esg/records', 'POST', {
      projectId: project1._id,
      indicatorId: indicator._id,
      reportingPeriodId: closedPeriod._id,
      value: 100,
      unit: 'kWh'
    });
    console.log(`Create on closed period: ${createClosed.status} - Data: ${JSON.stringify(createClosed.data)} (Should be 400)`);
  }

  console.log("\n=== 4/5. Valid ESG Data Entry ===");
  // Clean up if it exists
  await db.collection('esgrecords').deleteOne({ projectId: project1._id, indicatorId: indicator._id, reportingPeriodId: period._id });

  const createValid = await api('/esg/records', 'POST', {
    projectId: project1._id,
    indicatorId: indicator._id,
    reportingPeriodId: period._id,
    value: 5000,
    unit: 'kWh',
    source: 'Electric Bill'
  });
  console.log(`Create valid record: ${createValid.status} - Data: ${JSON.stringify(createValid.data)} (Should be 201)`);
  const recordId = createValid.data._id;

  console.log("\n=== 7. Update & IDOR ===");
  const updateValid = await api(`/esg/records/${recordId}`, 'PUT', {
    value: 6000
  });
  console.log(`Update valid record: ${updateValid.status} (Should be 200) - value is now ${updateValid.data?.value}`);
  
  const updateStatusBypass = await api(`/esg/records/${recordId}`, 'PUT', {
    status: 'APPROVED'
  });
  console.log(`Try to bypass status via PUT: ${updateStatusBypass.status} - resulting status: ${updateStatusBypass.data?.status} (Should be DRAFT)`);

  console.log("\n=== 6. Validation Engine ===");
  // Clean up renewable record
  await db.collection('esgrecords').deleteOne({ projectId: project1._id, indicatorId: renewableIndicator._id, reportingPeriodId: period._id });
  const createRenewable = await api('/esg/records', 'POST', {
    projectId: project1._id,
    indicatorId: renewableIndicator._id,
    reportingPeriodId: period._id,
    value: 8000, // Invalid: Renewable (8000) > Total (6000)
    unit: 'kWh',
    source: 'Solar Log'
  });
  const renRecordId = createRenewable.data._id;
  const submitInvalid = await api(`/esg/records/${renRecordId}/submit`, 'POST');
  console.log(`Submit invalid record (Renewable > Total): ${submitInvalid.status} (Should be 400)`);
  console.log(`Error: ${JSON.stringify(submitInvalid.data?.errors || submitInvalid.data?.message)}`);

  console.log("\n=== 10/11. State Machine & Submission ===");
  const submitValid = await api(`/esg/records/${recordId}/submit`, 'POST');
  console.log(`Submit valid record: ${submitValid.status} - Data: ${JSON.stringify(submitValid.data)} (Should be 200) - resulting status: ${submitValid.data?.status}`);
  
  const submitAgain = await api(`/esg/records/${recordId}/submit`, 'POST');
  console.log(`Submit already submitted record: ${submitAgain.status} - Data: ${JSON.stringify(submitAgain.data)} (Should be 400)`);

  process.exit(0);
}

runTestMatrix();
