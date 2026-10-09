import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { exportToPDF } from '../utils/exportUtils';
import { FileText as FilePdf } from 'lucide-react';

export default function BRSRCore() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Get periodId from URL query param
  const periodId = searchParams.get('periodId');

  useEffect(() => {
    const fetchCore = async () => {
      if (!periodId) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/brsr-core/dashboard?reportingPeriodId=${periodId}`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching BRSR core data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCore();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading BRSR Core metrics...</div>
      </div>
    );
  }

  if (!data || !data.attributes || data.attributes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-serif font-semibold text-brand-navy mb-2">BRSR Core Dashboard</h1>
        <p className="text-gray-500 mb-6">No BRSR Core configuration found.</p>
      </div>
    );
  }

  return (
    <div id="brsr-export-area" className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-navy">BRSR Core Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time status of critical BRSR Core KPIs.</p>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => {
              exportToPDF('brsr-export-area', 'BRSR_Core_Report');
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20 transition-colors shadow-sm text-sm font-bold uppercase tracking-wider"
            title="Export as PDF"
          >
            <FilePdf className="w-5 h-5" />
            <span>Export Report</span>
          </button>
          
          <div className="bg-brand-blush border border-gray-200 px-6 py-3 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-brand-navy">{data.overallReadiness}%</div>
            <div className="text-xs text-brand-charcoal font-medium uppercase tracking-wide">Overall Readiness</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Core Attributes</h2>
          <span className="text-xs text-gray-500">{data.attributes.length} Configured</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {data.attributes.map((attr: any) => (
            <div key={attr._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-medium text-gray-900">{attr.attributeName}</h3>
                <p className="text-sm text-gray-500 mt-1">{attr.mappedIndicatorsCount} mapped indicators</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>Data: {attr.metrics.totalData}</span>
                  <span>Evidence: {attr.metrics.withEvidence}</span>
                  <span>Approved: {attr.metrics.approved}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  attr.status === 'Ready' ? 'bg-green-100 text-green-800' :
                  attr.status === 'Missing Data' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {attr.status === 'Ready' && '✓ '}
                  {attr.status === 'Attention Required' && '⚠ '}
                  {attr.status === 'Missing Data' && '✕ '}
                  {attr.status}
                </span>
                
                <button className="text-brand-navy hover:text-brand-charcoal text-sm font-medium transition-colors">
                  Drill Down &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
