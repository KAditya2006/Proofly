import React from 'react';
import { SEO } from '../../components/SEO';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <article className="w-full">
      <SEO 
        title="About MEIL ESG360 | Enterprise ESG Data Management"
        description="Learn about MEIL ESG360, the internal platform powering MEIL's enterprise ESG data management, consolidation, and compliance reporting."
        canonical="https://www.meilesg360.com/about"
      />
      
      <section className="bg-proofly-gradient text-white py-20 px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest mb-6">ABOUT MEIL ESG360</h1>
        <p className="text-xl font-light max-w-3xl mx-auto opacity-90">
          Empowering MEIL with transparent and actionable ESG data.
        </p>
      </section>

      <section className="max-w-4xl mx-auto py-16 px-6">
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-6">
            MEIL ESG360 is the proprietary enterprise ESG reporting platform for Megha Engineering and Infrastructures Limited (MEIL). As our operations expand globally, maintaining accurate, transparent, and auditable sustainability metrics is paramount.
          </p>
          <p className="mb-6">
            The platform bridges the gap between field-level project data and corporate-level regulatory reporting. By automating data collection, enforcing validation workflows, and providing a unified dashboard, MEIL ESG360 ensures that our ESG disclosures—including our BRSR Core obligations—are built on a foundation of verifiable evidence.
          </p>
          <p className="mb-12">
            Our mission is to seamlessly transform raw project data into BRSR-ready reporting, ensuring full compliance and enabling data-driven sustainability strategies across the entire MEIL group.
          </p>
        </div>

        <div className="text-center mt-12 pt-12 border-t border-gray-100">
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

export default About;
