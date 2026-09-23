import React from 'react';
import { SEO } from '../../components/SEO';
import { ProfilyLogo } from '../../components/ProfilyLogo';

const Contact: React.FC = () => {
  return (
    <article className="w-full">
      <SEO 
        title="Contact Us | MEIL ESG360 Support"
        description="Get in touch with the MEIL ESG360 support team for enterprise ESG reporting platform assistance, integration inquiries, or account access."
        canonical="https://www.meilesg360.com/contact"
      />
      
      <section className="bg-proofly-gradient text-white py-20 px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest mb-6">CONTACT SUPPORT</h1>
        <p className="text-xl font-light max-w-3xl mx-auto opacity-90">
          We're here to assist with your ESG data management journey.
        </p>
      </section>

      <section className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-32 mx-auto mb-8">
            <ProfilyLogo />
          </div>
          
          <h2 className="text-2xl font-serif text-gray-800 mb-6">Internal Support</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            If you are a MEIL employee experiencing issues accessing the ESG360 platform, require new permissions, or need to request a new integration, please contact your internal IT administrator or raise a ticket via the internal MEIL IT portal.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-serif text-brand-coral mb-2">Technical Assistance</h3>
              <p className="text-sm text-gray-600">For bugs, performance issues, or feature requests, use the feedback module within the platform dashboard.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-serif text-brand-coral mb-2">Auditor Access</h3>
              <p className="text-sm text-gray-600">External assurance providers should contact their MEIL compliance liaison to receive secure, read-only workspace credentials.</p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

export default Contact;
