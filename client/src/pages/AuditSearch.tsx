import React, { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';
import { 
  Filter,
  Download,
  Calendar,
  User,
  Activity
} from 'lucide-react';

export const AuditSearch: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">Audit Log Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">Search and review system activity for compliance</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Download className="-ml-0.5 mr-1.5 h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-50">
              <label htmlFor="action" className="block text-xs font-medium text-slate-700">Action Type</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="action"
                  id="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="e.g. RECORD_CREATED"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-37.5">
              <label htmlFor="entityType" className="block text-xs font-medium text-slate-700">Entity Type</label>
              <select
                name="entityType"
                id="entityType"
                value={filters.entityType}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Entities</option>
                <option value="ESGRecord">ESG Record</option>
                <option value="Report">Report</option>
                <option value="User">User</option>
                <option value="ReportingPeriod">Reporting Period</option>
              </select>
            </div>

            <div className="flex-1 min-w-37.5">
              <label htmlFor="startDate" className="block text-xs font-medium text-slate-700">Start Date</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-brand-navy px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Filter className="-ml-0.5 mr-1.5 h-4 w-4" />
                Filter Results
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entity</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900 font-medium flex items-center">
                      <User className="mr-1.5 h-4 w-4 text-slate-400" />
                      {log.userId?.name || 'System'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {log.entityType} <span className="text-xs text-slate-400">({log.entityId.substring(0, 8)}...)</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate" title={JSON.stringify(log.after)}>
                      {JSON.stringify(log.after)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
