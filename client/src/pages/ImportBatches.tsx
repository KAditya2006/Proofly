import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Database, Filter } from 'lucide-react';

interface ImportBatch {
  _id: string;
  integrationId: { _id: string, name: string };
  source: string;
  status: string;
  totalRecords: number;
  validRecords: number;
  rejectedRecords: number;
  duplicateRecords: number;
  createdAt: string;
  completedAt?: string;
  syncErrors: any[];
}

const ImportBatches: React.FC = () => {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await api.get('/import-batches');
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch import batches', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'FAILED': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      case 'PARTIAL': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>;
      case 'PROCESSING': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-brand-pink text-brand-charcoal animate-pulse">Processing</span>;
      default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy tracking-tight">Import History</h1>
        <p className="mt-1 text-sm text-gray-500">Track data synced from external enterprise systems.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Database className="h-4 w-4 mr-2" />
            Showing last 50 imports
          </div>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-gray-600"><Filter className="h-5 w-5" /></button>
          </div>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-8 text-center text-gray-500">Loading imports...</li>
          ) : batches.length === 0 ? (
            <li className="p-8 text-center text-gray-500">No import history found.</li>
          ) : (
            batches.map((batch) => (
              <li key={batch._id} className="hover:bg-gray-50 transition-colors">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <p className="text-sm font-medium text-brand-navy truncate">
                        {batch.integrationId ? batch.integrationId.name : batch.source}
                      </p>
                      {getStatusBadge(batch.status)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-4">
                      <span>Started: {new Date(batch.createdAt).toLocaleString()}</span>
                      <span>Total: {batch.totalRecords}</span>
                      <span className="text-green-600">Valid: {batch.validRecords}</span>
                      {batch.rejectedRecords > 0 && <span className="text-red-600">Rejected: {batch.rejectedRecords}</span>}
                      {batch.duplicateRecords > 0 && <span className="text-yellow-600">Dupes: {batch.duplicateRecords}</span>}
                    </div>
                  </div>
                  {batch.syncErrors && batch.syncErrors.length > 0 && (
                    <div className="ml-4 flex-shrink-0">
                      <details className="text-xs text-gray-500 cursor-pointer">
                        <summary className="text-red-500 font-medium hover:underline">View Errors ({batch.syncErrors.length})</summary>
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded max-w-sm max-h-32 overflow-y-auto">
                          {batch.syncErrors.slice(0, 5).map((err, i) => (
                            <div key={i} className="mb-1 truncate">
                              <span className="font-mono text-gray-700">{err.recordId || 'Global'}:</span> {err.message}
                            </div>
                          ))}
                          {batch.syncErrors.length > 5 && <div className="italic text-gray-400">...and {batch.syncErrors.length - 5} more</div>}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ImportBatches;
