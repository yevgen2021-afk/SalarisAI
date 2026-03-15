import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BannedScreenProps {
  theme: 'dark' | 'light';
  onLogout: () => void;
}

export default function BannedScreen({ theme, onLogout }: BannedScreenProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-[400px] p-8 rounded-[2rem] border shadow-xl text-center ${
          theme === 'dark' 
            ? 'bg-[#1a1a1a] border-red-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
            : 'bg-white border-red-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
        }`}
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Аккаунт заблокирован
        </h1>
        
        <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Ваш доступ к приложению был ограничен администратором. Если вы считаете, что произошла ошибка, пожалуйста, свяжитесь с поддержкой.
        </p>

        <button
          onClick={handleLogout}
          className={`w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-red-500 hover:bg-red-600 text-white`}
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>
      </motion.div>
    </div>
  );
}
