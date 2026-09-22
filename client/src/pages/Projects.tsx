import React, { useEffect, useState } from 'react';
import { getProjects, createProject, type Project } from '../services/projectService';
import { getOrganizations, type Organization } from '../services/organizationService';
import { FolderKanban, MapPin, Building2, Search, Filter, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    projectCode: '',
    organizationId: '',
    location: '',
    sector: '',
    startDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, orgData] = await Promise.all([
        getProjects(),
        getOrganizations()
      ]);
      setProjects(projData);
      setOrganizations(orgData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.projectCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createProject({
        name: formData.name,
        projectCode: formData.projectCode,
        organizationId: formData.organizationId,
        location: formData.location,
        sector: formData.sector
      });
      setIsModalOpen(false);
      setFormData({ name: '', projectCode: '', organizationId: '', location: '', sector: '', startDate: '' });
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
            <div key={project._id} className="card p-5 group flex flex-col h-full bg-white/80 backdrop-blur-md hover:bg-white transition-all duration-300">
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-brand-navy/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-brand-coral hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-brand-navy">New Project Setup</h2>
              <p className="text-sm text-slate-500 mt-1">Register a new project or facility for ESG tracking.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">Project Name *</label>
                <input 
                  required type="text" 
                  className="input-field bg-white/50" 
                  placeholder="e.g. Solar Plant Alpha"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Project Code *</label>
                  <input 
                    required type="text" 
                    className="input-field bg-white/50" 
                    placeholder="e.g. P-008"
                    value={formData.projectCode}
                    onChange={e => setFormData({...formData, projectCode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Start Date</label>
                  <input 
                    type="date" 
                    className="input-field bg-white/50"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">Organization Node *</label>
                <select 
                  required 
                  className="input-field bg-white/50"
                  value={formData.organizationId}
                  onChange={e => setFormData({...formData, organizationId: e.target.value})}
                >
                  <option value="">Select BU or Subsidiary...</option>
                  {organizations.map(org => (
                    <option key={org._id} value={org._id}>{org.name} ({org.type.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Location *</label>
                  <input 
                    required type="text" 
                    className="input-field bg-white/50" 
                    placeholder="e.g. Gujarat"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Sector *</label>
                  <select 
                    required 
                    className="input-field bg-white/50"
                    value={formData.sector}
                    onChange={e => setFormData({...formData, sector: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Energy">Energy</option>
                    <option value="Water">Water</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
