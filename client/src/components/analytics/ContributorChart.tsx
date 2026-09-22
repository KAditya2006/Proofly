import React from 'react';
import type { ContributorData } from '../../services/analyticsService';

interface ContributorChartProps {
  data: ContributorData[];
}

const ContributorChart: React.FC<ContributorChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded">
        No contributor data available for this indicator.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((contributor) => (
        <div key={contributor.projectId} className="relative">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">{contributor.projectName} <span className="text-gray-400 text-xs">({contributor.projectCode})</span></span>
            <span className="text-gray-600">{contributor.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-coral h-2 rounded-full" 
              style={{ width: `${contributor.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContributorChart;
