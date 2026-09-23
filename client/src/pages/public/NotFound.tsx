import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfilyLogo } from '../../components/ProfilyLogo';
import { SEO } from '../../components/SEO';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-proofly-gradient relative overflow-hidden">
      <SEO 
        title="Page Not Found | MEIL ESG360"
        description="The page you are looking for does not exist."
      />
      {/* Explicit noindex for 404 pages */}
      <meta name="robots" content="noindex" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
        <ProfilyLogo className="w-48 mb-8" />
        <h1 className="text-6xl font-serif text-white tracking-widest mb-4">404</h1>
        <h2 className="text-2xl font-light text-white mb-8">Page Not Found</h2>
        <p className="text-white/80 max-w-md mb-12">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-full bg-white px-8 py-4 text-center font-serif text-lg tracking-widest text-brand-coral uppercase hover:bg-white/90 transition-colors focus:outline-none"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
