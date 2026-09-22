import React, { useEffect, useState } from 'react';
import { getIndicators, type ESGIndicator } from '../services/indicatorService';
import { Leaf, Users, Shield, Search } from 'lucide-react';

const ESGHubPage: React.FC = () => {
  const [indicators, setIndicators] = useState<ESGIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ENVIRONMENT' | 'SOCIAL' | 'GOVERNANCE'>('ENVIRONMENT');

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const data = await getIndicators();
        setIndicators(data);
      } catch (err: any) {
        console.error('Error fetching indicators:', err);
        setError('Failed to load ESG indicators. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchIndicators();
  }, []);

  const filteredIndicators = indicators.filter(ind => 
    ind.category === activeTab &&
    (ind.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     ind.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-navy">ESG Data Hub</h1>
          <p className="mt-1 text-sm text-gray-500">Master configuration of ESG indicators and parameters.</p>
        </div>
        <button className="btn-primary">Add Indicator</button>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('ENVIRONMENT')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'ENVIRONMENT'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Leaf className="h-4 w-4" /> Environment
            </button>
            <button
              onClick={() => setActiveTab('SOCIAL')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'SOCIAL'
                  ? 'border-blue-500 text-brand-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" /> Social
            </button>
            <button
              onClick={() => setActiveTab('GOVERNANCE')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'GOVERNANCE'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4" /> Governance
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} indicators...`}
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indicator Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mandatory</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    Loading indicators...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredIndicators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No indicators found for this category.
                  </td>
                </tr>
              ) : (
                filteredIndicators.map((indicator) => (
                  <tr key={indicator._id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {indicator.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{indicator.name}</div>
                      <div className="text-xs text-gray-500">{indicator.dataType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {indicator.subcategory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {indicator.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {indicator.isMandatory ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Yes</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ESGHubPage;
