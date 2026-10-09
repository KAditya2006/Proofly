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
    <div className="fixed inset-0 z-50 overflow-hidden bg-brand-navy/60 flex justify-end">
      <div className="w-full max-w-2xl bg-proofly-gradient h-full shadow-2xl flex flex-col animate-slide-in-right relative border-l border-brand-coral/20">
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-brand-coral/10 flex justify-between items-start bg-white/50 backdrop-blur-md relative z-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-brand-navy leading-tight line-clamp-2 pr-4" title={indicatorName}>{indicatorName}</h2>
            <p className="text-xs uppercase tracking-widest text-brand-coral font-bold mt-2 flex items-center gap-2">
              Data Lineage Explorer
            </p>
          </div>
          <button 
            onClick={onClose}
            className="shrink-0 p-2 text-brand-navy hover:text-brand-coral hover:bg-white/50 rounded-full transition-all shadow-sm"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {loading ? (
            <div className="flex justify-center py-20 text-brand-navy font-medium animate-pulse relative z-10">Tracing data lineage...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-brand-navy/60 font-medium relative z-10">No source records found.</div>
          ) : (
            <div className="space-y-8 relative z-10">
              {/* Vertical line connecting nodes */}
              <div className="hidden sm:block absolute left-[1.8rem] top-8 bottom-8 w-[2px] bg-brand-coral/20 z-0"></div>

              {records.map((record) => (
                <div key={record._id} className="relative z-10">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Node Icon */}
                    <div className="shrink-0 mt-2 hidden sm:block relative">
                      <div className="h-[3.8rem] w-[3.8rem] rounded-full bg-white border-4 border-[#fff1f1] flex items-center justify-center shadow-md relative z-10">
                        <FolderKanban className="h-6 w-6 text-brand-coral" />
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 bg-white/60 backdrop-blur-md border border-white shadow-lg rounded-[2rem] p-6 hover:bg-white/80 transition-all hover:shadow-xl group">
                      <div className="flex flex-col xl:flex-row justify-between items-start gap-4 xl:gap-2 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-brand-navy bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-brand-coral/10 flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-brand-coral" />
                              {record.projectId.subsidiaryId?.name || 'Group'} / {record.projectId.businessUnitId?.name || 'BU'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-brand-navy leading-snug">{record.projectId.name}</h3>
                          <p className="text-xs text-brand-charcoal/40 font-mono mt-1 uppercase">{record.projectId.projectCode}</p>
                        </div>
                        <div className="xl:text-right flex flex-col xl:items-end">
                          <div className="text-3xl font-serif font-black text-brand-navy tracking-tight drop-shadow-sm flex items-baseline gap-1.5">
                            {Number(record.value).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                            <span className="text-xs font-bold text-brand-coral/80 uppercase tracking-widest">{record.unit}</span>
                          </div>
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-green-50 text-green-600 mt-2 border border-green-100 shadow-sm">
                            <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={2.5} /> Approved
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl p-4 text-xs text-brand-charcoal/70 border border-gray-100 shadow-inner mb-5">
                        <div className="grid grid-cols-1 gap-y-3">
                          <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Source</span> <span className="font-medium text-brand-navy">{record.source || '-'}</span></div>
                          <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Method</span> <span className="font-medium text-brand-navy">{record.calculationMethod || '-'}</span></div>
                          <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Remarks</span> <span className="font-medium text-brand-navy leading-relaxed">{record.remarks || '-'}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-brand-charcoal/5">
                        <div className="flex items-center gap-2 text-xs text-brand-charcoal/50">
                          {record.evidenceIds && record.evidenceIds.length > 0 ? (
                            <div className="flex items-center text-brand-navy font-bold text-[11px] uppercase tracking-wider">
                              <FileText className="h-4 w-4 mr-1.5 text-brand-coral" /> {record.evidenceIds.length} Evidence Attached
                            </div>
                          ) : (
                            <span className="text-brand-charcoal/30 font-medium text-[11px] uppercase tracking-wider">No evidence</span>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => {
                            onClose();
                            navigate(`/reviews/${record._id}`);
                          }}
                          className="text-brand-navy hover:text-brand-coral text-[11px] font-bold uppercase tracking-widest flex items-center group/btn transition-colors"
                        >
                          View Audit Trail <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
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
