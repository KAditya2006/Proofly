import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfilyLogo } from '../components/ProfilyLogo';
import { AuthCurve } from '../components/AuthCurve';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-proofly-gradient relative overflow-hidden">
      {/* Top Pink Section */}
      <div className="flex-1 flex flex-col items-center pt-24 pb-8">
        <ProfilyLogo className="w-52" />
        <h1 className="hollow-heading text-5xl mt-12 tracking-widest">
          WELCOME
        </h1>
      </div>

      {/* Bottom White Section */}
      <div className="relative bg-white w-full flex flex-col items-center pt-16 pb-20 px-8">
        {/* The upward curving wave transition */}
        <AuthCurve />

        <div className="w-full max-w-sm flex flex-col gap-5 relative z-20">
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-full border-2 border-brand-coral py-4 text-center font-serif text-lg tracking-widest text-brand-coral uppercase hover:bg-brand-coral/5 transition-colors focus:outline-none"
          >
            SIGN IN
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
