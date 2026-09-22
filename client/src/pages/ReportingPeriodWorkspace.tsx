import React, { useEffect, useState } from 'react';
import { getReportingPeriods, updateReportingPeriod } from '../services/reportingService';
import { Settings, CheckCircle, Clock, FileBarChart, Play } from 'lucide-react';

const ReportingPeriodWorkspace: React.FC = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const data = await getReportingPeriods();
      setPeriods(data);
    } catch (error) {
      console.error('Failed to fetch reporting periods', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      await updateReportingPeriod(id, { status: newStatus });
      await fetchPeriods();
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'PLANNING': return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Planning</span>;
      case 'DATA_COLLECTION': return <span className="px-2 py-1 bg-brand-pink text-brand-charcoal text-xs font-medium rounded-full flex items-center"><Play className="w-3 h-3 mr-1"/> Data Collection</span>;
      case 'REVIEW': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center"><Clock className="w-3 h-3 mr-1"/> Review</span>;
      case 'CONSOLIDATION': return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Consolidation</span>;
      case 'REPORTING': return <span className="px-2 py-1 bg-brand-pink text-brand-charcoal text-xs font-medium rounded-full flex items-center"><FileBarChart className="w-3 h-3 mr-1"/> Reporting</span>;
      case 'FINALIZED': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Finalized</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Reporting Period Workspace</h1>
      </div>

      <div className="grid gap-6">
        {periods.map(period => (
          <div key={period._id} className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{period.name}</h2>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{period.frameworks?.join(', ')}</span>
                </div>
              </div>
              <div>
                {renderStatusBadge(period.status || 'PLANNING')}
              </div>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-gray-500" />
                Lifecycle Controls
              </h3>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => handleStatusChange(period._id, 'PLANNING')}
                  disabled={period.status === 'PLANNING'}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${period.status === 'PLANNING' ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                  Planning
                </button>
                <button 
                  onClick={() => handleStatusChange(period._id, 'DATA_COLLECTION')}
                  disabled={period.status === 'DATA_COLLECTION'}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${period.status === 'DATA_COLLECTION' ? 'bg-brand-navy text-white cursor-not-allowed border-transparent' : 'bg-white text-gray-700 hover:bg-brand-blush hover:border-brand-coral hover:text-brand-navy border-gray-300'}`}
                >
                  Data Collection
                </button>
                <button 
                  onClick={() => handleStatusChange(period._id, 'REVIEW')}
                  disabled={period.status === 'REVIEW'}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${period.status === 'REVIEW' ? 'bg-yellow-500 text-white cursor-not-allowed border-transparent' : 'bg-white text-gray-700 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 border-gray-300'}`}
                >
                  Review
                </button>
                <button 
                  onClick={() => handleStatusChange(period._id, 'CONSOLIDATION')}
                  disabled={period.status === 'CONSOLIDATION'}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${period.status === 'CONSOLIDATION' ? 'bg-purple-600 text-white cursor-not-allowed border-transparent' : 'bg-white text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 border-gray-300'}`}
                >
                  Consolidation
                </button>
                <button 
                  onClick={() => handleStatusChange(period._id, 'REPORTING')}
                  disabled={period.status === 'REPORTING'}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${period.status === 'REPORTING' ? 'bg-brand-navy text-white cursor-not-allowed border-transparent' : 'bg-white text-gray-700 hover:bg-brand-blush hover:border-brand-coral hover:text-brand-navy border-gray-300'}`}
                >
                  Reporting
                </button>
                <button 
                  onClick={() => handleStatusChange(period._id, 'FINALIZED')}
                  disabled={period.status === 'FINALIZED'}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${period.status === 'FINALIZED' ? 'bg-green-600 text-white cursor-not-allowed border-transparent' : 'bg-white text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 border-gray-300'}`}
                >
                  Finalized
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportingPeriodWorkspace;
