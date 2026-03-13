import React from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#050505] text-white font-sans overflow-hidden relative">
      {/* Ambient Glow Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#ff0080] ambient-blob animate-[ambient-blob-1_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-[#8000ff] ambient-blob animate-[ambient-blob-2_25s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-[#0080ff] ambient-blob animate-[ambient-blob-3_22s_ease-in-out_infinite]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-md px-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="mb-8 p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          <Settings className="w-12 h-12 text-cyan-400" />
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-google font-bold tracking-tighter mb-6 flex items-center justify-center gap-1">
          salaris<span className="text-cyan-500">ai</span>
        </h1>
        
        <div className="glass-panel px-8 py-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-3 text-white">Техническое обслуживание</h2>
          <p className="text-gray-400 leading-relaxed">
            Ведутся технические работы командой SalarisAI. Мы вернемся совсем скоро!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
