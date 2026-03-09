import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { UNSPLASH_FALLBACK_IMAGE } from '../constants';

interface DashboardProps {
  data: {
    temp: number | null;
    wind: number | null;
    weatherCode: number | null;
  };
  theme: 'dark' | 'light';
  onActionClick: (text: string) => void;
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

const Dashboard = ({ data, theme, onActionClick }: DashboardProps) => {
  return (
    <div className="flex-1 flex flex-col items-start justify-end relative w-full h-full pb-4 md:pb-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ willChange: "transform, opacity" }}
        className="relative z-10 flex flex-col w-full max-w-5xl px-0 items-start"
      >
        {/* Widgets Container */}
        <div className="flex flex-col items-start gap-3 mb-8">
          {/* Weather Widget */}
          <div 
            className="relative overflow-hidden group flex items-center gap-3 px-5 py-3 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.2)] text-white cursor-pointer hover:scale-[1.02] transition-transform border border-white/10 w-fit"
          >
            {/* Grass Background */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: `url('${UNSPLASH_FALLBACK_IMAGE}')` }}
            />
            
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/40 to-transparent"></div>

            <span className="relative z-10 text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">☀️</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {data.temp !== null ? `${data.temp}°C` : '--°C'}
              {data.wind !== null ? `, Ветер ${data.wind} км/ч` : ''}
            </span>
          </div>

          {/* Image Widget */}
          <HoverWidget 
            onClick={() => onActionClick("Нарисуй ")}
            glowColor="rgba(253, 224, 71, 0.4)"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_8px_16px_rgba(251,191,36,0.3)] text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border border-yellow-300/30 w-fit"
          >
            <span className="relative z-10 text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">🌷</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              Изображение
            </span>
          </HoverWidget>

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
        <div className={`font-montserrat font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <div className="text-lg">Здравствуйте. Я — SalarisAI.</div>
          <div className="text-2xl mt-1">Чем могу помочь?</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
