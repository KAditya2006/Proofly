import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { 
  getOverview, 
  getAnomalies, 
  getTrends
} from '../services/analyticsService';
import { getTasks } from '../services/taskService';
import type { AnalyticsOverview, Anomaly, TrendData } from '../services/analyticsService';
import api from '../services/api';
import TrendChart from '../components/analytics/TrendChart';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [poStats, setPoStats] = useState({ draft: 0, correction: 0, submitted: 0, approved: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch PO specific data first since it doesn't need analytics
        if (user?.role === 'PROJECT_OFFICER') {
          const [recordsRes, projectsData] = await Promise.all([
            api.get('/esg/records?limit=1000'),
            import('../services/projectService').then(m => m.getProjects())
          ]);
          
          const records = recordsRes.data.data || recordsRes.data;
          
          setPoStats({
            draft: records.filter((r: any) => r.status === 'DRAFT').length,
            correction: records.filter((r: any) => ['CORRECTION_REQUIRED', 'VALIDATION_FAILED', 'RETURNED'].includes(r.status)).length,
            submitted: records.filter((r: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
            approved: records.filter((r: any) => r.status === 'APPROVED').length,
          });

          setMyProjects(projectsData);
          
          // Fetch tasks for PO
          const tasksData = await getTasks({ status: 'OPEN', assigneeId: user?._id });
          setMyTasks(tasksData.slice(0, 5));
          
          setLoading(false);
          return;
        }

        // For other roles, fetch analytics in parallel
        const [periodRes, indRes] = await Promise.all([
          api.get('/reporting-periods'),
          api.get('/indicators')
        ]);
        
        const periodsData = periodRes.data;
        setPeriods(periodsData);
        const currentPeriod = periodsData.find((p: any) => p.isCurrent) || periodsData[0];
        
        if (!currentPeriod) {
          setLoading(false);
          return;
        }

        setSelectedPeriod(currentPeriod._id);
        setIndicators(indRes.data);
        
        const defaultInd = indRes.data.length > 0 ? indRes.data[0]._id : '';
        setSelectedIndicator(defaultInd);

        const analyticsPromises = [
          getOverview(currentPeriod._id)
        ];

        if (defaultInd) {
          analyticsPromises.push(getTrends(defaultInd));
          analyticsPromises.push(getAnomalies(defaultInd, currentPeriod._id));
        }

        if (user?.role !== 'AUDITOR') {
          analyticsPromises.push(getTasks({ status: 'OPEN', assigneeId: user?._id }));
        }

        const [overviewData, ...restData] = await Promise.all(analyticsPromises);
        setOverview(overviewData);

        if (defaultInd) {
          setTrends(restData[0]);
          setAnomalies(restData[1]);
          if (user?.role !== 'AUDITOR') {
            setMyTasks(restData[2].slice(0, 5));
          }
        } else if (user?.role !== 'AUDITOR') {
          setMyTasks(restData[0].slice(0, 5));
        }

      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch new trends and anomalies if indicator changes
  useEffect(() => {
    if (selectedIndicator) {
      getTrends(selectedIndicator).then(setTrends).catch(console.error);
      if (selectedPeriod) {
        getAnomalies(selectedIndicator, selectedPeriod).then(setAnomalies).catch(console.error);
      }
    }
  }, [selectedIndicator]);

  // Fetch new overview and anomalies if period changes
  const handlePeriodChange = async (newPeriodId: string) => {
    setSelectedPeriod(newPeriodId);
    try {
      setLoading(true);
      const overviewData = await getOverview(newPeriodId);
      setOverview(overviewData);
      if (selectedIndicator) {
        const anomaliesData = await getAnomalies(selectedIndicator, newPeriodId);
        setAnomalies(anomaliesData);
      }
    } catch (error) {
      console.error('Error fetching period analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-serif">Loading Intelligence...</div>;
  }

  if (user?.role === 'PROJECT_OFFICER') {
    return (
      <div className="space-y-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-8 border-b border-brand-coral/20 pb-6">
          <div>
            <h1 className="page-title">Project Workspace</h1>
            <p className="page-subtitle mt-4 text-lg">Welcome back, <span className="font-semibold text-brand-navy">{user?.name}</span></p>
          </div>
        </div>

        {/* PO Action Required Cards */}
        <div className="bg-white/40 backdrop-blur-md rounded-4xl p-8 border border-white/60 shadow-sm">
          <h3 className="text-xs font-semibold text-brand-coral uppercase tracking-widest mb-8">Data Collection Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Link to="/esg/records?status=DRAFT" className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-3xl text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3">{poStats.draft}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-charcoal/70 mt-1">Pending (Drafts)</span>
              </div>
            </Link>
            
            <Link to="/esg/records?status=CORRECTION_REQUIRED,VALIDATION_FAILED,RETURNED" className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-3xl text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-transparent group-hover:border-brand-coral/30 h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3 text-brand-coral">{poStats.correction}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-coral mt-1">Needs Correction</span>
              </div>
            </Link>

            <Link to="/esg/records?status=SUBMITTED,UNDER_REVIEW" className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-3xl text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3">{poStats.submitted}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-charcoal/70 mt-1">Under Review</span>
              </div>
            </Link>

            <Link to="/esg/records?status=APPROVED" className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-3xl text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3 text-emerald-600">{poStats.approved}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-emerald-700 mt-1">Approved</span>
              </div>
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-brand-coral/20 flex items-center justify-end relative z-10">
            <Link to="/esg/collection" className="bg-brand-coral text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-coral/90 transition-colors flex items-center shadow-md">
              Start Data Entry <ArrowRight className="w-3 h-3 ml-2"/>
            </Link>
          </div>
        </div>

        {/* Assigned Projects Section */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/60 shadow-sm">
          <h3 className="text-2xl font-serif font-bold text-brand-navy mb-6">My Assigned Projects</h3>
          
          {myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map(project => (
                <Link key={project._id} to={`/esg/collection?projectId=${project._id}`} className="block group">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-coral/10 group-hover:shadow-md group-hover:border-brand-coral/30 transition-all cursor-pointer h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-brand-navy text-lg group-hover:text-brand-coral transition-colors">{project.name}</h4>
                        <p className="text-xs font-mono text-gray-500 mt-1">{project.projectCode}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                      <p className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sector</span>
                        <span className="font-medium text-brand-navy">{project.sector}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location</span>
                        <span className="font-medium text-brand-navy">{project.location}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">No projects assigned to you yet.</p>
              <p className="text-xs text-gray-400 mt-1">Projects assigned to you by the Admin will appear here.</p>
            </div>
          )}
        </div>

        {myTasks.length > 0 && (
          <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/60 shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-brand-coral/20 pb-4">
              <h3 className="text-2xl font-serif font-bold text-brand-navy">My Open Tasks</h3>
              <Link to="/tasks" className="text-xs font-bold tracking-wider text-brand-navy hover:text-brand-coral uppercase transition-colors">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTasks.map(task => (
                <div key={task._id} className="p-6 rounded-[1.5rem] bg-white/60 flex flex-col justify-between hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  <div>
                    <h4 className="font-semibold text-brand-navy text-base truncate">{task.title}</h4>
                    <p className="text-sm text-brand-charcoal/60 mt-3 line-clamp-2 leading-relaxed">{task.description}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs font-medium tracking-wide">
                    <span className={`px-3 py-1.5 rounded-full uppercase ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-gray-100/50 text-brand-charcoal/70'}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && <span className="text-brand-charcoal/50">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-8 border-b border-brand-coral/20 pb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle mt-4 text-lg">Welcome back, <span className="font-semibold text-brand-navy">{user?.name}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-brand-charcoal/60 uppercase tracking-widest">Reporting Period</span>
          <select 
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="bg-white/60 border border-brand-coral/30 rounded-xl px-4 py-2 text-sm font-medium text-brand-navy focus:ring-2 focus:ring-brand-coral/20 outline-none hover:bg-white transition-colors"
          >
            {periods.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Readiness Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 flex flex-col justify-between border border-white/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-coral/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <h3 className="text-xs font-semibold text-brand-coral uppercase tracking-widest">BRSR Readiness</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-6xl font-serif font-bold text-brand-navy">{overview?.readiness.overall || 0}%</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-brand-coral/20 flex items-center justify-between relative z-10">
            <span className="text-sm font-medium text-brand-charcoal/70">Overall System Readiness</span>
          </div>
        </div>

        {/* Attention Items */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 lg:col-span-3 border border-white/60 shadow-sm">
          <h3 className="text-xs font-semibold text-brand-coral uppercase tracking-widest mb-8">Attention Required</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Link to={`/esg/records?status=DRAFT${selectedPeriod ? `&periodId=${selectedPeriod}` : ''}`} className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-[1.5rem] text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3 group-hover:text-brand-coral transition-colors">{overview?.attentionRequired.incompleteDisclosures || 0}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-coral mt-1">Incomplete</span>
              </div>
            </Link>
            
            <Link to={`/esg/records?missingEvidence=true${selectedPeriod ? `&periodId=${selectedPeriod}` : ''}`} className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-[1.5rem] text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3 group-hover:text-brand-coral transition-colors">{overview?.attentionRequired.missingEvidence || 0}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-coral mt-1">Missing Evidence</span>
              </div>
            </Link>
            
            <Link to={`/esg/records?status=SUBMITTED${selectedPeriod ? `&periodId=${selectedPeriod}` : ''}`} className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-[1.5rem] text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-transparent group-hover:border-brand-coral/30 h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3 text-brand-coral group-hover:scale-105 transition-transform">{overview?.attentionRequired.pendingApprovals || 0}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-coral mt-1">Pending Approvals</span>
              </div>
            </Link>
            
            <Link to={`/esg/records?status=VALIDATION_FAILED${selectedPeriod ? `&periodId=${selectedPeriod}` : ''}`} className="block group">
              <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-[1.5rem] text-brand-navy group-hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-full cursor-pointer">
                <span className="text-5xl font-serif font-bold mb-3 group-hover:text-brand-coral transition-colors">{overview?.attentionRequired.validationErrors || 0}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-coral mt-1">Validation Errors</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {user?.role !== 'AUDITOR' && myTasks.length > 0 && (
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/60 shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b border-brand-coral/20 pb-4">
            <h3 className="text-2xl font-serif font-bold text-brand-navy">My Open Tasks</h3>
            <Link to="/tasks" className="text-xs font-bold tracking-wider text-brand-navy hover:text-brand-coral uppercase transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTasks.map(task => (
              <div key={task._id} className="p-6 rounded-[1.5rem] bg-white/60 flex flex-col justify-between hover:bg-white transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div>
                  <h4 className="font-semibold text-brand-navy text-base truncate">{task.title}</h4>
                  <p className="text-sm text-brand-charcoal/60 mt-3 line-clamp-2 leading-relaxed">{task.description}</p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-medium tracking-wide">
                  <span className={`px-3 py-1.5 rounded-full uppercase ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-gray-100/50 text-brand-charcoal/70'}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && <span className="text-brand-charcoal/50">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Area */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 lg:col-span-2 flex flex-col border border-white/60 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4 border-b border-brand-coral/20 pb-6">
            <h3 className="text-2xl font-serif font-bold text-brand-navy">ESG Performance Trends</h3>
            <select 
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="bg-transparent border-b-[1.5px] border-brand-coral text-brand-navy focus:ring-0 focus:border-brand-navy text-sm py-2 px-0 min-w-[200px]"
            >
              {indicators.map(ind => (
                <option key={ind._id} value={ind._id}>{ind.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            <TrendChart 
              data={trends} 
              unit={indicators.find(i => i._id === selectedIndicator)?.unit || ''} 
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Link to="/explorer" className="text-xs font-bold tracking-wider text-brand-navy hover:text-brand-coral flex items-center transition-colors uppercase">
              Open Indicator Explorer <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Anomalies / Alerts */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-8 flex flex-col border border-white/60 shadow-sm">
          <h3 className="text-2xl font-serif font-bold text-brand-navy border-b border-brand-coral/20 pb-6 mb-8">Detected Anomalies</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {anomalies.length === 0 ? (
              <div className="text-sm text-brand-charcoal/50 font-serif text-center py-12">
                No significant anomalies detected.
              </div>
            ) : (
              anomalies.map((anomaly, idx) => (
                <div key={idx} className={`p-5 rounded-[1.5rem] text-sm flex items-start transition-colors ${
                  anomaly.type === 'SPIKE' ? 'bg-amber-50/50 text-brand-charcoal' : 'bg-brand-blush/80 text-brand-charcoal'
                }`}>
                  {anomaly.type === 'SPIKE' ? <TrendingUp className="w-5 h-5 mr-3 mt-0.5 text-amber-500" /> : <TrendingDown className="w-5 h-5 mr-3 mt-0.5 text-brand-coral" />}
                  <span className="leading-relaxed">{anomaly.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
