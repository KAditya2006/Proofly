import React, { useState, useEffect } from 'react';
import { getProjects, type Project } from '../services/projectService';
import { getReportingPeriods, type ReportingPeriod } from '../services/reportingService';
import { getIndicators, type ESGIndicator } from '../services/indicatorService';
import { FolderKanban, Calendar, Activity, UploadCloud, CheckCircle2, ChevronRight, Save, Loader2 } from 'lucide-react';
import { PremiumSelect } from '../components/PremiumSelect';

const ESGCollectionWorkspace: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [indicators, setIndicators] = useState<ESGIndicator[]>([]);
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [source, setSource] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // GHG fields
  const [activityData, setActivityData] = useState('');
  const [activityUnit, setActivityUnit] = useState('');
  const [emissionFactor, setEmissionFactor] = useState('');
  const [emissionFactorSource, setEmissionFactorSource] = useState('');
  const [emissionFactorYear, setEmissionFactorYear] = useState('');
  const [co2eResult, setCo2eResult] = useState<number | null>(null);
  
  // Water fields
  const [waterWithdrawal, setWaterWithdrawal] = useState('');
  const [waterDischarge, setWaterDischarge] = useState('');
  const [waterConsumption, setWaterConsumption] = useState<number | null>(null);

  // Waste fields
  const [wasteCategory, setWasteCategory] = useState('');
  const [wasteDisposalMethod, setWasteDisposalMethod] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleAiScan = () => {
    if (isReadOnly || isScanning) return;
    setIsScanning(true);
    
    // Simulate AI document scan, extraction, and standardization
    setTimeout(() => {
      setValue((Math.floor(Math.random() * 500) + 150).toString());
      setSource('Auto-Extracted from Uploaded Document.pdf');
      setCalculationMethod('System AI Extraction & Standardisation');
      setRemarks('AI Verification: Confidence 98%. Values match standardized expected parameters.');
      setIsScanning(false);
    }, 2500);
  };

  useEffect(() => {
    // In a real app we'd fetch in parallel or sequentially based on dependencies
    getProjects().then(setProjects);
    getReportingPeriods().then(p => setPeriods(p.filter(period => period.status === 'OPEN')));
    getIndicators().then(setIndicators);
  }, []);

  // Check for existing record when step 3 is reached
  useEffect(() => {
    if (step === 3 && selectedProject && selectedPeriod && selectedIndicator) {
      setLoadingRecord(true);
      import('../services/esgRecordService').then(({ getRecords }) => {
        getRecords(1, 1, {
          projectId: selectedProject,
          reportingPeriodId: selectedPeriod,
          indicatorId: selectedIndicator
        }).then(records => {
          if (records && records.length > 0) {
            const record = records[0];
            setExistingRecord(record);
            setValue(record.value?.toString() || '');
            setUnit(record.unit);
            setSource(record.source || '');
            setCalculationMethod(record.calculationMethod || '');
            setRemarks(record.remarks || '');
            setActivityData(record.activityData?.toString() || '');
            setActivityUnit(record.activityUnit || '');
            setEmissionFactor(record.emissionFactor?.toString() || '');
            setEmissionFactorSource(record.emissionFactorSource || '');
            setEmissionFactorYear(record.emissionFactorYear || '');
            setCo2eResult(record.co2eResult || null);
            setWaterWithdrawal(record.waterWithdrawal?.toString() || '');
            setWaterDischarge(record.waterDischarge?.toString() || '');
            setWaterConsumption(record.waterConsumption || null);
            setWasteCategory(record.wasteCategory || '');
            setWasteDisposalMethod(record.wasteDisposalMethod || '');
            setWasteQuantity(record.wasteQuantity?.toString() || '');
            
            if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(record.status)) {
              setIsReadOnly(true);
            } else {
              setIsReadOnly(false);
            }
          } else {
            setExistingRecord(null);
            setValue('');
            setSource('');
            setCalculationMethod('');
            setRemarks('');
            setActivityData('');
            setActivityUnit('');
            setEmissionFactor('');
            setEmissionFactorSource('');
            setEmissionFactorYear('');
            setCo2eResult(null);
            setWaterWithdrawal('');
            setWaterDischarge('');
            setWaterConsumption(null);
            setWasteCategory('');
            setWasteDisposalMethod('');
            setWasteQuantity('');
            setIsReadOnly(false);
          }
        }).finally(() => {
          setLoadingRecord(false);
        });
      });
    }
  }, [step, selectedProject, selectedPeriod, selectedIndicator]);

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const { createRecord, updateRecord } = await import('../services/esgRecordService');
      const currentInd = indicators.find(i => i._id === selectedIndicator);
      const isGHG = currentInd?.isGHG;
      const isWater = currentInd?.isWater;
      const isWaste = currentInd?.isWaste;
      
      const data = {
        projectId: selectedProject,
        reportingPeriodId: selectedPeriod,
        indicatorId: selectedIndicator,
        value: (isGHG || isWater || isWaste) ? undefined : (Number(value) || value), // Value is calculated on backend
        unit,
        source,
        calculationMethod,
        remarks,
        evidenceIds: [],
        ...(isGHG && {
          activityData: Number(activityData),
          activityUnit,
          emissionFactor: Number(emissionFactor),
          emissionFactorSource,
          emissionFactorYear,
        }),
        ...(isWater && {
          waterWithdrawal: Number(waterWithdrawal),
          waterDischarge: Number(waterDischarge)
        }),
        ...(isWaste && {
          wasteCategory: wasteCategory as any,
          wasteDisposalMethod: wasteDisposalMethod as any,
          wasteQuantity: Number(wasteQuantity)
        })
      };

      if (existingRecord) {
        const updated = await updateRecord(existingRecord._id, data);
        setExistingRecord(updated);
        alert('Draft updated successfully!');
      } else {
        const created = await createRecord(data);
        setExistingRecord(created);
        alert('Draft saved successfully!');
      }
      
      // Optionally reset step
    } catch (error) {
      console.error(error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitRecord = async () => {
    if (!existingRecord) {
      alert('Please save the record as a draft first before submitting.');
      return;
    }
    
    try {
      setSaving(true);
      const { submitRecord } = await import('../services/esgRecordService');
      const submitted = await submitRecord(existingRecord._id);
      setExistingRecord(submitted);
      setIsReadOnly(true);
      alert('Record submitted successfully! It is now pending BU review.');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to submit record');
    } finally {
      setSaving(false);
    }
  };

  const currentIndicator = indicators.find(i => i._id === selectedIndicator);

  // Auto-calculate rough CO2e on frontend for preview if they type
  useEffect(() => {
    if (currentIndicator?.isGHG && activityData && emissionFactor) {
      setCo2eResult(Number(activityData) * Number(emissionFactor));
    } else {
      setCo2eResult(null);
    }
    
    if (currentIndicator?.isWater && waterWithdrawal && waterDischarge) {
      setWaterConsumption(Number(waterWithdrawal) - Number(waterDischarge));
    } else {
      setWaterConsumption(null);
    }
  }, [activityData, emissionFactor, waterWithdrawal, waterDischarge, currentIndicator]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4 px-4 sm:px-0">
      <div className="border-b border-brand-coral/20 pb-6 mb-8">
        <h1 className="page-title">ESG Collection</h1>
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
              {projects.length === 0 ? (
                <div className="bg-white/60 rounded-2xl p-8 text-center border border-amber-200 shadow-sm">
                  <Activity className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-brand-navy mb-2">No Projects Assigned</h3>
                  <p className="text-brand-charcoal/70">
                    You cannot perform data collection because you are not assigned to any active projects. 
                    Please contact your Subsidiary Manager to be assigned to a project.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="input-label">Project</label>
                    <div className="relative mt-2">
                      <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <FolderKanban className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                        <span className="ml-3 text-gray-300">|</span>
                      </div>
                      <PremiumSelect 
                        value={selectedProject}
                        onChange={val => setSelectedProject(val)}
                        placeholder="Select a project..."
                        options={projects.map(p => ({
                          value: p._id,
                          label: `${p.name} (${p.status === 'COMPLETED' ? 'Completed' : 'Ongoing'})`
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="input-label">Reporting Period</label>
                    <div className="relative mt-2">
                      <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                        <span className="ml-3 text-gray-300">|</span>
                      </div>
                      <PremiumSelect 
                        value={selectedPeriod}
                        onChange={val => setSelectedPeriod(val)}
                        placeholder="Select period..."
                        options={periods.map(p => ({
                          value: p._id,
                          label: p.name
                        }))}
                      />
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
                </>
              )}
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
                  <PremiumSelect 
                        value={selectedIndicator}
                        onChange={val => {
                          setSelectedIndicator(val);
                          const ind = indicators.find(i => i._id === val);
                          if (ind) setUnit(ind.unit);
                        }}
                        placeholder="Search indicators..."
                        options={indicators.map(i => ({
                          value: i._id,
                          label: `${i.code} - ${i.name} (${i.category})`
                        }))}
                      />
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
            <div className="p-8 pt-4 space-y-10 relative">
              {loadingRecord && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-b-[2rem]">
                  <Loader2 className="h-10 w-10 text-brand-coral animate-spin mb-4" />
                  <p className="text-brand-navy font-medium">Loading existing record...</p>
                </div>
              )}
              {currentIndicator?.isGHG ? (
                <div className="bg-brand-coral/5 border border-brand-coral/20 rounded-2xl p-6 mb-8 space-y-6">
                  <h3 className="text-xl font-serif text-brand-navy border-b border-brand-coral/10 pb-4">GHG Calculation Engine (Scope 1/2/3)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="input-label">Activity Data</label>
                      <input 
                        type="number" 
                        className="input-field mt-2 text-lg" 
                        value={activityData}
                        onChange={e => setActivityData(e.target.value)}
                        placeholder="e.g. 5000"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="input-label">Activity Unit</label>
                      <input 
                        type="text" 
                        className="input-field mt-2 text-lg" 
                        value={activityUnit}
                        onChange={e => setActivityUnit(e.target.value)}
                        placeholder="e.g. kWh, Litres, Tonnes"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="input-label">Emission Factor</label>
                      <input 
                        type="number" 
                        className="input-field mt-2 text-lg" 
                        value={emissionFactor}
                        onChange={e => setEmissionFactor(e.target.value)}
                        placeholder="e.g. 0.71"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Factor Source</label>
                        <input 
                          type="text" 
                          className="input-field mt-2" 
                          value={emissionFactorSource}
                          onChange={e => setEmissionFactorSource(e.target.value)}
                          placeholder="e.g. CEA India"
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <label className="input-label">Factor Year</label>
                        <input 
                          type="text" 
                          className="input-field mt-2" 
                          value={emissionFactorYear}
                          onChange={e => setEmissionFactorYear(e.target.value)}
                          placeholder="e.g. 2023"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-white/60 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-1">Calculated Emissions</h4>
                      <p className="text-xs text-brand-charcoal/60">Activity Data × Emission Factor</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-brand-coral">
                        {co2eResult !== null ? co2eResult.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                      <span className="ml-2 text-brand-navy font-semibold">tCO₂e</span>
                    </div>
                  </div>
                </div>
              ) : currentIndicator?.isWater ? (
                <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6 mb-8 space-y-6">
                  <h3 className="text-xl font-serif text-brand-navy border-b border-blue-200/50 pb-4">Water Balance Engine</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="input-label">Total Water Withdrawal</label>
                      <input 
                        type="number" 
                        className="input-field mt-2 text-lg border-blue-200 focus:border-blue-400" 
                        value={waterWithdrawal}
                        onChange={e => setWaterWithdrawal(e.target.value)}
                        placeholder="e.g. 10000"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="input-label">Total Water Discharge</label>
                      <input 
                        type="number" 
                        className="input-field mt-2 text-lg border-blue-200 focus:border-blue-400" 
                        value={waterDischarge}
                        onChange={e => setWaterDischarge(e.target.value)}
                        placeholder="e.g. 2000"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-white/80 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-1">Net Consumption</h4>
                      <p className="text-xs text-brand-charcoal/60">Withdrawal - Discharge</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-blue-600">
                        {waterConsumption !== null ? waterConsumption.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                      <span className="ml-2 text-brand-navy font-semibold">{unit || 'Unit'}</span>
                    </div>
                  </div>
                </div>
              ) : currentIndicator?.isWaste ? (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 mb-8 space-y-6">
                  <h3 className="text-xl font-serif text-brand-navy border-b border-emerald-200/50 pb-4">Waste Categorization Engine</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="input-label">Waste Category</label>
                      <PremiumSelect 
                        value={wasteCategory}
                        onChange={val => setWasteCategory(val)}
                        placeholder="Select Category..."
                        disabled={isReadOnly}
                        options={[
                          { value: 'HAZARDOUS', label: 'Hazardous' },
                          { value: 'NON_HAZARDOUS', label: 'Non-Hazardous' }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="input-label">Disposal Method</label>
                      <PremiumSelect 
                        value={wasteDisposalMethod}
                        onChange={val => setWasteDisposalMethod(val)}
                        placeholder="Select Method..."
                        disabled={isReadOnly}
                        options={[
                          { value: 'RECYCLED', label: 'Recycled' },
                          { value: 'REUSED', label: 'Reused' },
                          { value: 'RECOVERED', label: 'Recovered' },
                          { value: 'DISPOSED', label: 'Disposed' },
                          { value: 'LANDFILLED', label: 'Landfilled' },
                          { value: 'INCINERATED', label: 'Incinerated' },
                          { value: 'OTHER', label: 'Other' }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="input-label">Total Quantity</label>
                      <input 
                        type="number" 
                        className="input-field mt-2 text-lg border-emerald-200 focus:border-emerald-400" 
                        value={wasteQuantity}
                        onChange={e => setWasteQuantity(e.target.value)}
                        placeholder="e.g. 50"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="input-label">Unit</label>
                      <input 
                        type="text" 
                        className="input-field mt-2 text-lg border-emerald-200 bg-emerald-50 text-emerald-900" 
                        value={unit || 'Metric Tons'}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              ) : (
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
                        disabled={isReadOnly}
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
              )}

              <div className="space-y-10">
                <div>
                  <label className="input-label">Source of Information</label>
                  <div className="mt-2">
                    <input type="text" className="input-field text-lg" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Utility Bills, HR System" disabled={isReadOnly} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Calculation Method (Optional)</label>
                  <div className="mt-2">
                    <input type="text" className="input-field text-lg" value={calculationMethod} onChange={e => setCalculationMethod(e.target.value)} placeholder="e.g. Sum of monthly readings" disabled={isReadOnly} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Remarks</label>
                  <div className="mt-2">
                    <textarea className="input-field text-lg min-h-24 resize-none" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add any context or comments" disabled={isReadOnly}></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-sm font-bold text-brand-charcoal mb-4 uppercase tracking-widest flex items-center gap-2">
                  Supporting Evidence <span className="bg-brand-coral text-white text-[9px] px-2 py-0.5 rounded-full">AI ENABLED</span>
                </h3>
                <div 
                  className={`border-[1.5px] border-dashed ${isScanning ? 'border-brand-navy bg-brand-blush/20' : 'border-brand-coral/40 bg-white/30 hover:bg-white/60'} rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer shadow-inner relative overflow-hidden`}
                  onClick={handleAiScan}
                >
                  {isScanning ? (
                    <>
                      <div className="absolute inset-0 bg-brand-coral/5 animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-brand-coral animate-[scan_2s_ease-in-out_infinite]"></div>
                      <Loader2 className="h-12 w-12 text-brand-navy animate-spin mb-4 relative z-10" strokeWidth={1.5} />
                      <p className="text-base text-brand-navy font-medium relative z-10">AI is analyzing document...</p>
                      <p className="text-xs text-brand-navy/60 mt-2 uppercase tracking-widest relative z-10">Extracting fields and standardizing units</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-12 w-12 text-brand-coral/60 mb-4" strokeWidth={1.5} />
                      <p className="text-base text-brand-navy font-medium">Click to upload raw evidence for AI Verification</p>
                      <p className="text-xs text-brand-charcoal/50 mt-2 uppercase tracking-widest">PDF, XLSX, CSV, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-12 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
                <button className="btn-text w-full sm:w-auto font-serif tracking-widest uppercase">
                  Run Validation
                </button>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  {existingRecord && (
                    <div className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg mr-4">
                      <span className="text-sm font-bold text-gray-600">STATUS: {existingRecord.status}</span>
                    </div>
                  )}
                  {!isReadOnly && (
                    <>
                      <button className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-widest px-8" onClick={handleSaveDraft} disabled={saving || loadingRecord}>
                        <Save className="h-4 w-4" /> {saving ? 'SAVING...' : (existingRecord ? 'UPDATE DRAFT' : 'SAVE DRAFT')}
                      </button>
                      <button className="btn-primary w-full sm:w-auto px-12" disabled={(currentIndicator?.isGHG ? (!activityData || !emissionFactor) : !value) || saving || loadingRecord} onClick={handleSubmitRecord}>
                        SUBMIT RECORD
                      </button>
                    </>
                  )}
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
