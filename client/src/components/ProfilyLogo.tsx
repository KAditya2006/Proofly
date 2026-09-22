import React from 'react';
import prooflyLogo from '../assets/proofly-logo.png';

interface ProfilyLogoProps {
  className?: string;
  showTagline?: boolean; // Kept for backwards compatibility but not needed visually
}

export const ProfilyLogo: React.FC<ProfilyLogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img src={prooflyLogo} alt="Proofly" className="w-full object-contain" />
    </div>
  );
};

