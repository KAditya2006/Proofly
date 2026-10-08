import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getRecords, type ESGRecord } from '../services/esgRecordService';
import { FileText, ArrowRight, Loader2, Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MyRecords: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const statusParam = searchParams.get('status') || '';
  const periodIdParam = searchParams.get('periodId') || '';
  const missingEvidenceParam = searchParams.get('missingEvidence') === 'true';
  const [records, setRecords] = useState<ESGRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        // Only fetch records for the current user if needed, or just by status
        // getRecords internally calls /esg/records?status=...
        const params: any = { status: statusParam };
        if (periodIdParam) params.reportingPeriodId = periodIdParam;
        if (missingEvidenceParam) params.missingEvidence = 'true';
        
        const data = await getRecords(1, 100, params);
        setRecords(data);
      } catch (error: any) {
        toast.error('Failed to load records');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [statusParam, periodIdParam, missingEvidenceParam]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full"><Clock className="w-3 h-3" /> DRAFT</span>;
      case 'SUBMITTED': 
      case 'UNDER_REVIEW': return <span className="flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-100 px-3 py-1 rounded-full"><Activity className="w-3 h-3" /> UNDER REVIEW</span>;
      case 'CORRECTION_REQUIRED': return <span className="flex items-center gap-1 text-xs font-bold text-brand-coral bg-brand-coral/10 px-3 py-1 rounded-full"><AlertTriangle className="w-3 h-3" /> NEEDS CORRECTION</span>;
      case 'APPROVED': return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> APPROVED</span>;
      default: return <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{status}</span>;
    }
  };

  const getPageTitle = () => {
    if (missingEvidenceParam) return 'Action Required (Missing Evidence)';
    if (statusParam.includes('DRAFT')) return 'Pending Drafts (Incomplete)';
    if (statusParam.includes('CORRECTION_REQUIRED')) return 'Action Required (Corrections)';
    if (statusParam.includes('VALIDATION_FAILED')) return 'Validation Errors';
    if (statusParam.includes('SUBMITTED') || statusParam.includes('UNDER_REVIEW')) return 'Submitted for Review';
    if (statusParam.includes('APPROVED')) return 'Approved Records';
    return 'My ESG Records';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 pt-4">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">{getPageTitle()}</h1>
          <p className="page-subtitle">View and manage your data submissions</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/60 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-brand-coral animate-spin mb-4" />
            <p className="text-brand-charcoal/60 font-medium">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-16 h-16 text-brand-charcoal/20 mb-4" />
            <h3 className="text-xl font-serif font-bold text-brand-navy mb-2">No records found</h3>
            <p className="text-brand-charcoal/60">There are no records matching this status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map(record => {
              const proj = typeof record.projectId === 'object' ? (record.projectId as any).name : 'Unknown Project';
              const indName = typeof record.indicatorId === 'object' ? (record.indicatorId as any).name : 'Unknown Indicator';
              const pId = typeof record.projectId === 'object' ? (record.projectId as any)._id : record.projectId;
              const iId = typeof record.indicatorId === 'object' ? (record.indicatorId as any)._id : record.indicatorId;
              const perId = typeof record.reportingPeriodId === 'object' ? (record.reportingPeriodId as any)._id : record.reportingPeriodId;
              
              return (
                <div key={record._id} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-coral/10 hover:shadow-md hover:border-brand-coral/30 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      {getStatusBadge(record.status)}
                      <span className="text-xs text-gray-400 font-medium">{new Date(record.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-brand-navy text-lg leading-tight mb-2 group-hover:text-brand-coral transition-colors">{indName}</h3>
                    <p className="text-sm font-medium text-brand-charcoal/70 mb-4">{proj}</p>
                    
                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mb-6">
                      <span className="text-xs text-gray-500 font-medium uppercase">Recorded Value</span>
                      <span className="font-bold text-brand-navy">{record.value || record.co2eResult || '---'} <span className="text-xs font-normal">{record.unit}</span></span>
                    </div>
                  </div>
                  
                  <Link 
                    to={user?.role !== 'PROJECT_OFFICER' || ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(record.status) ? `/reviews/${record._id}` : `/esg/collection?projectId=${pId}&periodId=${perId}&indicatorId=${iId}`}
                    className="btn-secondary w-full py-2.5 text-xs flex justify-center items-center gap-2"
                  >
                    {user?.role !== 'PROJECT_OFFICER' || ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(record.status) ? 'View Details' : 'Continue Editing'} 
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRecords;
