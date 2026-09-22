import React from 'react';
import type { TrendData } from '../../services/analyticsService';

interface TrendChartProps {
  data: TrendData[];
  unit: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, unit }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-brand-charcoal/50 font-serif text-center rounded-[1.5rem] bg-white/40 border border-white/60">
        No historical data available to show trends.
      </div>
    );
  }

  // Find max value to scale the bars
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="h-64 flex items-end justify-around space-x-2 pt-8 pb-2 border-b border-brand-coral/20">
      {data.map((item) => {
        const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.periodId} className="flex flex-col items-center w-full group relative">
            <div 
              className="w-4/5 bg-brand-coral rounded-t-sm transition-all duration-300 hover:bg-brand-navy"
              style={{ height: `${Math.max(heightPercent, 5)}%` }} // Minimum height for visibility
            ></div>
            <div className="mt-2 text-xs font-medium tracking-wide text-brand-charcoal/60 truncate w-full text-center" title={item.financialYear}>
              {item.financialYear}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-navy text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
              {item.value} {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrendChart;
