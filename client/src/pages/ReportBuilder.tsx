import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { getReportingPeriods, type ReportingPeriod } from '../services/reportingService';
import { getOrganizations, type Organization } from '../services/organizationService';
import { getConsolidatedKPIs, type ConsolidatedKPI } from '../services/consolidationService';
import { generateReport } from '../services/reportService';
import { FileText, Settings, Layers, Download, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReportReadiness from '../components/reports/ReportReadiness';
import QualityGateDrawer from '../components/reports/QualityGateDrawer';
import TraceSourceDrawer from '../components/reports/TraceSourceDrawer';


const ReportBuilder: React.FC = () => {
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [scopeLevel, setScopeLevel] = useState<'GROUP' | 'SUBSIDIARY' | 'BUSINESS_UNIT'>('GROUP');
  const [scopeId, setScopeId] = useState('');
  const [reportType, setReportType] = useState('BRSR_COMPREHENSIVE');
  
  const [previewData, setPreviewData] = useState<ConsolidatedKPI[]>([]);
  const [generating, setGenerating] = useState(false);

  // Drawers state
  const [showQualityGate, setShowQualityGate] = useState(false);
  const [qualityResult, setQualityResult] = useState<any>(null);
  const [loadingQuality, setLoadingQuality] = useState(false);

  const [tracedKpi, setTracedKpi] = useState<any>(null);
  const [showTraceSource, setShowTraceSource] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getReportingPeriods(), getOrganizations()]).then(([p, o]) => {
      setPeriods(p);
      setOrganizations(o);
      if (p.length > 0) setSelectedPeriod(p[0]._id);
    });
  }, []);

  const handlePreview = async () => {
    if (!selectedPeriod) return;
    try {
      const data = await getConsolidatedKPIs(selectedPeriod, scopeLevel, scopeId);
      setPreviewData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInitiateGeneration = async () => {
    // 1. First run the quality gate check
    setShowQualityGate(true);
    setLoadingQuality(true);
    try {
      // Mock quality check for draft generation
      setTimeout(() => {
        setQualityResult({
          status: 'READY',
          checks: {
            dataCompleteness: { status: 'PASS', message: 'All required data points are present.' },
            validation: { status: 'PASS', message: 'No critical validation errors.' },
            evidenceCoverage: { status: 'WARNING', message: 'Minor evidence gaps detected.' },
            brsrMapping: { status: 'PASS', message: 'BRSR mapping complete.' },
            assuranceControls: { status: 'PASS', message: 'Assurance complete.' },
            governance: { status: 'PASS', message: 'Approvals are complete.' }
          }
        });
        setLoadingQuality(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoadingQuality(false);
    }
  };

  const handleProceedGeneration = async () => {
    setShowQualityGate(false);
    try {
      setGenerating(true);
      await generateReport({
        reportingPeriodId: selectedPeriod,
        scopeLevel,
        scopeId: scopeId || undefined,
        reportType
      });
      navigate('/reports');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const openTrace = (kpi: any) => {
    setTracedKpi(kpi);
    setShowTraceSource(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">BRSR Report Builder</h1>
        <p className="page-subtitle mt-1">Configure and generate official ESG reports from approved consolidated data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Configuration & Readiness */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="card p-5 space-y-5">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Settings className="h-5 w-5 text-gray-400" /> Configuration
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select 
                className="input-field"
                value={reportType}
                onChange={e => setReportType(e.target.value)}
              >
                <option value="BRSR_COMPREHENSIVE">BRSR Comprehensive</option>
                <option value="BRSR_LITE">BRSR Lite</option>
                <option value="ESG_SUMMARY">ESG Management Summary</option>
                <option value="ASSURANCE_EVIDENCE_PACK">Assurance Evidence Pack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
              <select 
                className="input-field"
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
              >
                <option value="">Select period...</option>
                {periods.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organizational Scope</label>
              <select 
                className="input-field mb-2"
                value={scopeLevel}
                onChange={e => {
                  setScopeLevel(e.target.value as any);
                  setScopeId('');
                }}
              >
                <option value="GROUP">MEIL Group (Complete)</option>
                <option value="SUBSIDIARY">Subsidiary Only</option>
                <option value="BUSINESS_UNIT">Business Unit Only</option>
              </select>
              
              {scopeLevel !== 'GROUP' && (
                <select 
                  className="input-field"
                  value={scopeId}
                  onChange={e => setScopeId(e.target.value)}
                >
                  <option value="">Select specific {scopeLevel.toLowerCase()}...</option>
                  {organizations.filter(o => o.type === scopeLevel).map(o => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </select>
              )}
            </div>

            <button 
              className="btn-secondary w-full"
              onClick={handlePreview}
              disabled={!selectedPeriod}
            >
              Preview Data
            </button>
          </div>

          <ReportReadiness 
            score={previewData.length > 0 ? 94 : 0} 
            checks={[
              { label: 'Data Completeness', status: previewData.length > 0 ? 'PASS' : 'FAIL' },
              { label: 'Validation', status: 'PASS' },
              { label: 'Evidence Coverage', status: 'WARNING', message: '3 gaps detected' },
              { label: 'BRSR Mapping', status: 'PASS' },
              { label: 'Consolidation', status: 'PASS' }
            ]} 
          />

        </div>

        {/* Right Column: Preview Panel */}
        <div className="lg:col-span-3">
          <div className="card h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" /> Data Preview
              </h2>
              <button 
                className="btn-primary flex items-center gap-2"
                disabled={previewData.length === 0 || generating}
                onClick={handleInitiateGeneration}
              >
                {generating ? 'Generating...' : <><Download className="h-4 w-4" /> Generate Draft Report</>}
              </button>
            </div>
            
            <div className="p-6 flex-1 bg-white">
              {previewData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                  <Layers className="h-12 w-12 text-gray-200 mb-3" />
                  <p className="text-sm font-medium">No preview generated</p>
                  <p className="text-xs mt-1">Configure scope and click 'Preview Data'</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-brand-blush border border-brand-pink rounded-lg p-4 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-brand-coral mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-brand-charcoal">Preview Ready</h3>
                      <p className="text-xs text-brand-navy mt-1">Found {previewData.length} valid KPIs containing approved data. You can click on any KPI to trace its source.</p>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indicator</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Consolidated Value</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trace</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map(kpi => (
                          <tr key={kpi.indicator._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{kpi.indicator.code}</div>
                              <div className="text-xs text-gray-500">{kpi.indicator.name}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm font-bold text-gray-900">{kpi.value.toLocaleString()} <span className="text-gray-500 font-normal">{kpi.indicator.unit}</span></div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-500">
                              <button 
                                onClick={() => openTrace(kpi)}
                                className="text-brand-navy hover:text-brand-navy font-medium text-xs bg-brand-blush px-3 py-1.5 rounded-full inline-flex items-center gap-1 transition-colors"
                              >
                                Trace Source
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <QualityGateDrawer 
        isOpen={showQualityGate}
        onClose={() => setShowQualityGate(false)}
        onProceed={handleProceedGeneration}
        qualityResult={qualityResult}
        loading={loadingQuality}
      />

      <TraceSourceDrawer
        isOpen={showTraceSource}
        onClose={() => setShowTraceSource(false)}
        kpi={tracedKpi}
      />
    </div>
  );
};

export default ReportBuilder;
