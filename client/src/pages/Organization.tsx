import React, { useEffect, useState } from 'react';
import { getOrganizations, createOrganization, type Organization } from '../services/organizationService';
import { Building2, ChevronRight, ChevronDown, X, AlertCircle } from 'lucide-react';

const OrganizationPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    type: 'GROUP',
    code: '',
    location: '',
    parentId: ''
  });

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
        // Expand root nodes by default
        const groupNodes = data.filter(org => org.type === 'GROUP').map(org => org._id);
        setExpandedNodes(new Set(groupNodes));
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      if (payload.type === 'GROUP' || !payload.parentId) {
        delete payload.parentId;
      }
      
      const newOrg = await createOrganization(payload);
      setOrganizations([...organizations, newOrg]);
      setIsModalOpen(false);
      setFormData({ name: '', type: 'GROUP', code: '', location: '', parentId: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const renderTree = (parentId?: string, depth: number = 0) => {
    const children = organizations.filter(org => org.parentId === parentId);
    
    if (children.length === 0) return null;

    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-6 pl-4 border-l border-gray-200' : ''}`}>
        {children.map(org => {
          const hasChildren = organizations.some(child => child.parentId === org._id);
          const isExpanded = expandedNodes.has(org._id);

          return (
            <div key={org._id} className="mt-2">
              <div 
                className={`flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer border ${depth === 0 ? 'border-gray-200 bg-white shadow-sm' : 'border-transparent'}`}
                onClick={() => hasChildren && toggleNode(org._id)}
              >
                <div className="w-6 flex items-center justify-center text-gray-400">
                  {hasChildren ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <div className="w-4" />}
                </div>
                <Building2 size={18} className="text-brand-coral mr-3" />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{org.name}</span>
                  <span className="ml-3 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {org.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-mono">{org.code}</div>
              </div>
              
              {hasChildren && isExpanded && (
                <div className="mt-2">
                  {renderTree(org._id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-navy">Organization Master</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the corporate hierarchy and logical boundaries.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Add Node</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
        {/* We start the tree by finding root nodes (nodes without a parent) */}
        {renderTree(undefined)}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-semibold text-brand-navy">Add Organization Node</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input 
                  required
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none"
                  placeholder="e.g. MEIL Infrastructure"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select 
                    required
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none bg-white"
                  >
                    <option value="GROUP">GROUP</option>
                    <option value="SUBSIDIARY">SUBSIDIARY</option>
                    <option value="BUSINESS_UNIT">BUSINESS UNIT</option>
                    <option value="PROJECT">PROJECT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input 
                    required
                    type="text" 
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none"
                    placeholder="e.g. MEIL-INF"
                  />
                </div>
              </div>

              {formData.type !== 'GROUP' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Node *</label>
                  <select 
                    required
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Select Parent</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>
                        {org.name} ({org.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none"
                  placeholder="e.g. Hyderabad, India"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
