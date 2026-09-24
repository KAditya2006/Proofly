import React from 'react';

interface PremiumLoaderProps {
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  text = 'Loading...', 
  className = '',
  fullScreen = true 
}) => {
  const containerClass = fullScreen 
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur-sm'
    : `flex flex-col items-center justify-center ${className}`;

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center h-24 w-24 mb-8">
        {/* Outer pulsating ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-brand-coral/30 animate-ping" style={{ animationDuration: '2s' }}></div>
        {/* Inner spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-coral border-r-brand-coral animate-spin" style={{ animationDuration: '1.5s' }}></div>
        {/* Center dot */}
        <div className="h-5 w-5 bg-brand-navy rounded-full animate-pulse shadow-md"></div>
      </div>
      <p className="font-serif text-sm tracking-[0.3em] uppercase text-brand-navy/70 animate-pulse font-medium">
        {text}
      </p>
    </div>
  );
};
