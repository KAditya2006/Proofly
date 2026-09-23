import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ProfilyLogo } from '../components/ProfilyLogo';

const PublicLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-6 bg-proofly-gradient sticky top-0 z-50 shadow-md">
        <div className="w-32 cursor-pointer" onClick={() => navigate('/')}>
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

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 text-center text-gray-500 text-sm w-full border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} MEIL. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link to="/" className="hover:text-brand-coral">Home</Link>
          <Link to="/about" className="hover:text-brand-coral">About</Link>
          <Link to="/contact" className="hover:text-brand-coral">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
