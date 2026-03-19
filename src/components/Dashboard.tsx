import React, { useRef } from 'react';
import { motion } from 'motion/react';

interface DashboardProps {
  theme: 'dark' | 'light';
  onActionClick: (text: string) => void;
  userName?: string;
}

const HoverWidget = ({ children, className, glowColor, onClick }: { children: React.ReactNode, className?: string, glowColor: string, onClick?: () => void }) => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`relative overflow-hidden group ${className}`}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-20 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120px circle at var(--mouse-x) var(--mouse-y), var(--glow-color), transparent 100%)`,
        }}
      />
      {children}
    </div>
  );
};

const Dashboard = React.memo(({ theme, onActionClick, userName }: DashboardProps) => {
  const displayName = userName || 'пользователь';

  return (
    <div className="flex-1 flex flex-col items-start justify-end relative w-full h-full pb-4 md:pb-10">
      <div 
        className="relative z-10 flex flex-col w-full max-w-5xl px-0 items-start"
      >
        {/* Widgets Container */}
        <div className="flex flex-col items-start gap-3 mb-8">
          {/* Action Widget */}
          <HoverWidget 
            onClick={() => onActionClick("Укрась мой день")}
            glowColor="rgba(255, 255, 255, 0.2)"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-gray-500 to-gray-700 shadow-[0_8px_16px_rgba(107,114,128,0.3)] text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border border-gray-400/20 w-fit"
          >
            <span className="relative z-10 text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">❓</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Укрась мой день</span>
          </HoverWidget>
        </div>

        {/* Header Text */}
        <div 
          className={`font-montserrat font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}
        >
          <div className="text-lg">Привет, {displayName}!</div>
          <div className="text-2xl mt-1">С чего начнем?</div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
