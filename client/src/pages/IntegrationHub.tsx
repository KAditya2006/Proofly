import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plug, RefreshCw, X, Plus } from 'lucide-react';

interface Integration {
  _id: string;
  name: string;
  type: string;
  protocol: string;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
}

const IntegrationHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ERP',
    protocol: 'REST_API',
    baseUrl: ''
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data } = await api.get('/integrations');
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to fetch integrations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/integrations', {
        name: formData.name,
        type: formData.type,
        protocol: formData.protocol,
        status: 'CONFIGURED',
        config: { baseUrl: formData.baseUrl, authType: 'API_KEY' },
        mappingRules: []
      });
      setIsModalOpen(false);
      setFormData({ name: '', type: 'ERP', protocol: 'REST_API', baseUrl: '' });
      fetchIntegrations();
    } catch (error) {
      console.error('Failed to create integration', error);
      alert('Failed to create integration');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED': return <span className="badge badge-success">Connected</span>;
      case 'ERROR': return <span className="badge badge-error">Error</span>;
      case 'CONFIGURED': return <span className="badge badge-info">Configured</span>;
      default: return <span className="badge badge-neutral">Not Configured</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading integrations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Enterprise Integrations</h1>
          <p className="page-subtitle mt-1">Manage external data sources, ERPs, and destination connectors.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchIntegrations}
            className="btn-secondary flex items-center justify-center flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black border-[1.5px] border-brand-coral px-6 py-2 rounded-full text-sm font-serif uppercase tracking-widest font-medium hover:bg-brand-blush transition-colors flex items-center justify-center shrink-0 flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Connection
          </button>
        </div>
      </div>

      {integrations.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Plug className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No active integrations</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md">Connect your ERP, HRMS, or custom data sources to automatically sync ESG metrics and evidence.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div key={integration._id} className="card p-6 flex flex-col hover:border-brand-coral/30 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-brand-blush flex items-center justify-center text-brand-coral shrink-0 border border-brand-pink/20">
                  <Plug className="h-6 w-6" />
                </div>
                {getStatusBadge(integration.status)}
              </div>
              
              <div className="mb-4 flex-1">
                <h3 className="text-lg font-semibold text-brand-navy leading-tight">{integration.name}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider">
                  {integration.type} • {integration.protocol.replace('_', ' ')}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-6 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Last Sync</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                {integration.lastSyncStatus && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    integration.lastSyncStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {integration.lastSyncStatus}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Link 
                  to={`/admin/integrations/${integration._id}`} 
                  className="btn-secondary flex-1 flex justify-center py-2"
                >
                  Configure
                </Link>
                <button className="bg-brand-navy text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-brand-charcoal transition-colors flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"></div>
            </div>

            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-white/20">
              <form onSubmit={handleCreate}>
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-serif text-brand-navy font-medium flex items-center">
                    <Plug className="h-5 w-5 mr-3 text-brand-coral" />
                    New Integration
                  </h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500 hover:bg-slate-50 rounded-full p-2 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="px-6 py-6 space-y-5 bg-slate-50/50">
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">Connection Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. SAP S/4HANA (Global)"
                      className="input-field"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-charcoal mb-1">System Type</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="input-field"
                      >
                        <option value="ERP">ERP System</option>
                        <option value="HRMS">HRMS System</option>
                        <option value="FINANCE">Financial System</option>
                        <option value="DOCUMENT_STORAGE">Document Storage</option>
                        <option value="OTHER">Other Data Source</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-charcoal mb-1">Protocol</label>
                      <select 
                        value={formData.protocol}
                        onChange={(e) => setFormData({...formData, protocol: e.target.value})}
                        className="input-field"
                      >
                        <option value="REST_API">REST API</option>
                        <option value="FILE_EXCHANGE">SFTP / File Exchange</option>
                        <option value="WEBHOOK">Webhook (Push)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">Base URL (Endpoint)</label>
                    <input 
                      type="url" 
                      required
                      value={formData.baseUrl}
                      onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                      placeholder="https://api.example.com/v1"
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="btn-primary"
                  >
                    {creating ? 'Creating...' : 'Create Connection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationHub;
