import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSamples, getFindings } from '../services/assuranceService';
import type { AssuranceSample, AssuranceFinding } from '../services/assuranceService';
import { Search, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const AssuranceWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [samples, setSamples] = useState<AssuranceSample[]>([]);
  const [findings, setFindings] = useState<AssuranceFinding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Hardcode active period ID for demo, or fetch from context. Assuming a generic fetch for now
      const fetchedSamples = await getSamples(''); 
      const fetchedFindings = await getFindings('');
      setSamples(fetchedSamples);
      setFindings(fetchedFindings);
    } catch (error) {
      console.error('Error fetching assurance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!['ADMIN', 'AUDITOR', 'GROUP_ESG_TEAM'].includes(user?.role || '')) {
    return (
      <div className="p-8 text-center text-gray-500">
        <ShieldAlert className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to access the Assurance Workspace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Assurance Workspace</h1>
        <p className="text-gray-500 text-sm mt-1">Review sampled ESG records and manage assurance findings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <Search className="w-5 h-5 mr-2" />
            <span className="font-medium">Total Samples</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{samples.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <Clock className="w-5 h-5 mr-2 text-brand-coral" />
            <span className="font-medium">Under Review</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {samples.filter(s => s.status === 'UNDER_REVIEW').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
            <span className="font-medium">Cleared</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {samples.filter(s => s.status === 'CLEARED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-500 mb-2">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            <span className="font-medium">Open Findings</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {findings.filter(f => f.status === 'OPEN').length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Assurance Samples</h3>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading samples...</div>
            ) : samples.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No samples selected for assurance.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {samples.map(sample => (
                  <li key={sample._id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Record ID: {sample.recordId._id || sample.recordId}</p>
                        <p className="text-xs text-gray-500 mt-1">Reason: {sample.reason}</p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-semibold rounded-full 
                        ${sample.status === 'SELECTED' ? 'bg-gray-100 text-gray-800' :
                          sample.status === 'UNDER_REVIEW' ? 'bg-brand-pink text-brand-charcoal' :
                          sample.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}`}>
                        {sample.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Assurance Findings</h3>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading findings...</div>
            ) : findings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No assurance findings reported.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {findings.map(finding => (
                  <li key={finding._id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{finding.findingTitle}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{finding.description}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full 
                          ${finding.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            finding.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            finding.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-brand-pink text-brand-charcoal'}`}>
                          {finding.severity}
                        </span>
                        <span className="text-[10px] text-gray-500">{finding.status}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssuranceWorkspace;
