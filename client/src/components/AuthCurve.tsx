import React from 'react';

export const AuthCurve: React.FC = () => {
  return (
    <svg
      viewBox="0 0 1440 200"
      className="absolute bottom-full left-0 w-full translate-y-1 block"
      style={{ zIndex: 10, height: '40px' }}
      preserveAspectRatio="none"
    >
      <path
        fill="#ffffff"
        fillOpacity="1"
        d="M0,200 C360,0, 1080,0, 1440,200 Z"
      ></path>
    </svg>
  );
};
