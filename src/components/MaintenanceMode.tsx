import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

export default function MaintenanceMode() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] px-6 text-center overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="ambient-blob w-[500px] h-[500px] bg-cyan-500/20 top-[-10%] left-[-10%] animate-pulse" />
        <div className="ambient-blob w-[400px] h-[400px] bg-purple-500/20 bottom-[-5%] right-[-5%] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-lg"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="mb-8 p-6 rounded-[2.5rem] bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl"
        >
          <Settings className="w-16 h-16 text-cyan-500" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-display font-bold mb-6 text-gray-900 dark:text-white leading-tight">
          Упс... кажется, на сервере технические работы.
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 font-sans leading-relaxed">
          Мы готовим нечто большое, то, что должно увидеть свет.
        </p>

        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
          className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mt-10"
        />
      </motion.div>

      {/* Footer text */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 text-xs font-mono uppercase tracking-[0.2em] text-gray-500"
      >
        Maintenance Mode • Salaris AI
      </motion.div>
    </div>
  );
}
