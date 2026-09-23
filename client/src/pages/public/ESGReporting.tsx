import React from 'react';
import { SEO } from '../../components/SEO';
import { useNavigate } from 'react-router-dom';

const ESGReporting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <article className="w-full">
      <SEO 
        title="ESG Reporting Software | MEIL ESG360"
        description="Streamline your enterprise ESG reporting with MEIL ESG360. Automate data collection, track metrics, and ensure compliance with our comprehensive ESG software."
        canonical="https://www.meilesg360.com/esg-reporting"
      />
      
      {/* Hero Section */}
      <section className="bg-proofly-gradient text-white py-20 px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest mb-6">ESG REPORTING SOFTWARE</h1>
        <p className="text-xl font-light max-w-3xl mx-auto opacity-90">
          Transform your enterprise ESG data into actionable insights and compliance-ready reports.
        </p>
      </section>

      {/* Content Section */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-serif text-brand-coral mb-6">Centralize Your ESG Data Management</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              MEIL ESG360 acts as the single source of truth for all your environmental, social, and governance metrics. Our platform allows seamless data collection across multiple business units and project sites.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Eliminate manual spreadsheets and fragmented data silos. Our ESG reporting software provides a unified platform to track emissions, social impact, and governance metrics in real-time.
            </p>
          </div>
          <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center border border-gray-200">
            {/* Placeholder for actual product screenshot/illustration */}
            <span className="text-gray-400 font-serif tracking-widest uppercase">Data Centralization</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center border border-gray-200 order-2 md:order-1">
            <span className="text-gray-400 font-serif tracking-widest uppercase">Automated Workflows</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-serif text-brand-coral mb-6">Enterprise ESG Workflows</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Implement robust validation and approval workflows. Data is securely collected at the project level and consolidated upwards through subsidiaries to the MEIL Group level.
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Automated data validation checks</li>
              <li>Multi-tier approval processes</li>
              <li>Evidence management and intelligence</li>
              <li>Audit trails for every data point</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-20">
          <h2 className="text-2xl font-serif text-gray-800 mb-6">Ready to streamline your ESG reporting?</h2>
          <button 
            onClick={() => navigate('/login')}
            className="rounded-full border-2 border-brand-coral py-3 px-10 text-center font-serif tracking-widest text-brand-coral uppercase hover:bg-brand-coral hover:text-white transition-colors"
          >
            Access Platform
          </button>
        </div>
      </section>
    </article>
  );
};

export default ESGReporting;
