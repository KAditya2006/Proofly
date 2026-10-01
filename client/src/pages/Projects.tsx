import React, { useEffect, useState } from 'react';
import { getProjects, createProject, type Project } from '../services/projectService';
import { getOrganizations, type Organization } from '../services/organizationService';
import { userService, type User } from '../services/userService';
import { FolderKanban, MapPin, Building2, Search, Filter, X, Plus, Users, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PremiumSelect } from '../components/PremiumSelect';
import { getRecords, type ESGRecord } from '../services/esgRecordService';
import { useNavigate } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availablePOs, setAvailablePOs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectRecords, setProjectRecords] = useState<ESGRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    projectCode: '',
    subsidiaryManagerId: '',
    buReviewerId: '',
    assignedPOs: [] as string[],
    location: '',
    sector: '',
    startDate: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, orgData, usersData] = await Promise.all([
        getProjects(),
        getOrganizations(),
        userService.getUsers()
      ]);
      setProjects(projData);
      setOrganizations(orgData);
      // Store all users in availablePOs (or rename it to just users, but we keep the state name to minimize changes)
      setAvailablePOs(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const fetchRecords = async () => {
        setLoadingRecords(true);
        try {
          const records = await getRecords(1, 100, { projectId: selectedProject._id });
          setProjectRecords(records);
        } catch (error) {
          console.error("Failed to fetch project records:", error);
        } finally {
          setLoadingRecords(false);
        }
      };
      fetchRecords();
    } else {
      setProjectRecords([]);
    }
  }, [selectedProject]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.projectCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eligiblePOs = availablePOs.filter(u => u.role === 'PROJECT_OFFICER');
  const subsidiaryManagers = availablePOs.filter(u => u.role === 'SUBSIDIARY_MANAGER');
  const buReviewers = availablePOs.filter(u => u.role === 'BUSINESS_UNIT_REVIEWER');

  const handleTogglePO = (poId: string) => {
    setFormData(prev => {
      const isSelected = prev.assignedPOs.includes(poId);
      return {
        ...prev,
        assignedPOs: isSelected 
          ? prev.assignedPOs.filter(id => id !== poId)
          : [...prev.assignedPOs, poId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const groupOrg = organizations.find(o => o.type === 'GROUP');
      const allOfficers = [...formData.assignedPOs, formData.subsidiaryManagerId, formData.buReviewerId].filter(Boolean);
      
      await createProject({
        name: formData.name,
        projectCode: formData.projectCode,
        organizationId: groupOrg?._id || '', 
        location: formData.location,
        sector: formData.sector,
        assignedOfficers: allOfficers
      });
      setIsModalOpen(false);
      setFormData({ name: '', projectCode: '', subsidiaryManagerId: '', buReviewerId: '', location: '', sector: '', startDate: '', assignedPOs: [] });
      await fetchData();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/20';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 ring-1 ring-blue-500/20';
      case 'ON_HOLD': return 'bg-amber-100 text-amber-800 ring-1 ring-amber-500/20';
      default: return 'bg-slate-100 text-slate-800 ring-1 ring-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle mt-1">Manage ESG data collection nodes and operational boundaries.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects by name or code..."
            className="input-field pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2 bg-white">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white/50 p-6 rounded-xl border border-white/40 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div 
              key={project._id} 
              onClick={() => setSelectedProject(project)}
              className="card p-5 group flex flex-col h-full bg-white/80 backdrop-blur-md hover:bg-white transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-coral/10 rounded-xl group-hover:bg-brand-coral/20 transition-colors">
                    <FolderKanban className="h-6 w-6 text-brand-coral" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-brand-navy line-clamp-1" title={project.name}>{project.name}</h3>
                    <p className="text-xs text-brand-charcoal/60 font-mono mt-0.5">{project.projectCode}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2 mt-auto text-sm text-brand-charcoal/80 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate" title={project.subsidiaryId?.name || project.organizationId?.name}>
                    {project.businessUnitId?.name || project.subsidiaryId?.name || project.organizationId?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{project.location}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Sector: <span className="font-medium text-slate-700">{project.sector}</span>
                </div>
                <div className="flex -space-x-2">
                  {project.assignedOfficers && project.assignedOfficers.slice(0, 3).map((officer, i) => (
                    <div key={i} className="h-7 w-7 rounded-full bg-brand-navy border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm" title={officer.name || 'Officer'}>
                      {officer.name ? officer.name.charAt(0) : 'O'}
                    </div>
                  ))}
                  {(!project.assignedOfficers || project.assignedOfficers.length === 0) && (
                     <div className="h-7 w-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 shadow-sm" title="Unassigned">
                     -
                   </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Project Card */}
          {user?.role === 'ADMIN' && (
            <div 
              onClick={() => setIsModalOpen(true)}
              className="card p-5 border-2 border-dashed border-slate-200 bg-transparent hover:bg-brand-coral/5 hover:border-brand-coral/30 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] group"
            >
              <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-brand-coral/10 flex items-center justify-center mb-3 transition-colors">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-brand-coral transition-colors" />
              </div>
              <h3 className="font-medium text-slate-600 group-hover:text-brand-navy">Create New Project</h3>
              <p className="text-xs text-slate-400 mt-1 text-center px-4">Register a new facility or operational node</p>
            </div>
          )}
        </div>
      )}

      {/* Premium Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/50 transform transition-all">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
              <h3 className="text-2xl font-serif text-brand-navy font-bold tracking-wide">
                New Project Setup
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-brand-coral hover:bg-brand-blush transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Name *</label>
                    <input 
                      required type="text" 
                      className="w-full bg-gray-50 border border-gray-200 text-brand-navy rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral transition-all placeholder-gray-400" 
                      placeholder="e.g. Solar Plant Alpha"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Code</label>
                    <input 
                      disabled type="text" 
                      className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 cursor-not-allowed font-mono text-sm" 
                      placeholder="Auto-generated on creation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border border-gray-200 text-brand-navy rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral transition-all"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-4">
                    <h4 className="text-lg font-serif font-semibold text-brand-navy border-b border-gray-100 pb-2">Location & Assignments</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subsidiary Manager *</label>
                    <PremiumSelect 
                      options={subsidiaryManagers.map(user => ({ value: user._id, label: `${user.name} (${user.employeeId || 'Sys'})` }))}
                      value={formData.subsidiaryManagerId}
                      onChange={val => setFormData({...formData, subsidiaryManagerId: val})}
                      placeholder="Select Subsidiary Manager..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Unit Reviewer *</label>
                    <PremiumSelect 
                      options={buReviewers.map(user => ({ value: user._id, label: `${user.name} (${user.employeeId || 'Sys'})` }))}
                      value={formData.buReviewerId}
                      onChange={val => setFormData({...formData, buReviewerId: val})}
                      placeholder="Select BU Reviewer..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sector *</label>
                    <PremiumSelect 
                      options={[
                        { value: 'Infrastructure', label: 'Infrastructure' },
                        { value: 'Energy', label: 'Energy' },
                        { value: 'Water', label: 'Water' },
                        { value: 'Manufacturing', label: 'Manufacturing' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      value={formData.sector}
                      onChange={val => setFormData({...formData, sector: val})}
                      placeholder="Select Sector..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location *</label>
                    <input 
                      required type="text" 
                      className="w-full bg-gray-50 border border-gray-200 text-brand-navy rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral transition-all placeholder-gray-400" 
                      placeholder="e.g. Gujarat"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-4">
                    <h4 className="text-lg font-serif font-semibold text-brand-navy border-b border-gray-100 pb-2 mb-4 flex items-center justify-between">
                      <span>Assign Project Officers</span>
                      <span className="text-xs font-sans font-medium text-brand-coral bg-brand-blush px-2 py-1 rounded-full">{formData.assignedPOs.length} Selected</span>
                    </h4>
                    
                    {eligiblePOs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {eligiblePOs.map(po => {
                          const isSelected = formData.assignedPOs.includes(po._id);
                            
                            const isAvailable = true; // Simplified for assigning people directly
                            
                            let newPOsCount = formData.assignedPOs.length;
                            const isBULimitReached = newPOsCount >= 10;
                            const canSelect = isSelected || (!isBULimitReached);

                            return (
                              <div 
                                key={po._id} 
                                onClick={() => canSelect && handleTogglePO(po._id)}
                                className={`p-4 rounded-xl border transition-all ${
                                  isSelected 
                                    ? 'bg-brand-blush/30 border-brand-coral shadow-sm cursor-pointer' 
                                    : canSelect
                                      ? 'bg-white border-gray-200 hover:border-gray-300 cursor-pointer'
                                      : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                } flex items-center justify-between`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-brand-coral text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {po.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className={`font-semibold text-sm ${isSelected ? 'text-brand-navy' : 'text-gray-700'}`}>{po.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{po.email}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isAvailable ? (
                                    <>
                                      <div className="flex items-center gap-1.5 justify-end mb-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Available</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400">Capacity: 0/1</p>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-1.5 justify-end mb-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase">Assigned</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400">Capacity: 1/1 (Full)</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
                          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-600">No Project Officers found</p>
                          <p className="text-xs text-gray-400 mt-1">There are no POs registered in the system.</p>
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-full text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving || !formData.subsidiaryManagerId || !formData.buReviewerId}
                    className="px-8 py-3 rounded-full bg-brand-navy text-white text-sm font-serif tracking-widest uppercase font-semibold hover:bg-brand-coral hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {saving ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white/50 transform transition-all">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-serif text-brand-navy font-bold tracking-wide">
                  {selectedProject.name}
                </h3>
                <p className="text-sm font-mono text-gray-500 mt-1">{selectedProject.projectCode}</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-2 rounded-full text-gray-400 hover:text-brand-coral hover:bg-brand-blush transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-block mt-1 ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sector & Location</p>
                  <p className="text-sm font-medium text-brand-navy">{selectedProject.sector}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {selectedProject.location}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Assigned Personnel</h4>
                <div className="space-y-4">
                  {selectedProject.assignedOfficers && selectedProject.assignedOfficers.length > 0 ? (
                    <>
                      {/* Subsidiary Manager */}
                      {selectedProject.assignedOfficers.filter((o: any) => o.role === 'SUBSIDIARY_MANAGER').map((officer: any) => (
                        <div key={officer._id} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <div className="h-10 w-10 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center font-bold">
                            {officer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-navy">{officer.name}</p>
                            <p className="text-xs text-gray-500 font-mono">Subsidiary Manager</p>
                          </div>
                        </div>
                      ))}

                      {/* BU Reviewer */}
                      {selectedProject.assignedOfficers.filter((o: any) => o.role === 'BUSINESS_UNIT_REVIEWER').map((officer: any) => (
                        <div key={officer._id} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <div className="h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold">
                            {officer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-navy">{officer.name}</p>
                            <p className="text-xs text-gray-500 font-mono">Business Unit Reviewer</p>
                          </div>
                        </div>
                      ))}

                      {/* Project Officers */}
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 font-medium mb-3">Project Officers ({selectedProject.assignedOfficers.filter((o: any) => o.role === 'PROJECT_OFFICER').length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedProject.assignedOfficers.filter((o: any) => o.role === 'PROJECT_OFFICER').map((officer: any) => (
                            <div key={officer._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                                {officer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-brand-navy">{officer.name}</p>
                                <p className="text-[10px] text-gray-500">{officer.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No personnel assigned to this project.</p>
                  )}
                </div>
              </div>

              {/* PROJECT AUDIT TRAIL / RECORDS */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Project Evidence & Billing Status</h4>
                <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                  {loadingRecords ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading audit records...</div>
                  ) : projectRecords.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {projectRecords.map(record => (
                        <div key={record._id} className="p-4 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-bold text-brand-navy">{(record.indicatorId as any)?.name || 'Unknown Task'}</h5>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                record.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                ['SUBMITTED', 'UNDER_REVIEW'].includes(record.status) ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {record.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Updated: {new Date(record.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-4 text-xs font-mono text-gray-500">
                              <p>PO: {record.submittedBy ? 'Submitted' : 'Pending'}</p>
                              <p>BU: {record.approvedBy ? 'Verified' : 'Pending'}</p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => navigate(`/reviews/${record._id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-coral transition-colors shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Bill / Invoice
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center bg-white">
                      <FileText className="h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-500">No submissions found</p>
                      <p className="text-xs text-gray-400 mt-1">Project Officers have not submitted any data for this project yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            <div className="bg-slate-50 px-8 py-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-brand-navy bg-white border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
