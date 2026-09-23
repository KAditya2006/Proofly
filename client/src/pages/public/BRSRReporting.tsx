import React from 'react';
import { SEO } from '../../components/SEO';
import { useNavigate } from 'react-router-dom';

const BRSRReporting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <article className="w-full">
      <SEO 
        title="BRSR Reporting Software | MEIL ESG360"
        description="Ensure full regulatory compliance with MEIL ESG360's BRSR reporting software. Purpose-built for BRSR Core reporting and SEBI compliance."
        canonical="https://www.meilesg360.com/brsr-reporting"
      />
      
      <section className="bg-proofly-gradient text-white py-20 px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest mb-6">BRSR REPORTING SOFTWARE</h1>
        <p className="text-xl font-light max-w-3xl mx-auto opacity-90">
          Purpose-built compliance platform for BRSR Core reporting and assurance.
        </p>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-brand-coral mb-6">Simplify SEBI BRSR Compliance</h2>
          <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
            The Business Responsibility and Sustainability Report (BRSR) framework requires rigorous data collection and precise formatting. MEIL ESG360 is explicitly designed to map your enterprise data directly to BRSR Core requirements, eliminating guesswork and reducing compliance risk.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-serif text-brand-coral mb-4">Native BRSR Mapping</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Every data point collected in the system automatically maps to the corresponding BRSR principle and indicator, providing immediate visibility into your compliance posture.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-serif text-brand-coral mb-4">Readiness Tracking</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Track your BRSR Core reporting progress in real-time. Identify data gaps, missing evidence, and pending approvals before the reporting deadline.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-serif text-brand-coral mb-4">Assurance Ready</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Provide third-party auditors with a dedicated workspace to review evidence, trace data lineage, and verify BRSR disclosures with complete transparency.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-12 rounded-2xl border border-gray-200 text-center">
          <h2 className="text-2xl font-serif text-gray-800 mb-4">Ready to automate your BRSR Core reporting?</h2>
          <button 
            onClick={() => navigate('/login')}
            className="mt-6 rounded-full border-2 border-brand-coral py-3 px-10 text-center font-serif tracking-widest text-brand-coral uppercase hover:bg-brand-coral hover:text-white transition-colors"
          >
            Access Platform
          </button>
        </div>
      </section>
    </article>
  );
};

export default BRSRReporting;
