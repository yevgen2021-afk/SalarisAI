import React from 'react';

interface SalarisLogoProps {
  className?: string;
}

export const SalarisLogo: React.FC<SalarisLogoProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        fill="#8B5CF6" 
        d="M48 15C33 15 23 30 23 45C23 53 27 61 35 68C28 73 20 78 12 76C25 81 40 83 50 75C58 80 72 80 82 72C73 68 68 60 67 52C73 43 65 25 48 15Z" 
      />
      <circle cx="82" cy="35" r="5" fill="#8B5CF6"/>
      <circle cx="20" cy="30" r="4" fill="#8B5CF6"/>
      <circle cx="75" cy="20" r="3" fill="#8B5CF6"/>
      <circle cx="35" cy="85" r="3.5" fill="#8B5CF6"/>
      <circle cx="68" cy="88" r="2.5" fill="#8B5CF6"/>
    </svg>
  );
};
