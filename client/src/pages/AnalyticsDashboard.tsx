import React, { useState, useEffect } from 'react';
import { getReportingPeriods, type ReportingPeriod } from '../services/reportingService';
import { getConsolidatedKPIs, getReadiness, type ConsolidatedKPI, type ReadinessMetrics } from '../services/consolidationService';
import { getOrganizations, type Organization } from '../services/organizationService';
import { BarChart3, AlertTriangle, Layers, Target, ChevronRight, Activity, Calendar } from 'lucide-react';
import LineageDrawer from '../components/LineageDrawer';
import { useAuth } from '../context/AuthContext';
import { PremiumLoader } from '../components/PremiumLoader';

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
        setScopeId(user.organizationId);
      } else if (user?.role === 'BUSINESS_UNIT_REVIEWER') {
        setScopeLevel('BUSINESS_UNIT');
        setScopeId(user.organizationId);
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
        
        <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md p-3 rounded-full border border-white/60 shadow-sm">
          <div className="flex items-center gap-2 px-4 border-r border-brand-coral/20">
            <Calendar className="h-5 w-5 text-brand-coral/70" strokeWidth={1.5} />
            <select 
              className="bg-transparent text-sm font-semibold text-brand-navy outline-none cursor-pointer tracking-wider uppercase"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periods.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
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
        <>
          {/* Readiness Engine Summary */}
          {readiness && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 rounded-[2rem] p-8 bg-brand-navy text-white flex flex-col justify-center text-center sm:text-left shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
                <h3 className="text-brand-coral text-[10px] font-bold uppercase tracking-[0.2em] mb-4">BRSR Readiness Score</h3>
                <div className="text-6xl font-serif font-bold mb-6">{readiness.overall}%</div>
                <div className="w-full bg-white/10 rounded-full h-1 mb-4 overflow-hidden">
                  <div className="bg-brand-coral h-1 rounded-full transition-all duration-1000" style={{ width: `${readiness.overall}%` }}></div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-medium">Dynamically calculated from data completeness, validation, and approvals.</p>
              </div>
              
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-[1.5rem] p-6 flex flex-col justify-between hover:bg-white/60 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/50">Data Covered</span>
                      <span className="text-sm font-bold text-brand-navy">{readiness.dataCompleteness}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-1.5 mb-4 shadow-inner overflow-hidden">
                      <div className="bg-brand-coral h-1.5 rounded-full" style={{ width: `${readiness.dataCompleteness}%` }}></div>
                    </div>
                  </div>
                  {readiness.breakdown.missingData > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center mt-2"><AlertTriangle className="h-3 w-3 mr-1"/> {readiness.breakdown.missingData} missing</span>
                  )}
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-[1.5rem] p-6 flex flex-col justify-between hover:bg-white/60 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/50">Evidence</span>
                      <span className="text-sm font-bold text-brand-navy">{readiness.evidenceCoverage}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-1.5 mb-4 shadow-inner overflow-hidden">
                      <div className="bg-brand-coral h-1.5 rounded-full" style={{ width: `${readiness.evidenceCoverage}%` }}></div>
                    </div>
                  </div>
                  {readiness.breakdown.missingEvidence > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center mt-2"><AlertTriangle className="h-3 w-3 mr-1"/> {readiness.breakdown.missingEvidence} missing</span>
                  )}
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-[1.5rem] p-6 flex flex-col justify-between hover:bg-white/60 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/50">Approval Status</span>
                      <span className="text-sm font-bold text-brand-navy">{readiness.approval}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-1.5 mb-4 shadow-inner overflow-hidden">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${readiness.approval}%` }}></div>
                    </div>
                  </div>
                  {readiness.breakdown.pendingApproval > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center mt-2"><AlertTriangle className="h-3 w-3 mr-1"/> {readiness.breakdown.pendingApproval} pending</span>
                  )}
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-[1.5rem] p-6 flex flex-col justify-between hover:bg-white/60 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/50">BRSR Mapped</span>
                      <span className="text-sm font-bold text-brand-navy">{readiness.mapping}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-1.5 mb-4 shadow-inner overflow-hidden">
                      <div className="bg-brand-coral h-1.5 rounded-full" style={{ width: `${readiness.mapping}%` }}></div>
                    </div>
                  </div>
                  {readiness.breakdown.missingMapping > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center mt-2"><AlertTriangle className="h-3 w-3 mr-1"/> {readiness.breakdown.missingMapping} unmapped</span>
                  )}
                </div>
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
                    className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:bg-white/80 transition-all cursor-pointer group"
                    onClick={() => handleKpiClick(kpi.indicator._id, kpi.indicator.name)}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-brand-navy bg-white px-3 py-1.5 rounded-full mb-4 inline-block uppercase tracking-widest shadow-sm border border-brand-coral/10">
                          {kpi.indicator.code}
                        </span>
                        <h3 className="text-base font-semibold text-brand-navy line-clamp-2 leading-relaxed pr-4" title={kpi.indicator.name}>
                          {kpi.indicator.name}
                        </h3>
                      </div>
                      <div className="h-10 w-10 shrink-0 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <ChevronRight className="h-5 w-5 text-brand-coral" strokeWidth={2} />
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-serif font-bold text-brand-navy">{kpi.value.toLocaleString()}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">{kpi.indicator.unit}</span>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-brand-coral/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/50">
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-brand-coral/70" strokeWidth={2} /> {kpi.indicator.aggregationMethod}
                      </span>
                      <span>{kpi.contributorsCount} Sources</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
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
