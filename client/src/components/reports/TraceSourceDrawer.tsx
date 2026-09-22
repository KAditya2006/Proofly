import React from 'react';
import { X, Network, FileText, CheckCircle2 } from 'lucide-react';

interface TraceSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: any | null;
}

const TraceSourceDrawer: React.FC<TraceSourceDrawerProps> = ({ isOpen, onClose, kpi }) => {
  if (!isOpen || !kpi) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-25" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Network className="h-5 w-5 text-brand-navy" /> Trace Source
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Final Value */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Final Reported Value</h3>
            <div className="bg-brand-blush border border-brand-pink rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-brand-navy">{kpi.indicator?.code}</p>
                  <p className="text-xs text-brand-navy mt-1">{kpi.indicator?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-brand-navy">{kpi.value?.toLocaleString()}</span>
                  <span className="text-sm text-brand-navy ml-1">{kpi.indicator?.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lineage mock */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-green-100 text-green-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Group Consolidation</h4>
                </div>
                <p className="text-xs text-gray-500">Summing {kpi.contributorsCount} approved subsidiary records.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-brand-pink text-brand-navy shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <FileText className="h-5 w-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Source Records</h4>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="text-xs flex justify-between">
                    <span className="text-gray-600">Subsidiary A</span>
                    <span className="font-medium">1,200</span>
                  </div>
                  <div className="text-xs flex justify-between">
                    <span className="text-gray-600">Subsidiary B</span>
                    <span className="font-medium">800</span>
                  </div>
                </div>
                <button className="text-xs text-brand-navy hover:text-brand-charcoal font-medium mt-3 block">View 12 Evidence Documents →</button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default TraceSourceDrawer;
