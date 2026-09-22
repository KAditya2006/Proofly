import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ValueChainDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const periodId = '66e138a0c20a9a139a045330'; // Replace with dynamic period selection

  useEffect(() => {
    const fetchVC = async () => {
      try {
        const response = await api.get(`/value-chain/dashboard?reportingPeriodId=${periodId}`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching Value Chain data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVC();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading Value Chain partners...</div>
      </div>
    );
  }

  if (!data || !data.partners || data.partners.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-serif font-semibold text-brand-navy mb-2">Value Chain Management</h1>
        <p className="text-gray-500 mb-6">No Value Chain partners have been invited yet.</p>
        <button className="bg-brand-navy text-white px-4 py-2 rounded-md hover:bg-[#111e2e] text-sm font-medium transition-colors">
          + Add Partner
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-navy">Value Chain</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track external partner ESG disclosures.</p>
        </div>
        <button className="bg-brand-navy text-white px-4 py-2 rounded-md hover:bg-[#111e2e] text-sm font-medium transition-colors shadow-sm">
          + Invite Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-3xl font-bold text-gray-900">{data.metrics.total}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Total Partners</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-3xl font-bold text-yellow-600">{data.metrics.requested}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Data Requested</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-3xl font-bold text-brand-navy">{data.metrics.submitted}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Submitted / Under Review</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 flex flex-col justify-center">
          <div className="text-3xl font-bold text-green-700">{data.metrics.coverage}%</div>
          <div className="text-xs text-green-700 font-medium uppercase tracking-wide mt-1">Approved Coverage</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Partner Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.partners.map((partner: any) => (
                <tr key={partner._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {partner.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {partner.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      partner.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      partner.status === 'DATA_SUBMITTED' ? 'bg-brand-pink text-brand-charcoal' :
                      partner.status === 'DATA_REQUESTED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-brand-navy hover:text-brand-navy transition-colors">View Data</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
