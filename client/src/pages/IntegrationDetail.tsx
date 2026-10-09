import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Play, Settings, RefreshCw } from 'lucide-react';

interface Integration {
  _id: string;
  name: string;
  type: string;
  protocol: string;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  mappingRules: any[];
}

const IntegrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    fetchIntegration();
  }, [id]);

  const fetchIntegration = async () => {
    try {
      const { data } = await api.get(`/integrations/${id}`);
      setIntegration(data);
    } catch (error) {
      console.error('Failed to fetch integration', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    if (!integration) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data } = await api.post(`/integrations/${integration._id}/sync`);
      setSyncResult(data);
      fetchIntegration(); // Refresh status
    } catch (error: any) {
      console.error('Sync failed', error);
      setSyncResult({ error: error.response?.data?.error?.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
  if (!integration) return <div className="p-8 text-center text-red-500">Integration not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy tracking-tight">{integration.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {integration.type} Integration via {integration.protocol.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Integration Control</h3>
          <div className="flex space-x-3">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                ${syncing ? 'bg-primary-400 cursor-not-allowed' : 'bg-brand-navy hover:bg-[#111e2e]'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-coral`}
            >
              {syncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              {syncing ? 'Syncing...' : 'Trigger Sync'}
            </button>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{integration.status}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Last Sync</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Last Status</p>
              <p className={`mt-1 text-lg font-semibold ${
                integration.lastSyncStatus === 'SUCCESS' ? 'text-green-600' : 
                integration.lastSyncStatus === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {integration.lastSyncStatus || 'N/A'}
              </p>
            </div>
          </div>

          {syncResult && (
            <div className={`p-4 rounded-md ${syncResult.error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
              <h4 className="font-medium">{syncResult.error ? 'Sync Failed' : 'Sync Job Triggered Successfully'}</h4>
              <p className="text-sm mt-1">{syncResult.error || syncResult.message}</p>
              {syncResult.batch && (
                <div className="mt-2 text-sm bg-white bg-opacity-50 p-3 rounded border border-green-100 font-mono">
                  <p>Batch ID: {syncResult.batch._id}</p>
                  <p>Status: {syncResult.batch.status}</p>
                  <p>Processed: {syncResult.batch.totalRecords}</p>
                  <p>Valid: {syncResult.batch.validRecords}</p>
                  <p>Rejected: {syncResult.batch.rejectedRecords}</p>
                  <p>Duplicates: {syncResult.batch.duplicateRecords}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-2 text-gray-400" />
              Mapping Rules ({integration.mappingRules?.length || 0})
            </h4>
            {integration.mappingRules && integration.mappingRules.length > 0 ? (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">External Field</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESG Indicator ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Factor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {integration.mappingRules.map((rule, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.externalField}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{rule.indicatorId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.conversionFactor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded border border-gray-200">No mapping rules configured. Pulling data will result in errors.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDetail;
