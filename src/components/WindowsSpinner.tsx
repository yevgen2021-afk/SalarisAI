import React from 'react';

interface WindowsSpinnerProps {
  className?: string;
  colorClass?: string;
}

export const WindowsSpinner: React.FC<WindowsSpinnerProps> = ({ 
  className = 'w-10 h-10',
  colorClass = 'text-current' 
}) => {
  return (
    <div className={`win10-spinner relative ${className} ${colorClass}`}>
      <div className="circle"></div>
      <div className="circle"></div>
      <div className="circle"></div>
      <div className="circle"></div>
      <div className="circle"></div>
      <div className="circle"></div>
    </div>
  );
};
