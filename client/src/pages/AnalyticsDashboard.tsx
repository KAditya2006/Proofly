import React, { useState, useEffect } from 'react';
import { getReportingPeriods, type ReportingPeriod } from '../services/reportingService';
import { getConsolidatedKPIs, getReadiness, type ConsolidatedKPI, type ReadinessMetrics } from '../services/consolidationService';
import { getOrganizations, type Organization } from '../services/organizationService';
import { BarChart3, AlertTriangle, Layers, Target, ChevronRight, Activity, Calendar } from 'lucide-react';
import LineageDrawer from '../components/LineageDrawer';
import { useAuth } from '../context/AuthContext';
import { PremiumLoader } from '../components/PremiumLoader';
import { CircularProgress } from '../components/CircularProgress';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { FileDown, FileText as FilePdf } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  
  // Org selection for drilling down visually on the dashboard
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [scopeLevel, setScopeLevel] = useState<'GROUP' | 'SUBSIDIARY' | 'BUSINESS_UNIT'>('GROUP');
  const [scopeId, setScopeId] = useState<string>('');
  
  const [kpis, setKpis] = useState<ConsolidatedKPI[]>([]);
  const [readiness, setReadiness] = useState<ReadinessMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Lineage Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Initial data fetch
    Promise.all([
      getReportingPeriods(),
      getOrganizations()
    ]).then(([periodsData, orgsData]) => {
      setPeriods(periodsData);
      setOrganizations(orgsData);
      
      const activePeriod = periodsData.find(p => p.status === 'OPEN')?._id || periodsData[0]?._id;
      if (activePeriod) setSelectedPeriod(activePeriod);

      // Force scope based on RBAC if not admin/group
      if (user?.role === 'SUBSIDIARY_MANAGER') {
        setScopeLevel('SUBSIDIARY');
        setScopeId(typeof user.organizationId === 'string' ? user.organizationId : (user.organizationId as any)._id);
      } else if (user?.role === 'BUSINESS_UNIT_REVIEWER') {
        setScopeLevel('BUSINESS_UNIT');
        setScopeId(typeof user.organizationId === 'string' ? user.organizationId : (user.organizationId as any)._id);
      }
    });
  }, [user]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchDashboardData();
    }
  }, [selectedPeriod, scopeLevel, scopeId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiData, readinessData] = await Promise.all([
        getConsolidatedKPIs(selectedPeriod, scopeLevel, scopeId),
        // Readiness is always calculated at the group level for the period currently
        getReadiness(selectedPeriod)
      ]);
      setKpis(kpiData);
      setReadiness(readinessData);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiClick = (indicatorId: string, indicatorName: string) => {
    setSelectedIndicator({ id: indicatorId, name: indicatorName });
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-brand-coral/20 pb-6 mb-8">
        <div>
          <h1 className="hollow-heading text-6xl text-left">ESG Analytics</h1>
          <p className="page-subtitle mt-4 text-lg">Consolidated ESG performance and reporting readiness.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md p-3 rounded-full border border-white/60 shadow-sm px-4">
            <Calendar className="h-5 w-5 text-brand-coral/70" strokeWidth={1.5} />
            <select 
              className="bg-transparent text-sm font-semibold text-brand-navy outline-none cursor-pointer tracking-wider uppercase"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periods.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md p-2 rounded-full border border-white/60 shadow-sm">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center p-2 rounded-full bg-white text-brand-navy hover:text-brand-coral hover:bg-brand-coral/10 transition-colors shadow-sm"
              title="Export as PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button 
              onClick={() => {
                if (!kpis.length) return;
                
                // Format for excel
                const exportData = kpis.map(k => ({
                  'Indicator Code': k.indicator.code,
                  'Indicator Name': k.indicator.name,
                  'Category': k.indicator.category,
                  'Value': k.value,
                  'Unit': k.indicator.unit,
                  'Reporting Period': periods.find(p => p._id === selectedPeriod)?.name || selectedPeriod
                }));
                
                exportToExcel(exportData, 'Proofly_Analytics_Export');
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 transition-colors shadow-sm text-xs font-bold uppercase tracking-wider"
              title="Export as Excel"
            >
              <FileDown className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button 
              onClick={() => {
                exportToPDF('dashboard-export-area', 'Proofly_Analytics_Report');
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20 transition-colors shadow-sm text-xs font-bold uppercase tracking-wider"
              title="Export as PDF"
            >
              <FilePdf className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>

          {(user?.role === 'ADMIN' || user?.role === 'GROUP_ESG_TEAM') && (
            <div className="flex items-center gap-2 px-4">
              <Layers className="h-5 w-5 text-brand-coral/70" strokeWidth={1.5} />
              <select 
                className="bg-transparent text-sm font-semibold text-brand-navy outline-none cursor-pointer tracking-wider uppercase max-w-[180px] truncate"
                value={scopeId}
                onChange={(e) => {
                  const val = e.target.value;
                  setScopeId(val);
                  if (!val) setScopeLevel('GROUP');
                  else {
                    const org = organizations.find(o => o._id === val);
                    if (org) setScopeLevel(org.type as any);
                  }
                }}
              >
                <option value="">MEIL Group (All)</option>
                <optgroup label="Subsidiaries">
                  {organizations.filter(o => o.type === 'SUBSIDIARY').map(o => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <PremiumLoader text="Aggregating data..." />
      ) : (
        <div id="dashboard-export-area" className="space-y-6">
          {/* Readiness Engine Summary */}
          {readiness && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-[2rem] p-8 bg-gradient-to-br from-brand-navy via-[#1f3045] to-[#0e1622] text-white flex flex-col justify-center text-center shadow-[0_15px_40px_-15px_rgba(20,30,45,0.7)] relative overflow-hidden group border border-white/10 backdrop-blur-xl">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-coral/20 rounded-full blur-[80px] mix-blend-screen transition-transform duration-1000 group-hover:scale-150"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] mix-blend-screen transition-transform duration-1000 group-hover:scale-150"></div>
                
                <h3 className="text-white/70 text-xs font-bold uppercase tracking-[0.3em] mb-8 relative z-10">System Readiness</h3>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="text-8xl font-serif font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 drop-shadow-sm">
                    {readiness.overall}<span className="text-4xl text-white/50 ml-1">%</span>
                  </div>
                  <div className="h-1.5 w-24 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-coral to-pink-500 rounded-full" style={{ width: `${readiness.overall}%` }}></div>
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed font-medium mt-8 relative z-10 max-w-xs mx-auto">Calculated in real-time from data completeness, validation status, and audit trails.</p>
              </div>
              
              <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: "Data Covered", value: readiness.dataCompleteness, missing: readiness.breakdown.missingData, missingLabel: "missing", color: "text-blue-500" },
                  { label: "Evidence", value: readiness.evidenceCoverage, missing: readiness.breakdown.missingEvidence, missingLabel: "missing", color: "text-brand-coral" },
                  { label: "Approvals", value: readiness.approval, missing: readiness.breakdown.pendingApproval, missingLabel: "pending", color: "text-green-500" },
                  { label: "BRSR Mapped", value: readiness.mapping, missing: readiness.breakdown.missingMapping, missingLabel: "unmapped", color: "text-purple-500" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg rounded-[2rem] p-6 flex flex-col items-center justify-center hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    <CircularProgress 
                      value={stat.value} 
                      size={90} 
                      strokeWidth={8} 
                      color={stat.color} 
                      trackColor="text-white/60"
                      className="mb-4 drop-shadow-sm"
                      label={`${stat.value}%`}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand-navy/80 text-center leading-tight mb-2">{stat.label}</span>
                    
                    {stat.missing > 0 ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 flex items-center bg-amber-100/50 px-2 py-1 rounded-full"><AlertTriangle className="h-3 w-3 mr-1"/> {stat.missing} {stat.missingLabel}</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center bg-green-100/50 px-2 py-1 rounded-full">Perfect</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consolidated KPIs Grid */}
          <div className="space-y-8 mt-12">
            <h2 className="text-2xl font-serif font-bold text-brand-navy flex items-center gap-3">
              <Activity className="h-6 w-6 text-brand-coral" strokeWidth={2} />
              Consolidated Performance ({scopeLevel})
            </h2>
            
            {kpis.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-16 text-center border border-white/60 shadow-sm">
                <div className="h-24 w-24 rounded-full bg-white/60 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <BarChart3 className="h-10 w-10 text-brand-coral/50" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-serif font-bold text-brand-navy">No approved data found</h3>
                <p className="text-sm text-brand-charcoal/50 mt-3 max-w-sm mx-auto leading-relaxed">There are no approved records for the selected reporting period and scope.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {kpis.map((kpi) => (
                  <div 
                    key={kpi.indicator._id} 
                    className="relative bg-white/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/70 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 cursor-pointer group overflow-hidden"
                    onClick={() => handleKpiClick(kpi.indicator._id, kpi.indicator.name)}
                  >
                    <div className="absolute -right-16 -top-16 w-32 h-32 bg-brand-coral/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-brand-navy bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4 inline-block uppercase tracking-widest shadow-sm border border-brand-coral/20">
                          {kpi.indicator.code}
                        </span>
                        <h3 className="text-base font-semibold text-brand-navy line-clamp-2 leading-relaxed pr-4" title={kpi.indicator.name}>
                          {kpi.indicator.name}
                        </h3>
                      </div>
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-brand-navy to-[#1f3045] flex items-center justify-center shadow-md group-hover:rotate-45 group-hover:scale-110 transition-all duration-300">
                        <ChevronRight className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex items-baseline gap-3 mt-4">
                      <span className="text-6xl font-serif font-black tracking-tighter text-brand-navy drop-shadow-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-navy group-hover:to-brand-coral transition-all duration-500">{kpi.value.toLocaleString()}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-coral/80">{kpi.indicator.unit}</span>
                    </div>
                    
                    <div className="relative z-10 mt-8 pt-6 border-t border-brand-charcoal/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/60">
                      <span className="flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-brand-coral" strokeWidth={2} /> {kpi.indicator.aggregationMethod}
                      </span>
                      <span className="bg-white/50 px-3 py-1 rounded-full shadow-inner">{kpi.contributorsCount} Sources</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lineage Drawer */}
      {drawerOpen && selectedIndicator && (
        <LineageDrawer 
          indicatorId={selectedIndicator.id}
          indicatorName={selectedIndicator.name}
          reportingPeriodId={selectedPeriod}
          scopeLevel={scopeLevel}
          scopeId={scopeId}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
