import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ProfilyLogo } from '../../components/ProfilyLogo';
import { AuthCurve } from '../../components/AuthCurve';
import { SEO } from '../../components/SEO';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-proofly-gradient relative overflow-hidden">
      <SEO 
        title="MEIL ESG360 | Enterprise ESG & BRSR Reporting Platform"
        description="MEIL ESG360 is an enterprise ESG reporting platform designed to collect, validate, consolidate and trace ESG data for BRSR-ready reporting."
        canonical="https://www.meilesg360.com/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MEIL ESG360",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "Enterprise ESG reporting platform designed to collect, validate, consolidate and trace ESG data for BRSR-ready reporting.",
          "provider": {
            "@type": "Organization",
            "name": "MEIL"
          }
        }}
      />
      
      {/* Top Header / Nav */}
      <header className="w-full flex justify-between items-center p-6 z-20">
        <div className="w-32">
          <ProfilyLogo />
        </div>
        <nav className="hidden md:flex gap-6 text-white font-serif tracking-widest text-sm">
          <Link to="/features" className="hover:text-brand-coral transition-colors">FEATURES</Link>
          <Link to="/esg-reporting" className="hover:text-brand-coral transition-colors">ESG REPORTING</Link>
          <Link to="/brsr-reporting" className="hover:text-brand-coral transition-colors">BRSR</Link>
          <Link to="/about" className="hover:text-brand-coral transition-colors">ABOUT</Link>
          <Link to="/contact" className="hover:text-brand-coral transition-colors">CONTACT</Link>
        </nav>
        <button
          onClick={() => navigate('/login')}
          className="rounded-full border border-white px-6 py-2 text-center font-serif text-sm tracking-widest text-white uppercase hover:bg-white hover:text-brand-coral transition-colors focus:outline-none"
        >
          SIGN IN
        </button>
      </header>

      {/* Top Pink Section - Hero */}
      <main className="flex-1 flex flex-col items-center pt-16 pb-8 z-10 text-center px-4">
        <h1 className="hollow-heading text-5xl md:text-7xl mt-8 tracking-widest leading-tight">
          MEIL ESG360
        </h1>
        <h2 className="text-white text-xl md:text-2xl mt-6 font-light max-w-2xl">
          From Project Data to BRSR-Ready Reporting.
        </h2>
        <p className="text-white/80 mt-6 max-w-3xl text-lg font-light leading-relaxed">
          Collect, validate, approve, and consolidate ESG data across the MEIL enterprise. Seamlessly track data lineage and ensure readiness for BRSR Core reporting and assurance.
        </p>
      </main>

      {/* Bottom White Section */}
      <div className="relative bg-white w-full flex flex-col items-center pt-16 pb-20 px-8">
        <AuthCurve />
        <div className="w-full max-w-4xl flex flex-col items-center gap-12 relative z-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
            <div className="p-6">
              <h3 className="text-xl font-serif text-brand-coral mb-4 tracking-wider">Enterprise Scale</h3>
              <p className="text-gray-600">Hierarchical consolidation from Project to Business Unit to Subsidiary to MEIL Group.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-brand-coral mb-4 tracking-wider">BRSR Core</h3>
              <p className="text-gray-600">Built-in BRSR mapping and readiness tracking to streamline regulatory compliance.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-brand-coral mb-4 tracking-wider">Data Lineage</h3>
              <p className="text-gray-600">Complete traceability from final consolidated report back to the original source evidence.</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full max-w-sm rounded-full border-2 border-brand-coral py-4 text-center font-serif text-lg tracking-widest text-brand-coral uppercase hover:bg-brand-coral/5 transition-colors focus:outline-none"
          >
            ENTER WORKSPACE
          </button>
        </div>
      </div>
      
      {/* Semantic Footer */}
      <footer className="bg-gray-50 py-8 text-center text-gray-500 text-sm w-full z-20 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} MEIL. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
