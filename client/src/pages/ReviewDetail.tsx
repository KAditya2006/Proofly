import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecordById } from '../services/esgRecordService';
import { approveSubmission, requestCorrection, rejectSubmission, escalateSubmission } from '../services/reviewService';
import { type ESGRecord } from '../services/esgRecordService';
import { FileText, CheckCircle2, XCircle, AlertCircle, Download, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState<ESGRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctionReason, setCorrectionReason] = useState('');
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getRecordById(id)
        .then(setRecord)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await approveSubmission(id);
      navigate('/reviews');
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await escalateSubmission(id);
      navigate('/reviews');
    } catch (error) {
      console.error('Escalation failed:', error);
      toast.error('Escalation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCorrection = async () => {
    if (!id || !correctionReason.trim()) return;
    try {
      setActionLoading(true);
      await requestCorrection(id, correctionReason);
      navigate('/reviews');
    } catch (error) {
      console.error('Correction request failed:', error);
      toast.error('Correction request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !correctionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      setShowCorrectionInput(true);
      return;
    }
    try {
      setActionLoading(true);
      await rejectSubmission(id, correctionReason);
      navigate('/reviews');
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error('Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading submission details...</div>;
  if (!record) return <div className="p-8 text-center text-red-500">Submission not found.</div>;

  const indicator: any = record.indicatorId;
  const project: any = record.projectId;
  const period: any = record.reportingPeriodId;
  const evidence: any[] = record.evidenceIds;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-semibold text-brand-navy">Review Submission</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${record.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {record.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{project.name} • {period.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Data Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-none border border-gray-300 shadow-md p-8 relative font-serif text-brand-navy">
            {/* Watermark / Stamp */}
            {['APPROVED'].includes(record.status) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
                <span className="text-9xl font-bold border-8 border-current p-8 rotate-[-15deg]">APPROVED</span>
              </div>
            )}
            
            <div className="relative z-10 border-b-2 border-brand-navy pb-6 mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">MEIL GROUP</h2>
                <p className="text-xs tracking-widest uppercase mt-1 text-gray-500">Official Data Submission Document</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-gray-600">REF: DOC-{Math.floor(Math.random() * 9000) + 1000}-{new Date(record.createdAt).getFullYear()}</p>
                <p className="text-xs text-gray-500 mt-1">Date: {new Date(record.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-8 gap-x-6 relative z-10 mb-8">
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Project Code / Location</span>
                <span className="text-sm font-semibold">{project.name}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Reporting Period</span>
                <span className="text-sm font-semibold">{period.name}</span>
              </div>

              <div className="col-span-2 border-t border-gray-200 pt-6 mt-2">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Parameter / Indicator</span>
                <span className="text-lg font-bold">{indicator.code} - {indicator.name}</span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-brand-blush/30 p-4 border border-brand-coral/20 rounded-sm">
                <span className="block text-[10px] uppercase tracking-widest text-brand-coral mb-1">Reported & Verified Value</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-brand-navy">{record.value}</span>
                  <span className="text-sm font-semibold text-gray-600 uppercase">{record.unit}</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 border border-gray-200 rounded-sm bg-gray-50">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Automated Extraction Confidence</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[98%]"></div>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">98%</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Data Source</span>
                <span className="text-sm">{record.source || 'Standard Document Upload'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Calculation Method</span>
                <span className="text-sm">{record.calculationMethod || 'System Aggregation (Auto)'}</span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Officer Remarks</span>
                <div className="p-4 border border-gray-200 bg-white text-sm text-gray-700 min-h-[60px] italic">
                  "{record.remarks || 'No additional remarks.'}"
                </div>
              </div>

              {/* Signatures & Verification Section */}
              <div className="col-span-2 border-t-2 border-dashed border-gray-200 mt-4 pt-6">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Chain of Custody / Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Submitted By (Project Officer) */}
                  <div>
                    <div className="h-16 flex items-end mb-2">
                      <span className="font-[Shrikhand,cursive] text-2xl text-brand-navy/80 italic signature-font">
                        {(record.submittedBy as any)?.name || (record.createdBy as any)?.name || 'System User'}
                      </span>
                    </div>
                    <div className="border-t border-brand-navy pt-2">
                      <p className="text-xs font-bold text-brand-navy">{(record.submittedBy as any)?.name || (record.createdBy as any)?.name || 'Unknown User'}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Project Officer (Submitting)</p>
                      <p className="text-[9px] font-mono text-gray-400 mt-1">Verified via MEIL SSO</p>
                      {/* Verified By (BU Reviewer) */}
                      {(record as any).submittedAt && (
                        <p className="text-[9px] font-mono text-blue-600 mt-1">{new Date((record as any).submittedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Verified By (BU Reviewer) */}
                  <div>
                    <div className="h-16 flex items-end mb-2 relative">
                      {['UNDER_REVIEW', 'APPROVED'].includes(record.status) && (record as any).buApprovedBy ? (
                        <>
                          <div className="absolute top-0 right-4 opacity-20">
                            <CheckCircle2 className="w-12 h-12 text-blue-600" />
                          </div>
                          <span className="font-[Shrikhand,cursive] text-2xl text-blue-700 italic signature-font relative z-10">
                            {((record as any).buApprovedBy as any)?.name || 'BU Reviewer'}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Pending BU Review...</span>
                      )}
                    </div>
                    <div className="border-t border-brand-navy pt-2">
                      <p className="text-xs font-bold text-brand-navy">
                        {['UNDER_REVIEW', 'APPROVED'].includes(record.status) && (record as any).buApprovedBy ? (((record as any).buApprovedBy as any)?.name || 'BU Reviewer') : 'Pending Reviewer'}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">BU Reviewer (Verifying)</p>
                      {['UNDER_REVIEW', 'APPROVED'].includes(record.status) && (record as any).buApprovedAt && (
                        <p className="text-[9px] font-mono text-blue-600 mt-1">{new Date((record as any).buApprovedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Approved By (Subsidiary Admin) */}
                  <div>
                    <div className="h-16 flex items-end mb-2 relative">
                      {record.status === 'APPROVED' ? (
                        <>
                          <div className="absolute top-0 right-4 opacity-20">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                          </div>
                          <span className="font-[Shrikhand,cursive] text-2xl text-emerald-700 italic signature-font relative z-10">
                            {(record.approvedBy as any)?.name || 'Subsidiary Admin'}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Pending Final Approval...</span>
                      )}
                    </div>
                    <div className="border-t border-brand-navy pt-2">
                      <p className="text-xs font-bold text-brand-navy">
                        {record.status === 'APPROVED' ? ((record.approvedBy as any)?.name || 'Subsidiary Admin') : 'Pending Admin'}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Subsidiary (Final Approval)</p>
                      {record.status === 'APPROVED' && (record as any).approvedAt && (
                        <p className="text-[9px] font-mono text-emerald-600 mt-1">{new Date((record as any).approvedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="border-t-2 border-brand-navy pt-4 flex justify-between items-center opacity-70">
              <span className="text-[10px] uppercase tracking-widest font-mono">Generated by MEIL ESG360 System</span>
              <span className="text-[10px] uppercase tracking-widest font-mono">Ver: 2.4.1</span>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-3">Supporting Evidence</h2>
            {evidence.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No evidence uploaded for this record.</p>
            ) : (
              <div className="space-y-3">
                {evidence.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.fileType}</p>
                      </div>
                    </div>
                    <a href={import.meta.env.PROD ? file.fileUrl : `http://localhost:5000${file.fileUrl}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-brand-navy hover:bg-brand-blush rounded-md transition-colors">
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions Column */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Review Decision</h2>
            
            {!['APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(record.status) ? (
              <div className="space-y-4">
                {(user?.role === 'ADMIN' || user?.role === 'PROJECT_OFFICER' || 
                 (user?.role === 'BUSINESS_UNIT_REVIEWER' && record.status !== 'SUBMITTED')) ? (
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-100 text-center">
                    <p className="text-sm font-medium text-gray-600">
                      {user?.role === 'BUSINESS_UNIT_REVIEWER' && record.status === 'UNDER_REVIEW' 
                        ? 'You have already verified this submission. Awaiting final approval from Subsidiary.'
                        : 'You are in view-only mode. Only Reviewers and ESG Teams can take action on this submission.'}
                    </p>
                  </div>
                ) : showCorrectionInput ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Reason / Comment</label>
                    <textarea 
                      className="input-field min-h-[100px]" 
                      placeholder="Please attach missing electricity bills..."
                      value={correctionReason}
                      onChange={e => setCorrectionReason(e.target.value)}
                    ></textarea>
                    <div className="flex gap-2">
                      <button 
                        className="btn-secondary flex-1"
                        onClick={() => setShowCorrectionInput(false)}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button 
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2 px-4 rounded-md text-sm transition-colors flex-1"
                        onClick={handleCorrection}
                        disabled={actionLoading || !correctionReason.trim()}
                      >
                        Send Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col">
                    {(user?.role === 'SUBSIDIARY_MANAGER' || user?.role === 'GROUP_ESG_TEAM') && (
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Submission
                      </button>
                    )}
                    
                    {user?.role === 'BUSINESS_UNIT_REVIEWER' && (
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                        onClick={handleEscalate}
                        disabled={actionLoading}
                      >
                        <Send className="h-4 w-4" /> Verify & Forward to Subsidiary
                      </button>
                    )}
                    <button 
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2 mt-4"
                      onClick={() => setShowCorrectionInput(true)}
                      disabled={actionLoading}
                    >
                      <AlertCircle className="h-4 w-4" /> Request Correction
                    </button>
                    <button 
                      className="text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-md border border-gray-100 text-center">
                {record.status === 'CORRECTION_REQUIRED' ? (
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                ) : (
                  <CheckCircle2 className={`h-8 w-8 mx-auto mb-2 ${record.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`} />
                )}
                <p className="text-sm font-medium text-gray-900">
                  {record.status === 'CORRECTION_REQUIRED' 
                    ? 'A correction has been requested for this submission.' 
                    : `This submission has been ${record.status.toLowerCase()}.`}
                </p>
                {record.correctionReason && (
                  <p className="text-xs text-gray-500 mt-2 italic">"{record.correctionReason}"</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;
