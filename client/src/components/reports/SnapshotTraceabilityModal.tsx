import React, { useState, useEffect } from 'react';
import { X, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getReportLineage } from '../../services/reportService';
import { verifyEvidence } from '../../services/evidenceService';

interface SnapshotTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

const SnapshotTraceabilityModal: React.FC<SnapshotTraceabilityModalProps> = ({ isOpen, onClose, report }) => {
  const [lineageData, setLineageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen && report?._id) {
      fetchLineage();
    }
  }, [isOpen, report]);

  const fetchLineage = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getReportLineage(report._id);
      setLineageData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load snapshot lineage');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (evidenceId: string) => {
    try {
      const result = await verifyEvidence(evidenceId);
      setVerificationResults(prev => ({
        ...prev,
        [evidenceId]: result
      }));
    } catch (err: any) {
      setVerificationResults(prev => ({
        ...prev,
        [evidenceId]: { status: 'VERIFICATION FAILED', message: err.response?.data?.message || 'Verification failed' }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-brand-navy" />
                  Immutable Snapshot Traceability
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Point-in-time source lineage for {report?.name} (v{report?.version}.0). Editing live data does not alter this snapshot.
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12 text-gray-500">Loading immutable lineage...</div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
            ) : lineageData ? (
              <div className="space-y-8">
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Snapshot Metadata</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500 block">Snapshot ID</span><span className="font-mono text-xs">{lineageData.snapshotId}</span></div>
                    <div><span className="text-gray-500 block">Captured At</span>{new Date(lineageData.timestamp).toLocaleString()}</div>
                    <div><span className="text-gray-500 block">Aggregated KPIs</span>{lineageData.kpis?.length || 0}</div>
                    <div><span className="text-gray-500 block">Source Records</span>{lineageData.lineage?.length || 0}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4 border-b pb-2">Source Records Trace</h4>
                  {lineageData.lineage && lineageData.lineage.length > 0 ? (
                    <div className="space-y-4">
                      {lineageData.lineage.map((row: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                          <div className="flex justify-between items-start mb-3 border-b pb-3">
                            <div>
                              <div className="font-medium text-brand-navy">
                                {row.indicator ? `${row.indicator.code} - ${row.indicator.name}` : `Indicator ${row.indicatorId}`}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {row.project ? `${row.project.projectCode} • ${row.project.name} (${row.project.businessUnitId?.name || 'Group'})` : `Project ${row.projectId}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-lg">{row.value} {row.indicator?.unit}</div>
                              <div className="text-xs text-gray-400 font-mono mt-1">Record ID: {row.recordId}</div>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <span className="text-sm font-medium text-gray-700">Linked Evidence ({row.evidenceIds.length})</span>
                            {row.evidenceIds.length > 0 ? (
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {row.evidenceIds.map((evId: string) => (
                                  <div key={evId} className="bg-gray-50 rounded border p-3 flex justify-between items-center">
                                    <span className="font-mono text-xs text-gray-600 truncate mr-2">{evId}</span>
                                    {!verificationResults[evId] ? (
                                      <button 
                                        onClick={() => handleVerify(evId)}
                                        className="text-xs text-brand-navy hover:underline border px-2 py-1 rounded bg-white shadow-sm"
                                      >
                                        Verify Hash
                                      </button>
                                    ) : (
                                      verificationResults[evId].status === 'VERIFIED' ? (
                                        <span className="text-xs text-green-600 flex items-center gap-1 font-semibold">
                                          <CheckCircle2 className="w-4 h-4" /> Verified
                                        </span>
                                      ) : (
                                        <span className="text-xs text-red-600 flex items-center gap-1 font-semibold">
                                          <ShieldAlert className="w-4 h-4" /> {verificationResults[evId].status === 'VERIFICATION FAILED' ? 'Missing' : 'Mismatch'}
                                        </span>
                                      )
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 mt-1 italic">No physical evidence files linked at finalization.</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-dashed rounded bg-white">
                      No granular source records found in this snapshot. (Legacy snapshot)
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotTraceabilityModal;
