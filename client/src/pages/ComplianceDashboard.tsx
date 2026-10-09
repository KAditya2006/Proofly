import React, { useState, useEffect } from 'react';
import { getDisclosures, getComplianceControls } from '../services/complianceService';
import type { BRSRDisclosure, ComplianceControl } from '../services/complianceService';
import { ShieldCheck, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="border-b border-brand-coral/20 pb-6">
        <h1 className="page-title">Audit & Compliance Center</h1>
        <p className="page-subtitle mt-4">Manage regulatory configuration, disclosure registries, and compliance controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Disclosures Registry */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/60 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-brand-coral/20 bg-white/50 flex justify-between items-center">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-3 text-brand-navy" />
              <h3 className="text-xl font-serif font-bold text-brand-navy">BRSR Disclosure Registry</h3>
            </div>
            <span className="text-xs font-bold tracking-widest px-3 py-1 bg-brand-coral text-white rounded-full uppercase">
              {disclosures.length} Registered
            </span>
          </div>
          <div className="p-0 overflow-y-auto max-h-96 flex-1">
            {loading ? (
              <div className="p-8 text-center text-brand-charcoal/60 font-medium">Loading registry...</div>
            ) : disclosures.length === 0 ? (
              <div className="p-8 text-center text-brand-charcoal/60 font-medium">No disclosures configured for the active version.</div>
            ) : (
              <ul className="divide-y divide-brand-coral/10">
                {disclosures.map(d => (
                  <li key={d._id} className="p-6 hover:bg-white/60 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-brand-navy">{d.disclosureId}</span>
                          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded-full ${d.indicatorType === 'ESSENTIAL' ? 'bg-brand-blush text-brand-navy' : 'bg-brand-coral/20 text-brand-coral'}`}>
                            {d.indicatorType}
                          </span>
                        </div>
                        <p className="text-sm text-brand-charcoal/70 mt-2 leading-relaxed">{d.question}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Compliance Control Matrix */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/60 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-brand-coral/20 bg-white/50 flex justify-between items-center">
            <div className="flex items-center">
              <ShieldCheck className="w-5 h-5 mr-3 text-green-600" />
              <h3 className="text-xl font-serif font-bold text-brand-navy">Compliance Control Matrix</h3>
            </div>
          </div>
          <div className="p-0 overflow-y-auto max-h-96 flex-1">
            {loading ? (
              <div className="p-8 text-center text-brand-charcoal/60 font-medium">Loading controls...</div>
            ) : controls.length === 0 ? (
              <div className="p-8 text-center text-brand-charcoal/60 font-medium">No compliance controls defined.</div>
            ) : (
              <ul className="divide-y divide-brand-coral/10">
                {controls.map(c => (
                  <li key={c._id} className="p-6 hover:bg-white/60 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-brand-navy">{c.controlId}: {c.requirement}</p>
                        <p className="text-xs text-brand-charcoal/60 mt-2 leading-relaxed"><span className="font-bold uppercase tracking-wider text-brand-navy">System Control:</span> {c.systemControl}</p>
                        <p className="text-xs text-brand-charcoal/60 mt-1 leading-relaxed"><span className="font-bold uppercase tracking-wider text-brand-navy">Owner:</span> {c.ownerRole}</p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center
                          ${c.status === 'IMPLEMENTED' ? 'bg-green-100 text-green-800' :
                            c.status === 'PARTIALLY_IMPLEMENTED' ? 'bg-orange-100 text-orange-800' :
                            c.status === 'NEEDS_ATTENTION' ? 'bg-brand-coral/20 text-brand-coral' :
                            'bg-gray-100 text-brand-charcoal/70'}`}>
                          {c.status === 'IMPLEMENTED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {c.status === 'PARTIALLY_IMPLEMENTED' && <AlertCircle className="w-3 h-3 mr-1" />}
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
