import React from 'react';
import { motion } from 'motion/react';
import { Flag, LogOut } from 'lucide-react';

interface BlockedScreenProps {
  theme: 'dark' | 'light';
  onLogout: () => void;
}

export default function BlockedScreen({ theme, onLogout }: BlockedScreenProps) {
  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-md p-8 rounded-[2.5rem] border text-center ${
          theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
        } shadow-2xl`}
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Flag className="w-10 h-10 text-red-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Доступ ограничен
        </h2>
        <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Ваш аккаунт был заблокирован администрацией Salaris AI за нарушение правил использования сервиса.
        </p>
        <button
          onClick={onLogout}
          className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>
      </motion.div>
    </div>
  );
}
