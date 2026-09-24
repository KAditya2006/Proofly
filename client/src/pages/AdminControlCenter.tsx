import React, { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { 
  ShieldCheck, 
  Server, 
  Database, 
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  Settings,
  Briefcase,
  Building2,
  FileBarChart,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PremiumLoader } from '../components/PremiumLoader';

export const AdminControlCenter: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [integrity, setIntegrity] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthData, integrityData, jobsData] = await Promise.all([
          systemService.getDetailedHealth().catch(() => null),
          systemService.getIntegrityStatus().catch(() => null),
          systemService.getJobs().catch(() => [])
        ]);
        
        setHealth(healthData);
        setIntegrity(integrityData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Failed to load control center data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 ring-green-500/20';
      case 'DEGRADED':
      case 'RUNNING':
      case 'WARNING':
        return 'text-amber-600 bg-amber-50 ring-amber-500/20';
      case 'UNAVAILABLE':
      case 'FAILED':
      case 'ISSUES_FOUND':
        return 'text-red-600 bg-red-50 ring-red-500/20';
      default:
        return 'text-slate-600 bg-slate-50 ring-slate-500/20';
    }
  };

  if (loading) return (
    <PremiumLoader text="Initializing Control Center..." />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Admin Control Center</h1>
          <p className="page-subtitle mt-1">Platform operations, observability, and integrity</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <Link to="/admin/audit" className="btn-secondary flex items-center">
            <Search className="-ml-0.5 mr-1.5 h-4 w-4" />
            Audit Logs
          </Link>
          <div className="flex items-center space-x-2 text-sm text-slate-500 border-l border-slate-200 pl-4">
            <Server className="h-5 w-5" />
            <span>v{health?.metrics?.version || '1.0.0'}</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link to="/admin/users" className="card p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors mb-3">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-slate-900">Users</span>
        </Link>
        <Link to="/organization" className="card p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors mb-3">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-slate-900">Organizations</span>
        </Link>
        <Link to="/projects" className="card p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors mb-3">
            <Briefcase className="h-5 w-5 text-cyan-600" />
          </div>
          <span className="text-sm font-medium text-slate-900">Projects</span>
        </Link>
        <Link to="/explorer" className="card p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors mb-3">
            <FileBarChart className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-slate-900">Indicators</span>
        </Link>
        <Link to="/admin/settings" className="card p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors mb-3">
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          <span className="text-sm font-medium text-slate-900">Settings</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Health */}
        <div className="card p-6">
          <h2 className="flex items-center text-lg font-medium text-gray-900">
            <Server className="mr-2 h-5 w-5 text-gray-500" />
            System Health
          </h2>
          {health ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Overall Status</span>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(health.status)}`}>
                  {health.status}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-medium text-slate-900">Services</h3>
                <dl className="mt-2 divide-y divide-slate-100">
                  {Object.entries(health.services || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 text-sm">
                      <dt className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                      <dd className={`font-medium ${value === 'HEALTHY' ? 'text-green-600' : 'text-red-600'}`}>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-medium text-slate-900">Metrics</h3>
                <dl className="mt-2 divide-y divide-slate-100">
                  <div className="flex justify-between py-2 text-sm">
                    <dt className="text-slate-500">Memory (RSS)</dt>
                    <dd className="font-medium text-slate-900">{health.metrics?.memory?.rss}</dd>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <dt className="text-slate-500">Uptime</dt>
                    <dd className="font-medium text-slate-900">{Math.floor(health.metrics?.uptimeSeconds / 3600)}h {Math.floor((health.metrics?.uptimeSeconds % 3600) / 60)}m</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-center p-4 text-sm text-red-600">Failed to load health data</div>
          )}
        </div>

        {/* Data Integrity */}
        <div className="card p-6">
          <h2 className="flex items-center text-lg font-medium text-gray-900">
            <ShieldCheck className="mr-2 h-5 w-5 text-gray-500" />
            Data Integrity Monitor
          </h2>
          {integrity ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(integrity.status)}`}>
                  {integrity.status}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="truncate text-sm font-medium text-slate-500">Total Records</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{integrity.metrics?.totalRecords || 0}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="truncate text-sm font-medium text-slate-500 flex items-center">
                      Orphan Records
                      {integrity.metrics?.orphanRecords > 0 && <AlertTriangle className="ml-1 h-4 w-4 text-amber-500" />}
                    </dt>
                    <dd className={`mt-1 text-2xl font-semibold tracking-tight ${integrity.metrics?.orphanRecords > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {integrity.metrics?.orphanRecords || 0}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                    <dt className="truncate text-sm font-medium text-slate-500 flex items-center">
                      Broken Hierarchies
                      {integrity.metrics?.brokenHierarchies > 0 && <AlertTriangle className="ml-1 h-4 w-4 text-red-500" />}
                    </dt>
                    <dd className={`mt-1 text-2xl font-semibold tracking-tight ${integrity.metrics?.brokenHierarchies > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {integrity.metrics?.brokenHierarchies || 0}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-center p-4 text-sm text-red-600">Failed to load integrity data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Background Jobs */}
        <div className="card p-6">
          <h2 className="flex items-center text-lg font-medium text-gray-900 mb-6">
            <Database className="mr-2 h-5 w-5 text-gray-500" />
            Background Jobs
          </h2>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Started</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {jobs.length > 0 ? jobs.map((job) => (
                <tr key={job._id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 font-medium">
                    {job.type.replace('_', ' ')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                    {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Pending'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                    {job.createdBy?.name || 'Unknown'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                    {job.status === 'FAILED' && (
                      <button className="text-brand-navy hover:text-brand-navy flex items-center justify-end">
                        <RefreshCw className="mr-1 h-4 w-4" /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="whitespace-nowrap px-4 py-8 text-center text-sm text-slate-500">
                    No recent background jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Security Alerts (Mocked for Demo) */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center text-lg font-medium text-gray-900">
              <Activity className="mr-2 h-5 w-5 text-gray-500" />
              Security & Threat Alerts
            </h2>
            <Link to="/admin/audit" className="text-sm text-brand-coral hover:text-brand-navy">View All</Link>
          </div>
          <div className="space-y-4">
            <div className="flex p-3 rounded-lg bg-red-50 border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Multiple Failed Logins</p>
                <p className="text-xs text-red-600 mt-1">5 failed attempts for EMP-0105 within 2 minutes. IP: 192.168.1.45</p>
                <p className="text-xs text-red-400 mt-1">10 minutes ago</p>
              </div>
            </div>
            <div className="flex p-3 rounded-lg bg-amber-50 border border-amber-100">
              <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0 mr-3" />
              <div>
                <p className="text-sm font-medium text-amber-800">Unauthorized API Access Blocked</p>
                <p className="text-xs text-amber-600 mt-1">User attempted to access /api/projects bypassing BU scope.</p>
                <p className="text-xs text-amber-400 mt-1">1 hour ago</p>
              </div>
            </div>
            <div className="flex p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Activity className="h-5 w-5 text-slate-500 flex-shrink-0 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-800">New Admin Provisioned</p>
                <p className="text-xs text-slate-500 mt-1">EMP-ADMIN-006 created a new user with ADMIN role.</p>
                <p className="text-xs text-slate-400 mt-1">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
