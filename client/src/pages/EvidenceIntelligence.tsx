import React, { useState, useEffect } from 'react';
import { getCoverage, getGaps } from '../services/evidenceService';
import { FileText, AlertTriangle, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const EvidenceIntelligence: React.FC = () => {
  const [coverage, setCoverage] = useState<{totalRecords: number, recordsWithEvidence: number, coveragePercent: string} | null>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use a hardcoded period for demo purposes
  const periodId = '660000000000000000000000'; // Assume an ID, in reality would use context

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetching without periodId for now if backend allows, or just showing how it integrates
      const cov = await getCoverage(periodId); 
      const gps = await getGaps(periodId);
      setCoverage(cov);
      setGaps(gps);
    } catch (error) {
      console.error('Error fetching evidence intel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Evidence Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor evidence coverage and trace missing documentation across projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700">Evidence Coverage</h3>
            <FileText className="text-brand-coral w-5 h-5" />
          </div>
          <div className="text-4xl font-serif font-bold text-gray-900 mb-2">
            {coverage ? coverage.coveragePercent : '0'}%
          </div>
          <div className="text-sm text-gray-500">
            {coverage?.recordsWithEvidence || 0} of {coverage?.totalRecords || 0} records have attached evidence.
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-navy h-2 rounded-full" 
              style={{ width: `${coverage ? coverage.coveragePercent : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700">Missing Evidence Gaps</h3>
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <div className="text-4xl font-serif font-bold text-red-600 mb-2">
            {gaps.length}
          </div>
          <div className="text-sm text-gray-500">
            Records missing supporting documentation.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">Evidence Gap Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indicator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading gap report...</td>
                </tr>
              ) : gaps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">All submitted records have required evidence.</td>
                </tr>
              ) : (
                gaps.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.projectId?.name}</div>
                          <div className="text-xs text-gray-500">{record.organizationId?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.indicatorId?.name}</div>
                      <div className="text-xs text-gray-500">{record.indicatorId?.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.value} {record.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Missing Evidence
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/reviews/${record._id}`} className="text-brand-navy hover:text-brand-navy flex items-center justify-end">
                        View Record <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvidenceIntelligence;
