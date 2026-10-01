import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import type { User } from '../services/userService';
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  X,
  AlertCircle
} from 'lucide-react';
import { PremiumSelect } from '../components/PremiumSelect';
import { PremiumLoader } from '../components/PremiumLoader';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
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
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (['PROJECT_OFFICER', 'BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER'].includes(formData.role) && !formData.organizationId) {
      setError('Please select an Organization Context for this role.');
      return;
    }

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
    
    if (['PROJECT_OFFICER', 'BUSINESS_UNIT_REVIEWER', 'SUBSIDIARY_MANAGER'].includes(formData.role) && !formData.organizationId) {
      setError('Please select an Organization Context for this role.');
      return;
    }

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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Are you sure you want to delete the user ${selectedUser.name}? This action cannot be undone.`)) return;
    
    setError('');
    setFormLoading(true);
    try {
      await userService.disableUser(selectedUser._id);
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
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
                  <PremiumLoader text="Loading Users..." className="h-32" />
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
        <div className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/50 transform transition-all">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
              <h3 className="text-2xl font-serif text-brand-navy font-bold tracking-wide">
                {showCreateModal ? 'Provision New User' : 'User Details & Settings'}
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="p-2 rounded-full text-gray-400 hover:text-brand-coral hover:bg-brand-blush transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={showCreateModal ? handleCreateUser : handleUpdateUser} className="p-8">
                {error && (
                  <div className="rounded-2xl bg-red-50 p-4 border border-red-100 mb-8 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 shrink-0" />
                    <div className="text-sm font-medium text-red-800">{error}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-50 border border-gray-200 text-brand-navy rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral transition-all placeholder-gray-400"
                      placeholder="e.g. Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled={showEditModal}
                      className="w-full bg-gray-50 border border-gray-200 text-brand-navy rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral transition-all placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="jane.doe@meil.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Employee ID</label>
                    <input
                      type="text"
                      required={showEditModal}
                      disabled={true}
                      className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 font-mono text-sm"
                      value={showCreateModal ? 'Auto-generated on creation' : formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      className="w-full bg-gray-50 border border-gray-200 text-brand-navy rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral transition-all placeholder-gray-400"
                      placeholder="+91 98765 43210"
                      value={formData.mobileNo}
                      onChange={(e) => setFormData({...formData, mobileNo: e.target.value})}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-4">
                    <h4 className="text-lg font-serif font-semibold text-brand-navy border-b border-gray-100 pb-2">Access & Permissions</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                    <PremiumSelect
                      options={[
                        { value: 'PROJECT_OFFICER', label: 'Project Officer (PO)' },
                        { value: 'BUSINESS_UNIT_REVIEWER', label: 'Business Unit Reviewer (BU)' },
                        { value: 'SUBSIDIARY_MANAGER', label: 'Subsidiary Manager' },
                        { value: 'AUDITOR', label: 'Auditor (AU)' },
                        { value: 'ADMIN', label: 'System Administrator (Admin / MEIL)' }
                      ]}
                      value={formData.role}
                      onChange={(val) => setFormData({...formData, role: val, organizationId: ''})}
                    />
                  </div>
                  {(formData.role === 'PROJECT_OFFICER' || formData.role === 'BUSINESS_UNIT_REVIEWER') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Manager</label>
                      <PremiumSelect
                        options={[
                          { 
                            value: '', 
                            label: '--- Select Manager ---' 
                          },
                          ...users
                            .filter(u => {
                              if (formData.role === 'PROJECT_OFFICER') {
                                return u.role === 'BUSINESS_UNIT_REVIEWER' && u.status !== 'DISABLED';
                              }
                              if (formData.role === 'BUSINESS_UNIT_REVIEWER') {
                                return u.role === 'SUBSIDIARY_MANAGER' && u.status !== 'DISABLED';
                              }
                              return false;
                            })
                            .map(u => ({
                              value: u._id,
                              label: `${u.name} (${u.role.replace(/_/g, ' ')})`
                            }))
                        ]}
                        value={formData.organizationId} // Reusing organizationId field for managerId
                        onChange={(val) => setFormData({...formData, organizationId: val})}
                      />
                    </div>
                  )}

                  {showEditModal && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Status</label>
                      <PremiumSelect
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'SUSPENDED', label: 'Suspended' },
                          { value: 'DISABLED', label: 'Disabled' }
                        ]}
                        value={formData.status}
                        onChange={(val) => setFormData({...formData, status: val})}
                      />
                    </div>
                  )}
                  
                  {showCreateModal && (
                    <div className="col-span-1 md:col-span-2 bg-brand-blush/40 border border-brand-coral/20 rounded-2xl p-5 mt-2">
                      <div className="flex">
                        <Shield className="h-5 w-5 text-brand-coral shrink-0 mt-0.5" />
                        <p className="ml-3 text-sm text-brand-navy leading-relaxed">
                          <strong className="font-semibold">Security Note:</strong> New users are automatically provisioned with a temporary password (<code className="bg-white px-2 py-0.5 rounded text-brand-coral border border-brand-coral/20">Demo123!</code>). They will be forced to change this password on their first login.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center gap-4 pt-10 mt-6">
                  {showEditModal ? (
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      className="px-6 py-3 rounded-full text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 transition-colors border border-red-200 hover:border-red-600 focus:outline-none"
                      disabled={formLoading}
                    >
                      Delete User
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                      className="px-6 py-3 rounded-full text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors focus:outline-none"
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-full bg-brand-navy text-white text-sm font-serif tracking-widest uppercase font-semibold hover:bg-brand-coral hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none"
                      disabled={formLoading}
                    >
                      {formLoading ? 'Saving...' : showCreateModal ? 'Provision User' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
