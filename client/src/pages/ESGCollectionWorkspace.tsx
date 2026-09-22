import React, { useState, useEffect } from 'react';
import { getProjects, type Project } from '../services/projectService';
import { getReportingPeriods, type ReportingPeriod } from '../services/reportingService';
import { getIndicators, type ESGIndicator } from '../services/indicatorService';
import { createRecord } from '../services/esgRecordService';
import { FolderKanban, Calendar, Activity, UploadCloud, CheckCircle2, ChevronRight, Save } from 'lucide-react';

const ESGCollectionWorkspace: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [indicators, setIndicators] = useState<ESGIndicator[]>([]);
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [source, setSource] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // In a real app we'd fetch in parallel or sequentially based on dependencies
    getProjects().then(setProjects);
    getReportingPeriods().then(p => setPeriods(p.filter(period => period.status === 'OPEN')));
    getIndicators().then(setIndicators);
  }, []);

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await createRecord({
        projectId: selectedProject,
        reportingPeriodId: selectedPeriod,
        indicatorId: selectedIndicator,
        value: Number(value) || value,
        unit,
        source,
        calculationMethod,
        remarks,
        evidenceIds: []
      });
      alert('Draft saved successfully!');
      // Reset or redirect
    } catch (error) {
      console.error(error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const currentIndicator = indicators.find(i => i._id === selectedIndicator);

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      <div className="border-b border-brand-coral/20 pb-6 mb-8">
        <h1 className="hollow-heading text-6xl text-left">ESG Collection</h1>
        <p className="page-subtitle mt-4 text-lg">Record values and upload evidence for ESG parameters.</p>
      </div>

      <div className="space-y-8">
        {/* Step 1: Project & Period */}
        <div className={`rounded-[2rem] overflow-hidden transition-all duration-500 shadow-sm border border-white/60 ${step >= 1 ? 'opacity-100 bg-white/40 backdrop-blur-md' : 'opacity-50 pointer-events-none bg-transparent'}`}>
          <div className="px-8 py-6 flex items-center justify-between cursor-pointer" onClick={() => setStep(1)}>
            <div className="flex items-center gap-6">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shadow-inner ${step > 1 ? 'bg-white text-brand-coral' : 'bg-brand-coral text-white'}`}>
                {step > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
              </div>
              <h2 className="text-3xl font-serif font-bold text-brand-navy tracking-wide">Context</h2>
            </div>
            {step === 1 && <ChevronRight className="text-brand-coral opacity-50 h-8 w-8" />}
          </div>
          
          {step === 1 && (
            <div className="p-8 pt-4 space-y-10">
              <div>
                <label className="input-label">Project</label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <FolderKanban className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                    <span className="ml-3 text-gray-300">|</span>
                  </div>
                  <select 
                    className="input-field pl-14 text-lg"
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                  >
                    <option value="">Select a project...</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="input-label">Reporting Period</label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                    <span className="ml-3 text-gray-300">|</span>
                  </div>
                  <select 
                    className="input-field pl-14 text-lg"
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                  >
                    <option value="">Select period...</option>
                    {periods.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button 
                  className="btn-primary w-full sm:w-auto px-12"
                  disabled={!selectedProject || !selectedPeriod}
                  onClick={() => setStep(2)}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Indicator */}
        <div className={`rounded-[2rem] overflow-hidden transition-all duration-500 shadow-sm border border-white/60 ${step >= 2 ? 'opacity-100 bg-white/40 backdrop-blur-md' : 'opacity-40 pointer-events-none hidden sm:block bg-white/20'}`}>
          <div className="px-8 py-6 flex items-center justify-between cursor-pointer" onClick={() => step >= 2 && setStep(2)}>
            <div className="flex items-center gap-6">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shadow-inner ${step > 2 ? 'bg-white text-brand-coral' : step === 2 ? 'bg-brand-coral text-white' : 'bg-white/50 text-brand-charcoal/40'}`}>
                {step > 2 ? <CheckCircle2 className="h-6 w-6" /> : '2'}
              </div>
              <h2 className="text-3xl font-serif font-bold text-brand-navy tracking-wide">Indicator</h2>
            </div>
            {step === 2 && <ChevronRight className="text-brand-coral opacity-50 h-8 w-8" />}
          </div>
          
          {step === 2 && (
            <div className="p-8 pt-4 space-y-10">
              <div>
                <label className="input-label">ESG Parameter</label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Activity className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                    <span className="ml-3 text-gray-300">|</span>
                  </div>
                  <select 
                    className="input-field pl-14 text-lg"
                    value={selectedIndicator}
                    onChange={e => {
                      setSelectedIndicator(e.target.value);
                      const ind = indicators.find(i => i._id === e.target.value);
                      if (ind) setUnit(ind.unit);
                    }}
                  >
                    <option value="">Search indicators...</option>
                    <optgroup label="Environment">
                      {indicators.filter(i => i.category === 'ENVIRONMENT').map(i => (
                        <option key={i._id} value={i._id}>{i.code} - {i.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Social">
                      {indicators.filter(i => i.category === 'SOCIAL').map(i => (
                        <option key={i._id} value={i._id}>{i.code} - {i.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button 
                  className="btn-primary w-full sm:w-auto px-12"
                  disabled={!selectedIndicator}
                  onClick={() => setStep(3)}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Data & Evidence */}
        <div className={`rounded-[2rem] overflow-hidden transition-all duration-500 shadow-sm border border-white/60 ${step >= 3 ? 'opacity-100 bg-white/40 backdrop-blur-md' : 'opacity-40 pointer-events-none hidden sm:block bg-white/20'}`}>
          <div className="px-8 py-6 flex items-center justify-between cursor-pointer" onClick={() => step >= 3 && setStep(3)}>
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-full bg-brand-coral flex items-center justify-center text-sm font-semibold text-white shadow-inner">3</div>
              <h2 className="text-3xl font-serif font-bold text-brand-navy tracking-wide">Data Entry</h2>
            </div>
          </div>
          
          {step === 3 && (
            <div className="p-8 pt-4 space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div>
                  <label className="input-label">Value</label>
                  <div className="mt-2">
                    <input 
                      type={currentIndicator?.dataType === 'NUMBER' ? 'number' : 'text'}
                      className="input-field text-lg" 
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder="Enter value" 
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Unit</label>
                  <div className="mt-2">
                    <input 
                      type="text" 
                      className="input-field text-lg text-brand-charcoal/50" 
                      value={unit}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <label className="input-label">Source of Information</label>
                  <div className="mt-2">
                    <input type="text" className="input-field text-lg" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Utility Bills, HR System" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Calculation Method (Optional)</label>
                  <div className="mt-2">
                    <input type="text" className="input-field text-lg" value={calculationMethod} onChange={e => setCalculationMethod(e.target.value)} placeholder="e.g. Sum of monthly readings" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Remarks</label>
                  <div className="mt-2">
                    <textarea className="input-field text-lg min-h-24 resize-none" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add any context or comments"></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-sm font-bold text-brand-charcoal mb-4 uppercase tracking-widest">Supporting Evidence</h3>
                <div className="border-[1.5px] border-dashed border-brand-coral/40 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-white/30 hover:bg-white/60 transition-colors cursor-pointer shadow-inner">
                  <UploadCloud className="h-12 w-12 text-brand-coral/60 mb-4" strokeWidth={1.5} />
                  <p className="text-base text-brand-navy font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-brand-charcoal/50 mt-2 uppercase tracking-widest">PDF, XLSX, CSV, JPG up to 10MB</p>
                </div>
              </div>

              <div className="pt-12 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
                <button className="btn-text w-full sm:w-auto font-serif tracking-widest uppercase">
                  Run Validation
                </button>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-widest px-8" onClick={handleSaveDraft} disabled={saving}>
                    <Save className="h-4 w-4" /> {saving ? 'SAVING...' : 'SAVE DRAFT'}
                  </button>
                  <button className="btn-primary w-full sm:w-auto px-12" disabled={!value}>
                    SUBMIT RECORD
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ESGCollectionWorkspace;
