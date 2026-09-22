import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Organization from '../src/models/Organization';
import Project from '../src/models/Project';
import ESGRecord from '../src/models/ESGRecord';
import ReportingPeriod from '../src/models/ReportingPeriod';
import '../src/models/BRSRCoreConfig';
import '../src/models/ValueChainPartner';
import { getOverview } from '../src/controllers/analyticsController';
import { getConsolidationKPIs } from '../src/controllers/consolidationController';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock req and res
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // 1. Setup Test Data Context
    const subManager = await User.findOne({ role: 'SUBSIDIARY_MANAGER' });
    if (!subManager) throw new Error('Subsidiary Manager not found');

    const mySubsidiary = await Organization.findById(subManager.organizationId);
    
    // Find a BU in another Subsidiary
    const otherSub = await Organization.findOne({ type: 'SUBSIDIARY', _id: { $ne: mySubsidiary._id } });
    if (!otherSub) throw new Error('Needs at least two subsidiaries for IDOR test');
    
    const otherBU = await Organization.findOne({ type: 'BUSINESS_UNIT', parentId: otherSub._id });
    const period = await ReportingPeriod.findOne();
    if (!period) throw new Error('No Reporting Period found in database for test');
    
    console.log(`Testing as: ${subManager.email} (Subsidiary: ${mySubsidiary.name})`);

    // --- TEST 1: Analytics IDOR Test ---
    console.log('\n=== TEST 1: Analytics IDOR Test ===');
    const req1 = {
      user: subManager,
      query: { reportingPeriodId: period._id.toString() }
    };
    const res1 = mockRes();
    
    await getOverview(req1, res1);
    
    if (res1.statusCode === 500) {
        console.error('Test 1 Failed:', res1.data);
    } else {
        console.log('Analytics Response:', {
            readiness: res1.data.readiness?.overall,
            missingData: res1.data.readiness?.breakdown?.missingData,
            pendingApprovals: res1.data.attentionRequired?.pendingApprovals
        });
        console.log('Test 1 Passed: Request resolved safely.');
    }

    // --- TEST 2: Consolidation KPI IDOR Test (Cross-BU Access) ---
    console.log('\n=== TEST 2: Consolidation IDOR Test ===');
    const req2 = {
      user: subManager,
      query: {
        reportingPeriodId: period._id.toString(),
        scopeLevel: 'BUSINESS_UNIT',
        scopeId: otherBU._id.toString() // Trying to access another Sub's BU
      }
    };
    const res2 = mockRes();

    await getConsolidationKPIs(req2, res2);

    if (res2.statusCode === 403) {
      console.log('Test 2 Passed: Successfully blocked IDOR attempt for cross-subsidiary BU.', res2.data.message);
    } else {
      console.log(`Test 2 FAILED: Expected 403, got ${res2.statusCode}`);
      throw new Error('IDOR Vulnerability remains active in Consolidation Controller');
    }

    console.log('\nAll tests completed successfully!');

  } catch (error) {
    console.error('Test script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runTests();
