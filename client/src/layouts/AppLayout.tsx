import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Leaf, 
  FileText, 
  ClipboardCheck, 
  BarChart3, 
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { GlobalSearch } from '../components/GlobalSearch';
import { ProfilyLogo } from '../components/ProfilyLogo';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  let navigation: any[] = [];

  switch (user?.role) {
    case 'ADMIN':
      navigation = [
        { name: 'Admin Control', href: '/admin', icon: Settings },
        { name: 'Integrations', href: '/admin/integrations', icon: Settings },
        { name: 'Import History', href: '/admin/imports', icon: FileText },
        { name: 'API Keys', href: '/admin/api-keys', icon: ShieldCheck },
      ];
      break;
    case 'PROJECT_OFFICER':
      navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Data Collection', href: '/esg/collection', icon: FileText },
        { name: 'Bulk Upload', href: '/bulk-upload', icon: ClipboardCheck },
      ];
      break;
    case 'BUSINESS_UNIT_REVIEWER':
      navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Reviews', href: '/reviews', icon: ClipboardCheck },
      ];
      break;
    case 'SUBSIDIARY_MANAGER':
      navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Evidence', href: '/evidence-intel', icon: FileText },
      ];
      break;
    case 'GROUP_ESG_TEAM':
      navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'ESG Hub', href: '/esg', icon: Leaf },
        { name: 'BRSR', href: '/brsr/core', icon: FileText },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Evidence', href: '/evidence-intel', icon: FileText },
        { name: 'Admin Control', href: '/admin', icon: Settings },
        { name: 'Integrations', href: '/admin/integrations', icon: Settings },
        { name: 'Import History', href: '/admin/imports', icon: FileText },
        { name: 'API Keys', href: '/admin/api-keys', icon: ShieldCheck },
      ];
      break;
    case 'AUDITOR':
      navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Assurance', href: '/assurance', icon: ShieldCheck },
        { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
      ];
      break;
    default:
      navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ];
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-proofly-gradient flex flex-col md:flex-row font-sans text-brand-charcoal">
      {/* Mobile header */}
      <div className={`md:hidden flex items-center justify-between p-4 sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#f9b1b1]/95 backdrop-blur-md shadow-md border-b border-brand-coral/30' : 'bg-transparent'}`}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-brand-navy hover:text-brand-coral hover:bg-white/50 rounded-full transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <ProfilyLogo className="w-40 sm:w-48" />
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-2 text-brand-navy hover:text-brand-coral hover:bg-white/50 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-brand-navy/20 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar & Mobile Menu */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/60 backdrop-blur-md border-r border-white/40 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shrink-0 md:w-64 shadow-xl md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-28 flex items-center justify-center px-6 border-b border-brand-coral/10">
          <ProfilyLogo className="w-48" />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                group flex items-center px-4 py-3 text-sm rounded-full transition-all duration-300
                ${isActive(item.href) 
                  ? 'bg-white shadow-sm text-brand-navy font-semibold border border-white/50' 
                  : 'text-brand-charcoal/70 hover:bg-white/50 hover:text-brand-navy'
                }
              `}
            >
              <item.icon 
                className={`shrink-0 mr-4 h-5 w-5 transition-colors ${isActive(item.href) ? 'text-brand-coral' : 'text-brand-charcoal/50 group-hover:text-brand-coral'}`} 
              />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="border-t border-brand-coral/10 p-4 bg-white/30 backdrop-blur-sm">
          <div className="flex items-center p-2 rounded-full hover:bg-white/50 transition-colors">
            <div className="ml-2 flex-1">
              <p className="text-sm font-serif font-semibold text-brand-navy truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-brand-coral uppercase tracking-widest truncate mt-0.5">{user?.role.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={logout} className="p-2 text-brand-navy/50 hover:text-brand-coral hover:bg-white rounded-full transition-colors shadow-sm" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden focus:outline-none bg-transparent">
        
        {/* Top Header */}
        <div className={`h-24 flex items-center justify-between px-4 sm:px-6 md:px-8 hidden md:flex z-10 sticky top-0 transition-all duration-300 ${scrolled ? 'bg-[#f9b1b1]/95 backdrop-blur-md shadow-md border-b border-brand-coral/30' : 'bg-transparent'}`}>
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 flex items-center justify-center text-brand-navy/60 hover:text-brand-coral hover:bg-white/60 backdrop-blur-sm transition-colors rounded-full shadow-sm border border-white/40 group"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="w-96">
              <GlobalSearch />
            </div>
            <Link to="/notifications" className="p-3 text-brand-navy/60 hover:text-brand-coral relative rounded-full hover:bg-white/60 backdrop-blur-sm transition-colors shadow-sm border border-white/40">
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-brand-coral ring-2 ring-white"></span>
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-24 md:pb-12"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 10)}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
