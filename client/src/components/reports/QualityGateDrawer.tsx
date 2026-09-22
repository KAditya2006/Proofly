import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

interface QualityGateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  qualityResult: any;
  loading: boolean;
}

const QualityGateDrawer: React.FC<QualityGateDrawerProps> = ({
  isOpen,
  onClose,
  onProceed,
  qualityResult,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-25" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-brand-navy" /> Quality Gate
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <span className="text-sm text-gray-500">Running enterprise quality checks...</span>
            </div>
          ) : !qualityResult ? (
            <div className="text-sm text-gray-500">No quality results found.</div>
          ) : (
            <>
              {/* Status Header */}
              <div className={`p-4 rounded-lg border ${
                qualityResult.status === 'READY' ? 'bg-green-50 border-green-200' :
                qualityResult.status === 'WARNING' ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {qualityResult.status === 'READY' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {qualityResult.status === 'WARNING' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                  {qualityResult.status === 'BLOCKED' && <XCircle className="h-5 w-5 text-red-600" />}
                  <span className={`font-semibold ${
                    qualityResult.status === 'READY' ? 'text-green-800' :
                    qualityResult.status === 'WARNING' ? 'text-amber-800' :
                    'text-red-800'
                  }`}>
                    Status: {qualityResult.status}
                  </span>
                </div>
                {qualityResult.status === 'BLOCKED' && (
                  <p className="text-sm mt-2 text-red-700">Critical issues must be resolved before this report can be finalized.</p>
                )}
              </div>

              {/* Checks */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2">Verification Checks</h3>
                {Object.entries(qualityResult.checks || {}).map(([key, check]: [string, any]) => (
                  <div key={key} className="flex items-start gap-3">
                    {check.status === 'PASS' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
                    {check.status === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                    {check.status === 'FAIL' && <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Anomalies */}
              {qualityResult.anomalies && qualityResult.anomalies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2 mt-4">Detected Anomalies</h3>
                  {qualityResult.anomalies.map((anomaly: any, i: number) => (
                    <div key={i} className={`p-3 rounded border text-sm ${
                      anomaly.type === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-800' :
                      anomaly.type === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                      'bg-brand-blush border-brand-pink text-brand-charcoal'
                    }`}>
                      <div className="font-medium flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> {anomaly.type}
                      </div>
                      <p className="mt-1 text-xs opacity-90">{anomaly.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary text-sm"
            disabled={loading || qualityResult?.status === 'BLOCKED'}
            onClick={onProceed}
          >
            Acknowledge & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityGateDrawer;
