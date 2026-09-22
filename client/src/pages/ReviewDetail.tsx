import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecordById } from '../services/esgRecordService';
import { approveSubmission, requestCorrection, rejectSubmission, escalateSubmission } from '../services/reviewService';
import { type ESGRecord } from '../services/esgRecordService';
import { FileText, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Download, Send } from 'lucide-react';

const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      alert('Approval failed');
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
      alert('Escalation failed');
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
      alert('Correction request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !correctionReason.trim()) {
      alert("Please provide a reason for rejection.");
      setShowCorrectionInput(true);
      return;
    }
    try {
      setActionLoading(true);
      await rejectSubmission(id, correctionReason);
      navigate('/reviews');
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Rejection failed');
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
        <button onClick={() => navigate('/reviews')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
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
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-3">Data Details</h2>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-sm text-gray-500 mb-1">Indicator</span>
                <span className="text-sm font-medium text-gray-900">{indicator.code} - {indicator.name}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-sm text-gray-500 mb-1">Reported Value</span>
                <span className="text-xl font-semibold text-gray-900">{record.value} <span className="text-sm font-normal text-gray-500">{record.unit}</span></span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-sm text-gray-500 mb-1">Source</span>
                <span className="text-sm text-gray-900">{record.source || 'Not provided'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-sm text-gray-500 mb-1">Calculation Method</span>
                <span className="text-sm text-gray-900">{record.calculationMethod || 'Not provided'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-sm text-gray-500 mb-1">Remarks</span>
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700 min-h-[60px]">
                  {record.remarks || 'No remarks provided.'}
                </div>
              </div>
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
                    <a href={`http://localhost:5000${file.fileUrl}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-brand-navy hover:bg-brand-blush rounded-md transition-colors">
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
            
            {!['APPROVED', 'REJECTED'].includes(record.status) ? (
              <div className="space-y-4">
                {showCorrectionInput ? (
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
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Submission
                    </button>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                      onClick={handleEscalate}
                      disabled={actionLoading}
                    >
                      <Send className="h-4 w-4" /> Send to Higher Authority
                    </button>
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
                <CheckCircle2 className={`h-8 w-8 mx-auto mb-2 ${record.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`} />
                <p className="text-sm font-medium text-gray-900">
                  This submission has been {record.status.toLowerCase()}.
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
