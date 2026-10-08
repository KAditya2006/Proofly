import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle, Clock, Archive, Edit3, Lock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ReportPreviewDrawer from '../components/reports/ReportPreviewDrawer';
import SnapshotTraceabilityModal from '../components/reports/SnapshotTraceabilityModal';
import { getReports, submitReportReview, finalizeReport, exportReport, getEvidencePack } from '../services/reportService';

const ReportArchive: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTraceability, setShowTraceability] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (report: any) => {
    setSelectedReport(report);
    setShowPreview(true);
  };

  const openTraceability = (report: any) => {
    setSelectedReport(report);
    setShowTraceability(true);
  };

  const handleAction = async (report: any, action: string) => {
    try {
      if (action === 'submit') {
        await submitReportReview(report._id);
        fetchReports();
      } else if (action === 'finalize') {
        if (confirm('Are you sure you want to finalize this report? It will become immutable.')) {
          await finalizeReport(report._id);
          fetchReports();
        }
      } else if (action === 'export-pdf') {
        const blob = await exportReport(report._id, 'PDF');
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MEIL_ESG_Report_${report.version}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else if (action === 'export-xlsx') {
        const blob = await exportReport(report._id, 'XLSX');
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MEIL_ESG_Report_${report.version}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else if (action === 'evidence-pack') {
        await getEvidencePack(report._id);
        toast.success('Evidence pack generation started.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"><Edit3 className="w-3 h-3 mr-1 mt-0.5"/> Draft</span>;
      case 'IN_REVIEW': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-brand-pink text-brand-charcoal"><Clock className="w-3 h-3 mr-1 mt-0.5"/> In Review</span>;
      case 'READY_FOR_FINALIZATION': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800"><CheckCircle className="w-3 h-3 mr-1 mt-0.5"/> Ready for Finalization</span>;
      case 'FINALIZED': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><Lock className="w-3 h-3 mr-1 mt-0.5"/> Finalized</span>;
      case 'ARCHIVED': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-600"><Archive className="w-3 h-3 mr-1 mt-0.5"/> Archived</span>;
      default: return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-navy">Report Archive</h1>
          <p className="mt-1 text-sm text-gray-500">Access, review, and download generated official ESG reports.</p>
        </div>
        <button onClick={() => navigate('/reports/builder')} className="btn-primary">
          Build New Report
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Details</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No reports generated yet.
                </td>
              </tr>
            ) : reports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-brand-navy" onClick={() => openPreview(report)}>{report.name}</div>
                      <div className="text-xs text-gray-500">{report.reportType.replace(/_/g, ' ')} • {report.scope.level}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  v{report.version}.0
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getStatusBadge(report.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                  <div className="text-xs text-gray-400">{report.generatedBy?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => openPreview(report)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Preview
                    </button>
                    
                    {report.status === 'DRAFT' && (
                      <button onClick={() => handleAction(report, 'submit')} className="text-brand-navy hover:text-brand-navy">
                        Submit Review
                      </button>
                    )}
                    
                    {report.status === 'IN_REVIEW' && (
                      <button onClick={() => handleAction(report, 'finalize')} className="text-green-600 hover:text-green-900">
                        Finalize
                      </button>
                    )}

                    {report.status === 'FINALIZED' && (
                      <>
                        <button onClick={() => handleAction(report, 'export-pdf')} className="text-brand-navy hover:text-brand-navy inline-flex items-center gap-1">
                          <Download className="h-4 w-4" /> PDF
                        </button>
                        <button onClick={() => handleAction(report, 'export-xlsx')} className="text-green-600 hover:text-green-700 inline-flex items-center gap-1 ml-2">
                          <Download className="h-4 w-4" /> XLSX
                        </button>
                        <button onClick={() => openTraceability(report)} className="text-brand-pink hover:text-brand-pink inline-flex items-center gap-1 ml-2 border px-2 py-1 rounded border-gray-200">
                          <Search className="h-4 w-4" /> Traceability
                        </button>
                        <button onClick={() => handleAction(report, 'evidence-pack')} className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 border border-gray-200 px-2 py-1 rounded ml-2">
                          Evidence Pack
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReportPreviewDrawer
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        report={selectedReport}
      />
      
      <SnapshotTraceabilityModal
        isOpen={showTraceability}
        onClose={() => setShowTraceability(false)}
        report={selectedReport}
      />
    </div>
  );
};

export default ReportArchive;
