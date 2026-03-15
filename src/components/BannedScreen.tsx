import { motion } from 'motion/react';
import { LogOut, ShieldAlert, Mail } from 'lucide-react';

interface BannedScreenProps {
  theme: 'dark' | 'light';
  onLogout: () => void;
  userEmail?: string;
}

export default function BannedScreen({ theme, onLogout, userEmail }: BannedScreenProps) {
  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#f8f9fa]'}`}>
      {/* Ambient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-red-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-orange-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full max-w-md p-8 rounded-3xl border shadow-2xl ${
          theme === 'dark' 
            ? 'bg-[#111111]/80 border-white/10 text-white backdrop-blur-xl' 
            : 'bg-white/80 border-gray-200 text-gray-900 backdrop-blur-xl'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold mb-2 tracking-tight">Ваш аккаунт заблокирован</h1>
          <p className={`mb-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Мы обнаружили нарушение правил использования сервиса. Доступ к функциям SalarisAI ограничен.
          </p>

          <div className={`w-full p-4 rounded-2xl mb-8 text-left ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-4 h-4 opacity-50" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-50">Ваш email</span>
            </div>
            <div className="font-mono text-sm truncate">{userEmail || 'Неизвестно'}</div>
          </div>

          <div className="space-y-3 w-full">
            <a 
              href="mailto:support@salaris.ai" 
              className={`flex items-center justify-center w-full h-12 rounded-xl font-bold transition-all ${
                theme === 'dark' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Связаться с поддержкой
            </a>
            
            <button 
              onClick={onLogout}
              className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold border transition-all ${
                theme === 'dark' 
                  ? 'border-white/10 hover:bg-white/5' 
                  : 'border-gray-200 hover:bg-black/5'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Выйти из системы
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
