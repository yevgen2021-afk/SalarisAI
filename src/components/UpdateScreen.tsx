import React from 'react';
import { WindowsSpinner } from './WindowsSpinner';

export default function UpdateScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center" style={{ backdropFilter: 'blur(20px)' }}>
      <WindowsSpinner className="w-16 h-16 glow" colorClass="text-white" />
      
      <h1 className="mt-12 text-5xl font-outfit font-bold tracking-tight text-white mb-4">
        SalarisAI 2.0
      </h1>
      
      <p className="text-white/60 font-medium tracking-wide">
        Сейчас идет обновление серверов
      </p>
    </div>
  );
}
