import React, { useState, useEffect } from 'react';
import { getDisclosures, getComplianceControls } from '../services/complianceService';
import type { BRSRDisclosure, ComplianceControl } from '../services/complianceService';
import { ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';

const ComplianceDashboard: React.FC = () => {
  const [disclosures, setDisclosures] = useState<BRSRDisclosure[]>([]);
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedDisclosures = await getDisclosures();
      const fetchedControls = await getComplianceControls();
      setDisclosures(fetchedDisclosures);
      setControls(fetchedControls);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Audit & Compliance Center</h1>
        <p className="text-gray-500 text-sm mt-1">Manage regulatory configuration, disclosure registries, and compliance controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disclosures Registry */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-brand-navy" />
              <h3 className="font-medium text-gray-900">BRSR Disclosure Registry</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-brand-blush text-brand-navy rounded-full">
              {disclosures.length} Registered
            </span>
          </div>
          <div className="p-0 overflow-y-auto max-h-96">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading registry...</div>
            ) : disclosures.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No disclosures configured for the active version.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {disclosures.map(d => (
                  <li key={d._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">{d.disclosureId}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${d.indicatorType === 'ESSENTIAL' ? 'bg-brand-pink text-brand-charcoal' : 'bg-purple-100 text-purple-800'}`}>
                            {d.indicatorType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mt-1">{d.question}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Compliance Control Matrix */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
              <h3 className="font-medium text-gray-900">Compliance Control Matrix</h3>
            </div>
          </div>
          <div className="p-0 overflow-y-auto max-h-96">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading controls...</div>
            ) : controls.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No compliance controls defined.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {controls.map(c => (
                  <li key={c._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{c.controlId}: {c.requirement}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-medium">System Control:</span> {c.systemControl}</p>
                        <p className="text-xs text-gray-500"><span className="font-medium">Owner:</span> {c.ownerRole}</p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full flex items-center
                          ${c.status === 'IMPLEMENTED' ? 'bg-green-100 text-green-800' :
                            c.status === 'PARTIALLY_IMPLEMENTED' ? 'bg-yellow-100 text-yellow-800' :
                            c.status === 'NEEDS_ATTENTION' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {c.status === 'NEEDS_ATTENTION' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
