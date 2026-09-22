import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface ReadinessProps {
  score: number;
  checks: {
    label: string;
    status: 'PASS' | 'WARNING' | 'FAIL';
    message?: string;
  }[];
}

const ReportReadiness: React.FC<ReadinessProps> = ({ score, checks }) => {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-medium text-gray-900">Report Readiness</h2>
        <span className="text-2xl font-serif font-semibold text-brand-navy">{score}%</span>
      </div>
      
      <div className="space-y-3">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {check.status === 'PASS' && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
            {check.status === 'WARNING' && <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
            {check.status === 'FAIL' && <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
            
            <div>
              <p className="text-sm font-medium text-gray-900">{check.label}</p>
              {check.message && (
                <p className={`text-xs mt-1 ${check.status === 'WARNING' ? 'text-amber-700' : 'text-gray-500'}`}>
                  {check.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportReadiness;
