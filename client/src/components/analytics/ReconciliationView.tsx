import React, { useState, useEffect } from 'react';
import { getConsolidationLineage } from '../../services/consolidationService';
import { FileText, Calculator, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReconciliationViewProps {
  indicatorId: string;
  reportingPeriodId: string;
  scopeLevel: string;
  scopeId: string;
  reportedValue: number;
  unit: string;
}

const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  indicatorId,
  reportingPeriodId,
  scopeLevel,
  scopeId,
  reportedValue,
  unit
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConsolidationLineage(indicatorId, reportingPeriodId, scopeLevel, scopeId)
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [indicatorId, reportingPeriodId, scopeLevel, scopeId]);

  const totalSum = records.reduce((sum, record) => sum + (Number(record.value) || 0), 0);
  const isReconciled = Math.abs(totalSum - reportedValue) < 0.01;

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading reconciliation data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-brand-navy" />
          Data Reconciliation
        </h3>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full md:w-1/3 text-center mb-4 md:mb-0">
            <div className="text-sm font-medium text-gray-500 mb-1">Sum of Source Records</div>
            <div className="text-3xl font-bold text-gray-900">{totalSum.toLocaleString()} {unit}</div>
            <div className="text-xs text-gray-500 mt-2">from {records.length} approved project records</div>
          </div>
          
          <div className="flex flex-col items-center justify-center px-4">
            {isReconciled ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-sm font-bold text-green-700">Reconciled</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-8 h-8 text-red-500 mb-2" />
                <span className="text-sm font-bold text-red-700">Mismatch Detected</span>
              </div>
            )}
            <ArrowRight className="w-6 h-6 text-gray-400 my-2 hidden md:block" />
          </div>

          <div className="bg-brand-blush p-4 rounded-lg border border-gray-200 w-full md:w-1/3 text-center">
            <div className="text-sm font-medium text-brand-navy mb-1">Reported BRSR Value</div>
            <div className="text-3xl font-bold text-brand-navy">{reportedValue.toLocaleString()} {unit}</div>
            <div className="text-xs text-brand-navy mt-2">Final consolidated output</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">Source Records Breakdown</h4>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Evidence</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.projectId.name}</div>
                      <div className="text-xs text-gray-500">{record.projectId.projectCode}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">{record.value}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {record.evidenceIds && record.evidenceIds.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          <FileText className="w-3 h-3 mr-1" /> {record.evidenceIds.length}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationView;
