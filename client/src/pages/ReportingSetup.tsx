import React, { useEffect, useState } from 'react';
import { getReportingPeriods, type ReportingPeriod } from '../services/reportingService';
import { Calendar } from 'lucide-react';

const ReportingSetupPage: React.FC = () => {
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const data = await getReportingPeriods();
        setPeriods(data);
      } catch (error) {
        console.error('Error fetching reporting periods:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPeriods();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-navy">Reporting Setup</h1>
          <p className="mt-1 text-sm text-gray-500">Configure financial years and reporting boundaries.</p>
        </div>
        <button className="btn-primary">New Period</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Year
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                    Loading reporting periods...
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                    No reporting periods configured.
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period._id} className={period.isCurrent ? "bg-brand-blush/30" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {period.name}
                            {period.isCurrent && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-brand-pink text-brand-charcoal">Current</span>}
                          </div>
                          <div className="text-sm text-gray-500">{period.financialYear}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        period.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {period.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-brand-navy hover:text-brand-navy mr-4">Edit</button>
                      {period.status === 'OPEN' && (
                        <button className="text-amber-600 hover:text-amber-900">Close</button>
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

export default ReportingSetupPage;
