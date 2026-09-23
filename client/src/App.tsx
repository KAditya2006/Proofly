import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import PublicLayout from './layouts/PublicLayout';
import Landing from './pages/public/Landing';
import ESGReporting from './pages/public/ESGReporting';
import BRSRReporting from './pages/public/BRSRReporting';
import Features from './pages/public/Features';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import NotFound from './pages/public/NotFound';
import Login from './pages/Login';
import FirstLoginPasswordChange from './pages/FirstLoginPasswordChange';
import Dashboard from './pages/Dashboard';
import OrganizationPage from './pages/Organization';
import ProjectsPage from './pages/Projects';
import ReportingSetupPage from './pages/ReportingSetup';
import ESGHubPage from './pages/ESGHub';
import ESGCollectionWorkspace from './pages/ESGCollectionWorkspace';
import ReviewWorkspace from './pages/ReviewWorkspace';
import ReviewDetail from './pages/ReviewDetail';
import BulkUpload from './pages/BulkUpload';
import ReportArchive from './pages/ReportArchive';
import BRSRCore from './pages/BRSRCore';
import ValueChainDashboard from './pages/ValueChainDashboard';
import IndicatorExplorer from './pages/IndicatorExplorer';
import AssuranceWorkspace from './pages/AssuranceWorkspace';
import ComplianceDashboard from './pages/ComplianceDashboard';

// Heavy Modules
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const ReportBuilder = lazy(() => import('./pages/ReportBuilder'));
import EvidenceIntelligence from './pages/EvidenceIntelligence';
import TaskBoard from './pages/TaskBoard';
import NotificationCenter from './pages/NotificationCenter';
import BulkUploadWorkspace from './pages/BulkUploadWorkspace';
import ReportingPeriodWorkspace from './pages/ReportingPeriodWorkspace';
import { AdminControlCenter } from './pages/AdminControlCenter';
import { AuditSearch } from './pages/AuditSearch';
import IntegrationHub from './pages/IntegrationHub';
import IntegrationDetail from './pages/IntegrationDetail';
import ImportBatches from './pages/ImportBatches';
import ServiceAccounts from './pages/ServiceAccounts';
import { UserManagement } from './pages/UserManagement';
import { SystemConfiguration } from './pages/SystemConfiguration';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing Routes */}
          <Route path="/" element={<Landing />} />
          <Route element={<PublicLayout />}>
            <Route path="/esg-reporting" element={<ESGReporting />} />
            <Route path="/brsr-reporting" element={<BRSRReporting />} />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<FirstLoginPasswordChange />} />
          </Route>
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Phase 5 & 6 Workspaces */}
            <Route path="analytics" element={
              <ErrorBoundary>
                <Suspense fallback={<div className="flex h-full items-center justify-center p-12">Loading Analytics...</div>}>
                  <AnalyticsDashboard />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="reports" element={<ReportArchive />} />
            <Route path="reports/builder" element={
              <ErrorBoundary>
                <Suspense fallback={<div className="flex h-full items-center justify-center p-12">Loading Report Builder...</div>}>
                  <ReportBuilder />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="brsr" element={<Navigate to="/brsr/core" replace />} />
            <Route path="brsr/core" element={<BRSRCore />} />
            <Route path="value-chain" element={<ValueChainDashboard />} />
            <Route path="explorer" element={<IndicatorExplorer />} />
            <Route path="assurance" element={<AssuranceWorkspace />} />
            <Route path="compliance" element={<ComplianceDashboard />} />
            <Route path="tasks" element={<TaskBoard />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="bulk-upload" element={<BulkUploadWorkspace />} />
            <Route path="reporting-periods" element={<ReportingPeriodWorkspace />} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="admin" element={<AdminControlCenter />} />
              <Route path="admin/audit" element={<AuditSearch />} />
              <Route path="admin/integrations" element={<IntegrationHub />} />
              <Route path="admin/integrations/:id" element={<IntegrationDetail />} />
              <Route path="admin/imports" element={<ImportBatches />} />
              <Route path="admin/api-keys" element={<ServiceAccounts />} />
              <Route path="admin/users" element={<UserManagement />} />
              <Route path="admin/settings" element={<SystemConfiguration />} />
            </Route>

            {/* Phase 4 Workspaces */}
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/reporting" element={<ReportingSetupPage />} />
              <Route path="/esg" element={<ESGHubPage />} />
              <Route path="/esg/collection" element={<ESGCollectionWorkspace />} />
              <Route path="/esg/upload" element={<BulkUpload />} />
              <Route path="/reviews" element={<ReviewWorkspace />} />
              <Route path="/reviews/:id" element={<ReviewDetail />} />
              <Route path="/evidence" element={<div>Evidence Repository</div>} />
              
              <Route path="/brsr/section-a" element={<div>BRSR Section A</div>} />
              <Route path="/brsr/section-b" element={<div>BRSR Section B</div>} />
              <Route path="/brsr/principles" element={<div>BRSR Principles</div>} />
              <Route path="/evidence-intel" element={<EvidenceIntelligence />} />
              <Route path="/compliance" element={<ComplianceDashboard />} />
              <Route path="/assurance" element={<AssuranceWorkspace />} />

              {/* Removed duplicate root route */}
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
