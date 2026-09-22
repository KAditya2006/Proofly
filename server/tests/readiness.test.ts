import { calculateReadiness } from '../src/services/readinessService';
import ESGIndicator from '../src/models/ESGIndicator';
import Project from '../src/models/Project';
import ESGRecord from '../src/models/ESGRecord';
import mongoose from 'mongoose';

jest.mock('../src/models/ESGIndicator');
jest.mock('../src/models/Project');
jest.mock('../src/models/ESGRecord');

describe('BRSR Readiness Scoring Accuracy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock mongoose models that are dynamically called
    mongoose.model = jest.fn().mockImplementation((modelName) => {
      if (modelName === 'BRSRCoreConfig') {
        return { find: jest.fn().mockResolvedValue([{ status: 'ACTIVE' }]) };
      }
      if (modelName === 'ValueChainPartner') {
        return { find: jest.fn().mockResolvedValue([{ status: 'APPROVED' }, { status: 'PENDING' }]) };
      }
      return { find: jest.fn().mockResolvedValue([]) };
    }) as any;
  });

  it('should calculate readiness scores accurately', async () => {
    (ESGIndicator.find as jest.Mock).mockResolvedValue([
      { _id: 'ind1', status: 'ACTIVE', mandatory: true, brsrMappings: ['NGRBC-1'] },
      { _id: 'ind2', status: 'ACTIVE', mandatory: true, brsrMappings: [] }
    ]);

    (Project.find as jest.Mock).mockResolvedValue([
      { _id: 'p1', status: 'ACTIVE' },
      { _id: 'p2', status: 'ACTIVE' }
    ]);
    
    // Total expected = 2 indicators * 2 projects = 4 records

    (ESGRecord.find as jest.Mock).mockResolvedValue([
      { _id: 'rec1', value: 100, evidenceIds: ['ev1'], status: 'APPROVED' }, // Perfect
      { _id: 'rec2', value: 200, evidenceIds: [], status: 'SUBMITTED' }, // Has data, no evidence, not approved
      { _id: 'rec3', value: null, evidenceIds: [], status: 'DRAFT' } // No data
      // rec4 is entirely missing
    ]);

    const result = await calculateReadiness('60c72b2f9b1d8b3a4c8e4d1a');

    expect(result.breakdown.missingData).toBe(3); // 4 expected - 1 approved with data
    expect(result.breakdown.missingEvidence).toBe(3); // 4 expected - 1 with evidence
    expect(result.breakdown.pendingApproval).toBe(3); // 4 expected - 1 approved
    expect(result.breakdown.missingMapping).toBe(1); // 2 mandatory - 1 mapped
    expect(result.breakdown.pendingPartners).toBe(1); // 2 partners - 1 approved

    expect(result.dataCompleteness).toBe(25); // 1/4 = 25% (strict mode only counts APPROVED)
    expect(result.evidenceCoverage).toBe(25); // 1/4 = 25%
    expect(result.approval).toBe(25); // 1/4 = 25%
    expect(result.mapping).toBe(50); // 1/2 = 50%
    expect(result.valueChain).toBe(50); // 1/2 = 50%
    expect(result.brsrCore).toBe(90);

    const expectedOverall = Math.round((25 + 25 + 25 + 50 + 90 + 50) / 6);
    expect(result.overall).toBe(expectedOverall);
  });
});
