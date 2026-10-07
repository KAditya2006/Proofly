import React, { useState, useEffect } from 'react';
import { systemService, type SystemSettings } from '../services/systemService';
import { Save, Shield, Mail, Clock, Database } from 'lucide-react';

export const SystemConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<SystemSettings>({
    sessionTimeout: '30',
    maxFailedLogins: '5',
    passwordComplexity: 'high',
    maintenanceMode: false,
    smtpHost: 'smtp.meil.com',
    smtpPort: '587',
    smtpUser: 'no-reply@meil.com',
    enableAuditLogging: true,
    dataRetentionDays: '365'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await systemService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await systemService.updateSettings(settings);
      alert('System configurations saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">System Configuration</h1>
          <p className="page-subtitle mt-1">Manage global enterprise settings and security policies</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
          <nav className="flex md:flex-col gap-2 p-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'security' 
                  ? 'bg-white text-brand-navy shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Shield className="mr-3 h-5 w-5 text-slate-400" />
              Security & Access
            </button>
            <button
              onClick={() => setActiveTab('smtp')}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'smtp' 
                  ? 'bg-white text-brand-navy shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Mail className="mr-3 h-5 w-5 text-slate-400" />
              SMTP & Email
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'system' 
                  ? 'bg-white text-brand-navy shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Clock className="mr-3 h-5 w-5 text-slate-400" />
              System Operations
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'data' 
                  ? 'bg-white text-brand-navy shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Database className="mr-3 h-5 w-5 text-slate-400" />
              Data Retention
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium text-slate-900">Security & Access Policies</h3>
                <p className="mt-1 text-sm text-slate-500">Configure how users authenticate and session limits.</p>
              </div>
              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div>
                  <label className="input-label">Session Timeout (Minutes)</label>
                  <input 
                    type="number" 
                    className="input-field mt-1 max-w-xs" 
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-slate-500">Users will be automatically logged out after this period of inactivity.</p>
                </div>
                <div>
                  <label className="input-label">Max Failed Login Attempts</label>
                  <input 
                    type="number" 
                    className="input-field mt-1 max-w-xs" 
                    value={settings.maxFailedLogins}
                    onChange={(e) => setSettings({...settings, maxFailedLogins: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-slate-500">Account will lock temporarily after these many failures.</p>
                </div>
                <div>
                  <label className="input-label">Password Complexity</label>
                  <select 
                    className="input-field mt-1 max-w-xs"
                    value={settings.passwordComplexity}
                    onChange={(e) => setSettings({...settings, passwordComplexity: e.target.value as 'low' | 'medium' | 'high'})}
                  >
                    <option value="low">Low (8 chars, 1 number)</option>
                    <option value="medium">Medium (8 chars, Upper, Lower, Number)</option>
                    <option value="high">High (12 chars, Upper, Lower, Number, Special)</option>
                  </select>
                </div>
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-coral focus:ring-brand-coral"
                      checked={settings.enableAuditLogging}
                      onChange={(e) => setSettings({...settings, enableAuditLogging: e.target.checked})}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-slate-700">Strict Audit Logging</label>
                    <p className="text-slate-500">Log all read queries in addition to write mutations.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium text-slate-900">SMTP & Email Configuration</h3>
                <p className="mt-1 text-sm text-slate-500">Settings for sending system notifications and alerts.</p>
              </div>
              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div>
                  <label className="input-label">SMTP Host</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">SMTP Port</label>
                  <input 
                    type="text" 
                    className="input-field mt-1 max-w-xs" 
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">From Email Address</label>
                  <input 
                    type="email" 
                    className="input-field mt-1" 
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                  />
                </div>
                <div className="pt-2">
                  <button className="btn-secondary text-sm">Send Test Email</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium text-slate-900">System Operations</h3>
                <p className="mt-1 text-sm text-slate-500">Manage global system availability.</p>
              </div>
              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        checked={settings.maintenanceMode}
                        onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-amber-900">Enable Maintenance Mode</label>
                      <p className="text-amber-700 mt-1">If enabled, all non-admin users will be logged out and prevented from logging in. Use only during scheduled downtime.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium text-slate-900">Data Retention Policies</h3>
                <p className="mt-1 text-sm text-slate-500">Configure how long audit logs and ephemeral data are kept.</p>
              </div>
              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div>
                  <label className="input-label">Audit Log Retention (Days)</label>
                  <input 
                    type="number" 
                    className="input-field mt-1 max-w-xs" 
                    value={settings.dataRetentionDays}
                    onChange={(e) => setSettings({...settings, dataRetentionDays: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-slate-500">Logs older than this will be archived to cold storage.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
