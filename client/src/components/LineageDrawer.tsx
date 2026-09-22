import React, { useEffect, useState } from 'react';
import { getConsolidationLineage } from '../services/consolidationService';
import { X, FileText, CheckCircle2, ChevronRight, Building2, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LineageDrawerProps {
  indicatorId: string;
  indicatorName: string;
  reportingPeriodId: string;
  scopeLevel: string;
  scopeId: string;
  onClose: () => void;
}

const LineageDrawer: React.FC<LineageDrawerProps> = ({ 
  indicatorId, 
  indicatorName, 
  reportingPeriodId, 
  scopeLevel, 
  scopeId, 
  onClose 
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getConsolidationLineage(indicatorId, reportingPeriodId, scopeLevel, scopeId)
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [indicatorId, reportingPeriodId, scopeLevel, scopeId]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900 bg-opacity-25 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 line-clamp-1" title={indicatorName}>{indicatorName}</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className="font-medium text-gray-700">Data Lineage Explorer</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-500">Tracing data lineage...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No source records found.</div>
          ) : (
            <div className="space-y-8 relative">
              {/* Vertical line connecting nodes - hide on mobile */}
              <div className="hidden sm:block absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 z-0"></div>

              {records.map((record) => (
                <div key={record._id} className="relative z-10">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Node Icon */}
                    <div className="shrink-0 mt-1 hidden sm:block">
                      <div className="h-16 w-16 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center shadow-sm relative z-10">
                        <FolderKanban className="h-7 w-7 text-brand-navy" />
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {record.projectId.subsidiaryId?.name || 'Group'} / {record.projectId.businessUnitId?.name || 'BU'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{record.projectId.name}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{record.projectId.projectCode}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">{record.value} <span className="text-sm font-medium text-gray-500">{record.unit}</span></div>
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100 mb-4">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          <div><span className="text-gray-400">Source:</span> {record.source || '-'}</div>
                          <div><span className="text-gray-400">Method:</span> {record.calculationMethod || '-'}</div>
                          <div className="col-span-2"><span className="text-gray-400">Remarks:</span> {record.remarks || '-'}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {record.evidenceIds && record.evidenceIds.length > 0 ? (
                            <div className="flex items-center text-brand-navy font-medium">
                              <FileText className="h-4 w-4 mr-1" /> {record.evidenceIds.length} Evidence Attached
                            </div>
                          ) : (
                            <span className="text-gray-400">No evidence</span>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => {
                            onClose();
                            navigate(`/reviews/${record._id}`); // Ideally a read-only audit view for general users
                          }}
                          className="text-brand-navy hover:text-brand-charcoal text-sm font-medium flex items-center"
                        >
                          View Audit Trail <ChevronRight className="h-4 w-4 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineageDrawer;
