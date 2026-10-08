import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Key, Plus, Trash2, Copy, AlertTriangle } from 'lucide-react';

interface ServiceAccount {
  _id: string;
  name: string;
  status: string;
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
  organizationId: { _id: string, name: string };
}

const ServiceAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    organizationId: '60d0fe4f5311236168a109ca', // Default fallback, should be real org in prod
    permissions: 'ESG_RECORD_READ,ESG_RECORD_WRITE'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/service-accounts');
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        permissions: formData.permissions.split(',').map(p => p.trim())
      };
      const { data } = await api.post('/service-accounts', payload);
      setNewKey(data.apiKey);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to create account', error);
      toast.error('Failed to create account');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this key? External systems using it will immediately lose access.')) return;
    try {
      await api.put(`/service-accounts/${id}/revoke`);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to revoke', error);
      toast.error('Failed to revoke account');
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success('API Key copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy tracking-tight">API Keys (Service Accounts)</h1>
          <p className="mt-1 text-sm text-gray-500">Manage machine-to-machine access to the ESG360 platform.</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setNewKey(null); }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-navy hover:bg-[#111e2e]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate API Key
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-8 text-center text-gray-500">Loading API keys...</li>
          ) : accounts.length === 0 ? (
            <li className="p-8 text-center text-gray-500">
              <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No Service Accounts configured.</p>
            </li>
          ) : (
            accounts.map((account) => (
              <li key={account._id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <p className="text-sm font-bold text-gray-900">{account.name}</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <p className="mb-1">Organization: {typeof account.organizationId === 'string' ? account.organizationId : account.organizationId?.name}</p>
                    <p className="font-mono bg-gray-100 px-1 py-0.5 rounded inline-block">Account ID: {account._id}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {account.permissions.map(p => (
                        <span key={p} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm border border-gray-200 text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Created: {new Date(account.createdAt).toLocaleDateString()} • Last Used: {account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                {account.status === 'ACTIVE' && (
                  <button 
                    onClick={() => handleRevoke(account._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Revoke Key"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New API Key</h3>
            
            {newKey ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> Please copy this API key now. You will not be able to see it again!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={newKey} 
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-navy focus:ring-brand-coral sm:text-sm bg-gray-50 font-mono"
                  />
                  <button onClick={copyKey} className="p-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">
                    <Copy className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-brand-navy text-white rounded text-sm font-medium hover:bg-[#111e2e]">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Key Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. ERP Prod Sync"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-navy focus:ring-brand-coral sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Permissions (Comma separated)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.permissions}
                    onChange={e => setFormData({...formData, permissions: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-navy focus:ring-brand-coral sm:text-sm font-mono"
                  />
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-navy text-base font-medium text-white hover:bg-[#111e2e] focus:outline-none sm:col-start-2 sm:text-sm"
                  >
                    Generate Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAccounts;
