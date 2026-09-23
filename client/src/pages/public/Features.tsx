import React from 'react';
import { SEO } from '../../components/SEO';
import { useNavigate } from 'react-router-dom';

const Features: React.FC = () => {
  const navigate = useNavigate();

  return (
    <article className="w-full">
      <SEO 
        title="ESG Reporting Features & Capabilities | MEIL ESG360"
        description="Explore the capabilities of MEIL ESG360, including ESG data lineage, hierarchical consolidation, assurance workspaces, and integration APIs."
        canonical="https://www.meilesg360.com/features"
      />
      
      <section className="bg-proofly-gradient text-white py-20 px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest mb-6">ENTERPRISE FEATURES</h1>
        <p className="text-xl font-light max-w-3xl mx-auto opacity-90">
          Everything you need for auditable, transparent, and accurate ESG disclosures.
        </p>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-2 gap-12">
          
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-2xl font-serif text-brand-coral mb-4">ESG Data Lineage</h3>
            <p className="text-gray-600 leading-relaxed">
              Traceability is critical for assurance. MEIL ESG360 provides unbroken ESG data lineage, allowing you to trace any consolidated figure back to its original source document, project location, and the specific user who entered the data.
            </p>
          </div>

          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-2xl font-serif text-brand-coral mb-4">ESG Assurance</h3>
            <p className="text-gray-600 leading-relaxed">
              Our dedicated assurance workspace provides internal and external auditors with read-only access to specific reporting periods. Auditors can review evidence, raise queries, and track findings without disrupting ongoing operations.
            </p>
          </div>

          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-2xl font-serif text-brand-coral mb-4">Hierarchical Consolidation</h3>
            <p className="text-gray-600 leading-relaxed">
              Data naturally flows upward. Enter data at the Project level, consolidate at the Business Unit level, aggregate across Subsidiaries, and generate enterprise-wide reports at the MEIL Group level.
            </p>
          </div>

          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-2xl font-serif text-brand-coral mb-4">Evidence Intelligence</h3>
            <p className="text-gray-600 leading-relaxed">
              Attach supporting evidence (invoices, certificates, logs) directly to data points. Our workflow ensures evidence is reviewed and approved before data is included in consolidated reports.
            </p>
          </div>

        </div>

        <div className="text-center mt-20">
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

export default Features;
