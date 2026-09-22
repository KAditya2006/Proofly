import React, { useEffect, useState } from 'react';
import { getPendingReviews } from '../services/reviewService';
import { type ESGRecord } from '../services/esgRecordService';
import { FileSearch, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReviewWorkspace: React.FC = () => {
  const [reviews, setReviews] = useState<ESGRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [currentPeriod, setCurrentPeriod] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsData, periodRes] = await Promise.all([
          getPendingReviews(),
          import('../services/api').then(m => m.default.get('/reporting-periods'))
        ]);
        setReviews(reviewsData);
        
        const periods = periodRes.data;
        const activePeriod = periods.find((p: any) => p.isCurrent) || periods[0];
        setCurrentPeriod(activePeriod);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load pending reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-brand-navy text-white shadow-sm">New Submission</span>;
      case 'UNDER_REVIEW':
        return <span className="px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-700 shadow-sm">Under Review</span>;
      default:
        return <span className="px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-gray-100 text-gray-500 shadow-sm">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title">Review Workspace</h1>
          <p className="page-subtitle mt-1">Review and approve ESG data submissions.</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-brand-coral/10 table-auto">
            <thead>
              <tr className="bg-white/30 backdrop-blur-md">
                <th scope="col" className="px-4 sm:px-6 py-4 sm:py-6 text-left text-[11px] font-bold text-brand-coral uppercase tracking-[0.2em]">Project / Indicator</th>
                <th scope="col" className="px-4 sm:px-6 py-4 sm:py-6 text-left text-[11px] font-bold text-brand-coral uppercase tracking-[0.2em]">Submitted Value</th>
                <th scope="col" className="px-4 sm:px-6 py-4 sm:py-6 text-left text-[11px] font-bold text-brand-coral uppercase tracking-[0.2em]">Submitted By</th>
                <th scope="col" className="px-4 sm:px-6 py-4 sm:py-6 text-left text-[11px] font-bold text-brand-coral uppercase tracking-[0.2em]">Status</th>
                <th scope="col" className="px-4 sm:px-6 py-4 sm:py-6 text-right text-[11px] font-bold text-brand-coral uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-coral/10 bg-white/20 backdrop-blur-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm font-serif text-brand-charcoal/50">Loading pending reviews...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm font-serif text-red-500/80">{error}</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 sm:py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-20 w-20 rounded-full bg-white/50 flex items-center justify-center mb-6 shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-brand-coral/60" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-2xl font-serif font-semibold text-brand-navy">All caught up!</h3>
                      <p className="text-sm text-brand-charcoal/50 mt-3 max-w-sm leading-relaxed">
                        There are no pending submissions requiring your review at this time.
                      </p>
                      {currentPeriod && (
                        <div className="mt-6 px-4 py-2 bg-brand-coral/5 rounded-lg border border-brand-coral/10">
                          <p className="text-xs font-semibold text-brand-navy tracking-wide">
                            CURRENT CONTEXT
                          </p>
                          <p className="text-xs text-brand-charcoal/70 mt-1">
                            Reporting Period: <span className="font-semibold">{currentPeriod.name} ({currentPeriod.financialYear})</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((record) => {
                  const project: any = record.projectId;
                  const indicator: any = record.indicatorId;
                  const submitter: any = record.submittedBy;

                  return (
                    <tr key={record._id} className="hover:bg-white/60 transition-colors group">
                      <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 sm:h-14 sm:w-14 bg-white rounded-2xl flex items-center justify-center border border-brand-coral/10 shadow-sm group-hover:scale-105 transition-transform">
                            <FileSearch className="h-5 w-5 sm:h-6 sm:w-6 text-brand-coral" strokeWidth={1.5} />
                          </div>
                          <div className="ml-3 sm:ml-5">
                            <div className="text-sm sm:text-base font-semibold text-brand-navy">{indicator?.name || 'Unknown Indicator'}</div>
                            <div className="text-xs text-brand-charcoal/50 mt-1 font-medium tracking-wide">{project?.projectCode} - {project?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                        <div className="text-sm sm:text-base text-brand-navy font-semibold">{record.value} <span className="text-xs text-brand-charcoal/40 font-medium ml-1">{record.unit}</span></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-brand-navy font-medium">{submitter?.name || 'Unknown User'}</div>
                        <div className="text-[10px] sm:text-[11px] text-brand-charcoal/40 font-medium flex items-center mt-1 uppercase tracking-wider">
                          <Clock className="h-3 w-3 mr-1 opacity-70" />
                          {new Date(record.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/reviews/${record._id}`)}
                          className="text-[10px] sm:text-[11px] font-bold tracking-widest text-brand-navy hover:text-brand-coral uppercase flex items-center justify-end w-full transition-colors"
                        >
                          REVIEW <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReviewWorkspace;
