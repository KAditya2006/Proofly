import React, { useEffect, useState } from 'react';
import { getContributors, getTrends } from '../services/analyticsService';
import type { ContributorData, TrendData } from '../services/analyticsService';
import api from '../services/api';
import TrendChart from '../components/analytics/TrendChart';
import ContributorChart from '../components/analytics/ContributorChart';
import { Layers } from 'lucide-react';

const IndicatorExplorer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const [trends, setTrends] = useState<TrendData[]>([]);
  const [contributors, setContributors] = useState<ContributorData[]>([]);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [indRes, perRes] = await Promise.all([
          api.get('/indicators'),
          api.get('/reporting-periods')
        ]);
        
        setIndicators(indRes.data);
        setPeriods(perRes.data);
        
        if (indRes.data.length > 0) setSelectedIndicator(indRes.data[0]._id);
        
        const currentPeriod = perRes.data.find((p: any) => p.isCurrent) || perRes.data[0];
        if (currentPeriod) setSelectedPeriod(currentPeriod._id);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMasters();
  }, []);

  useEffect(() => {
    if (selectedIndicator && selectedPeriod) {
      getTrends(selectedIndicator).then(setTrends).catch(console.error);
      getContributors(selectedIndicator, selectedPeriod).then(setContributors).catch(console.error);
    }
  }, [selectedIndicator, selectedPeriod]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Explorer...</div>;

  const currentIndicator = indicators.find(i => i._id === selectedIndicator);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-brand-navy">Indicator Explorer</h1>
        <p className="text-sm text-gray-500">Deep dive into specific ESG metrics and their organizational lineage.</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 bg-gray-50">
        <div className="flex-1 w-full min-w-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">ESG Indicator</label>
          <select 
            className="input-field py-2 w-full truncate bg-white"
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
          >
            {indicators.map(ind => (
              <option key={ind._id} value={ind._id}>{ind.name} ({ind.category})</option>
            ))}
          </select>
        </div>
        <div className="md:w-64 w-full shrink-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">Reporting Period (For Breakdown)</label>
          <select 
            className="input-field py-2 w-full truncate bg-white"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map(per => (
              <option key={per._id} value={per._id}>{per.financialYear}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area */}
        <div className="card p-5">
          <h3 className="text-base font-medium text-gray-900 mb-4">Historical Trend</h3>
          <TrendChart data={trends} unit={currentIndicator?.unit || ''} />
        </div>

        {/* Contributors Area */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-medium text-gray-900">Top Contributors</h3>
            <Layers className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mb-4">Breakdown of approved project records contributing to this metric.</p>
          <ContributorChart data={contributors} />
        </div>
      </div>
    </div>
  );
};

export default IndicatorExplorer;
