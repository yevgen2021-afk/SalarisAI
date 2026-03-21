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
        <div className="flex flex-wrap items-start gap-3 mb-8 w-full">
          {/* Action Widget 1 */}
          <HoverWidget 
            onClick={() => onActionClick("Укрась мой день")}
            glowColor={theme === 'dark' ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}
            className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-white/20 text-white' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 border-black/10 text-gray-900'
            }`}
          >
            <span className="relative z-10 text-xl">❓</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide">Укрась мой день</span>
          </HoverWidget>

          {/* Action Widget 2 */}
          <HoverWidget 
            onClick={() => onActionClick("Помоги мне с кодом")}
            glowColor="rgba(59, 130, 246, 0.3)"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border border-blue-400/20"
          >
            <span className="relative z-10 text-xl">💻</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide">Помоги мне с кодом</span>
          </HoverWidget>

          {/* Action Widget 3 */}
          <HoverWidget 
            onClick={() => onActionClick("Напиши письмо")}
            glowColor="rgba(16, 185, 129, 0.3)"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border border-emerald-400/20"
          >
            <span className="relative z-10 text-xl">✉️</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide">Напиши письмо</span>
          </HoverWidget>

          {/* Action Widget 4 */}
          <HoverWidget 
            onClick={() => onActionClick("Объясни концепцию")}
            glowColor="rgba(245, 158, 11, 0.3)"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border border-amber-400/20"
          >
            <span className="relative z-10 text-xl">💡</span>
            <span className="relative z-10 text-[14px] font-medium tracking-wide">Объясни концепцию</span>
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
