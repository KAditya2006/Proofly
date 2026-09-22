import React from 'react';
import { X, FileText, Shield } from 'lucide-react';

interface ReportPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: any | null;
}

const ReportPreviewDrawer: React.FC<ReportPreviewDrawerProps> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-gray-100 h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-brand-navy" /> {report.name}
            </h2>
            <div className="flex gap-4 mt-1 text-sm text-gray-500">
              <span>Version: {report.version}.0</span>
              <span>Status: <span className="font-medium text-gray-700">{report.status}</span></span>
              <span>Scope: {report.scope.level}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Report Canvas (Mock Corporate Report) */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white max-w-3xl mx-auto shadow-lg min-h-[1056px] p-12">
            
            {/* Cover Page Elements */}
            <div className="border-b-4 border-indigo-900 pb-12 mb-12">
              <div className="flex justify-between items-start mb-24">
                <Shield className="h-12 w-12 text-brand-navy" />
                <div className="text-right">
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">MEIL Group</p>
                  <p className="text-gray-400 text-xs mt-1">{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <h1 className="text-4xl font-light text-gray-900 leading-tight">
                {report.reportType.replace(/_/g, ' ')}
              </h1>
              <p className="text-xl text-gray-500 mt-4 font-light">
                {report.reportingPeriodId?.name || 'Financial Year 2025-2026'}
              </p>
            </div>

            {/* Table of Contents Mock */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 uppercase tracking-wider text-sm border-b border-gray-100 pb-2">Contents</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex justify-between"><span>Section A: General Disclosures</span> <span className="text-gray-400">3</span></li>
                <li className="flex justify-between"><span>Section B: Management & Process</span> <span className="text-gray-400">8</span></li>
                <li className="flex justify-between font-medium text-gray-900 mt-4"><span>Section C: Principle-wise Performance</span> <span className="text-gray-400">12</span></li>
                <li className="flex justify-between pl-4"><span>Principle 6: Environment</span> <span className="text-gray-400">14</span></li>
                <li className="flex justify-between pl-4"><span>Principle 8: Inclusive Growth</span> <span className="text-gray-400">22</span></li>
              </ul>
            </div>

            {/* Content Mock */}
            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-semibold text-brand-navy mb-6">Principle 6: Environment</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">P6-3: Energy Consumption</h3>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                  The organization remains committed to optimizing energy consumption across all subsidiaries. Total energy consumed from renewable sources has increased, aligning with our net-zero targets. The following data presents the consolidated energy footprint for the current reporting period.
                </p>
                
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="border-b-2 border-gray-900 text-left">
                      <th className="py-2 font-semibold">Parameter</th>
                      <th className="py-2 font-semibold text-right">Current FY</th>
                      <th className="py-2 font-semibold text-right">Previous FY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {report.metadata?.kpis?.slice(0, 5).map((kpi: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3">{kpi.indicator?.name || kpi.indicator?.code}</td>
                        <td className="py-3 text-right font-medium">{kpi.value?.toLocaleString()} {kpi.indicator?.unit}</td>
                        <td className="py-3 text-right text-gray-500">-</td>
                      </tr>
                    ))}
                    {!report.metadata?.kpis?.length && (
                      <tr>
                        <td className="py-3">Total Electricity Consumption (Grid)</td>
                        <td className="py-3 text-right font-medium">1,245,000 kWh</td>
                        <td className="py-3 text-right text-gray-500">1,100,000 kWh</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportPreviewDrawer;
