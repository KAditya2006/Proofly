import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import type { User } from '../services/userService';
import { getOrganizations } from '../services/organizationService';
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  X,
  AlertCircle
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    mobileNo: '',
    password: 'Demo123!',
    role: 'PROJECT_OFFICER',
    organizationId: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, orgsData] = await Promise.all([
        userService.getUsers(),
        getOrganizations()
      ]);
      setUsers(usersData);
      setOrganizations(orgsData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await userService.createUser(formData);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setFormLoading(true);
    try {
      await userService.updateUser(selectedUser._id, {
        name: formData.name,
        mobileNo: formData.mobileNo,
        role: formData.role,
        organizationId: formData.organizationId || null,
        status: formData.status
      });
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      mobileNo: user.mobileNo || '',
      password: '',
      role: user.role,
      organizationId: user.organizationId?._id || '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      employeeId: '',
      mobileNo: '',
      password: 'Demo123!',
      role: 'PROJECT_OFFICER',
      organizationId: '',
      status: 'ACTIVE'
    });
    setSelectedUser(null);
    setError('');
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle mt-1">Manage employees, roles, and access controls</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="bg-white text-black border-[1.5px] border-brand-coral px-6 py-2 rounded-full text-sm font-serif uppercase tracking-widest font-medium hover:bg-brand-blush transition-colors flex items-center justify-center shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            New User
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
              <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role & Org</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-navy"></div>
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{user.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{user.email}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{user.mobileNo || '-'}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 flex items-center">
                      <Shield className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                      {user.role.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{user.organizationId?.name || 'Group Level'}</div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase ${
                      user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      user.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="text-brand-coral hover:text-brand-navy transition-colors text-xs font-semibold uppercase tracking-wider flex items-center justify-end w-full"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-slate-900">
                {showCreateModal ? 'Provision New User' : 'User Details & Settings'}
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateUser : handleUpdateUser} className="p-6 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={showEditModal}
                    className="input-field mt-1 disabled:bg-slate-50 disabled:text-slate-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">Employee ID</label>
                  <input
                    type="text"
                    required={showEditModal}
                    disabled={true}
                    className="input-field mt-1 font-mono disabled:bg-slate-50 disabled:text-slate-500"
                    value={showCreateModal ? 'Auto-generated on creation' : formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    className="input-field mt-1"
                    value={formData.mobileNo}
                    onChange={(e) => setFormData({...formData, mobileNo: e.target.value})}
                  />
                </div>

                <div className="col-span-2 border-t border-slate-100 pt-6 mt-2">
                  <h4 className="text-sm font-medium text-slate-900 mb-4">Access & Permissions</h4>
                </div>

                <div>
                  <label className="input-label">Role</label>
                  <select
                    className="input-field mt-1"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="PROJECT_OFFICER">Project Officer (Data Entry)</option>
                    <option value="BUSINESS_UNIT_REVIEWER">Business Unit Reviewer</option>
                    <option value="SUBSIDIARY_MANAGER">Subsidiary Manager</option>
                    <option value="GROUP_ESG_TEAM">Group ESG Team</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Organization Context</label>
                  <select
                    className="input-field mt-1"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                    disabled={formData.role === 'GROUP_ESG_TEAM' || formData.role === 'ADMIN'}
                  >
                    <option value="">Group Level (No specific org)</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>
                        {org.name} ({org.type.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                {showEditModal && (
                  <div>
                    <label className="input-label">Account Status</label>
                    <select
                      className="input-field mt-1"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="DISABLED">Disabled</option>
                    </select>
                  </div>
                )}
                
                {showCreateModal && (
                  <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                    <p className="text-sm text-slate-600">
                      <strong>Security Note:</strong> New users are provisioned with a temporary password (<code>Demo123!</code>). They will be forced to change this password on their first login.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : showCreateModal ? 'Provision User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
