import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Network, Users, Building2, Layers, Briefcase, ChevronRight, UserCircle2 } from 'lucide-react';

interface UserInfo {
  _id: string;
  name: string;
  role: string;
  email: string;
  employeeId: string;
}

interface OrgInfo {
  _id: string;
  name: string;
  type: string;
  code: string;
  users: UserInfo[];
}

interface NetworkData {
  me: UserInfo;
  organization: OrgInfo;
  parents: OrgInfo[];
  descendants: OrgInfo[];
}

const MyNetwork: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const response = await api.get('/organizations/my-network');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch network:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'GROUP': return <Building2 className="text-brand-navy" />;
      case 'SUBSIDIARY': return <Layers className="text-brand-coral" />;
      case 'BUSINESS_UNIT': return <Briefcase className="text-brand-teal" />;
      default: return <Building2 />;
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8">No organization data found for your account.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Organizational Network</h1>
        <p className="text-gray-500 text-sm mt-1">View your reporting hierarchy, parent entities, and subordinates.</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Superior Orgs */}
        {data.parents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center space-x-2">
              <ChevronRight size={18} />
              <span>Reporting To (Upward Hierarchy)</span>
            </h3>
            {data.parents.map((parent, idx) => (
              <div key={parent._id} className="bg-white/60 backdrop-blur-xl border border-white/40 p-6 rounded-4xl shadow-sm ml-4 relative">
                {idx !== data.parents.length - 1 && (
                  <div className="absolute left-10 top-full h-6 w-0.5 bg-gray-300 z-0"></div>
                )}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                      {getOrgIcon(parent.type)}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-brand-navy">{parent.name}</h4>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{parent.type} • {parent.code}</p>
                    </div>
                  </div>
                </div>
                
                {parent.users.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200/50">
                    <h5 className="text-sm font-semibold text-gray-600 mb-3 flex items-center space-x-2">
                      <Users size={16} /> <span>Key Personnel</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parent.users.map(u => (
                        <div key={u._id} className="flex items-center space-x-3 bg-white/50 p-3 rounded-2xl">
                          <UserCircle2 size={32} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-500">{formatRole(u.role)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Connection Line to My Org */}
            <div className="ml-14 h-8 w-0.5 bg-brand-coral/50"></div>
          </div>
        )}

        {/* My Org */}
        <div>
          <div className="bg-gradient-to-br from-brand-navy to-slate-900 border-none p-1 rounded-4xl shadow-xl transform scale-[1.02]">
            <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[23px]">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-brand-coral text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Your Organization
                </span>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-brand-navy/5 rounded-3xl">
                    {getOrgIcon(data.organization.type)}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-brand-navy">{data.organization.name}</h4>
                    <p className="text-sm font-semibold text-brand-coral uppercase tracking-wider">{data.organization.type} • {data.organization.code}</p>
                  </div>
                </div>
              </div>

              {/* My Peers & Me */}
              <div className="mt-8">
                <h5 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-widest flex items-center space-x-2">
                  <Network size={16} /> <span>Your Team</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Me */}
                  <div className="flex items-center space-x-3 bg-brand-teal/10 border border-brand-teal/20 p-4 rounded-3xl">
                    <UserCircle2 size={36} className="text-brand-teal" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{data.me.name} (You)</p>
                      <p className="text-xs font-medium text-brand-teal">{formatRole(data.me.role)}</p>
                    </div>
                  </div>
                  {/* Peers */}
                  {data.organization.users.map(u => (
                    <div key={u._id} className="flex items-center space-x-3 bg-gray-50 border border-gray-100 p-4 rounded-3xl">
                      <UserCircle2 size={36} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{formatRole(u.role)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subordinate Orgs */}
        {data.descendants.length > 0 && (
          <div className="space-y-6">
            <div className="ml-14 h-8 w-0.5 bg-brand-coral/50"></div>
            <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center space-x-2">
              <ChevronRight size={18} />
              <span>Subordinate Entities (Downward Hierarchy)</span>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-4 border-l-2 border-gray-200">
              {data.descendants.map(child => (
                <div key={child._id} className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-4xl shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="absolute -left-[18px] top-8 w-4 h-0.5 bg-gray-200"></div>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      {getOrgIcon(child.type)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{child.name}</h4>
                      <p className="text-xs font-semibold text-gray-500 uppercase">{child.type}</p>
                    </div>
                  </div>

                  {child.users.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {child.users.map(u => (
                        <div key={u._id} className="flex items-center space-x-3 bg-white/70 p-2.5 rounded-2xl">
                          <UserCircle2 size={24} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-bold text-gray-700">{u.name}</p>
                            <p className="text-xs text-gray-500">{formatRole(u.role)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-4">No active personnel assigned.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyNetwork;
