import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfilyLogo } from '../../components/ProfilyLogo';

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
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pb-20 z-10 text-center px-6">
        <h1 className="hollow-heading text-6xl md:text-8xl mb-8 tracking-widest leading-tight">
          MEIL ESG360
        </h1>
        
        <h2 className="text-brand-navy text-2xl md:text-3xl mb-10 font-medium max-w-3xl">
          From Project Data to BRSR-Ready Reporting.
        </h2>
        
        <p className="text-brand-charcoal mb-16 max-w-4xl text-xl font-light leading-relaxed">
          Collect, validate, approve, and consolidate ESG data across the MEIL enterprise. Seamlessly track data lineage and ensure readiness for BRSR Core reporting and assurance.
        </p>
        
        <button
          onClick={() => navigate('/login')}
          className="btn-primary max-w-sm"
        >
          GET STARTED
        </button>
      </main>
      
      {/* Semantic Footer */}
      <footer className="bg-gray-50 py-8 text-center text-gray-500 text-sm w-full z-20 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} MEIL. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
