import React, { useState, useEffect } from 'react';
import { getCoverage, getGaps, getEvidence } from '../services/evidenceService';
import { getReportingPeriods } from '../services/reportingService';
import { FileText, AlertTriangle, Building2, ExternalLink, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const EvidenceIntelligence: React.FC = () => {
  const [coverage, setCoverage] = useState<{totalRecords: number, recordsWithEvidence: number, coveragePercent: string} | null>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [allEvidence, setAllEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active reporting period
      const periods = await getReportingPeriods();
      const activePeriod = periods.find(p => p.isCurrent) || periods[0];
      
      if (!activePeriod) {
        setLoading(false);
        return;
      }
      
      const periodId = activePeriod._id;
      const cov = await getCoverage(periodId); 
      const gps = await getGaps(periodId);
      const evidenceList = await getEvidence(undefined, periodId);
      
      setCoverage(cov);
      setGaps(gps);
      setAllEvidence(evidenceList || []);
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-medium text-gray-900">Evidence Repository</h3>
          <span className="text-xs text-gray-500">{allEvidence.length} files attached</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading evidence...</td>
                </tr>
              ) : allEvidence.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No evidence files found in the current reporting period.</td>
                </tr>
              ) : (
                allEvidence.map((file) => (
                  <tr key={file._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-brand-navy">{file.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.fileType}</div>
                      <div className="text-xs text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        file.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                        file.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {file.verificationStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.uploadedAt || file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={import.meta.env.PROD ? file.fileUrl : `http://localhost:5000${file.fileUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-brand-navy hover:text-brand-coral flex items-center justify-end"
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </a>
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
