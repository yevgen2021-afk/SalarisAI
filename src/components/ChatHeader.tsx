import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SquarePen } from 'lucide-react';
import { Chat } from '../types';

export interface ChatHeaderProps {
  theme: string;
  isScrolled: boolean;
  activeChat: Chat;
  isSettingsOpen: boolean;
  handleNewChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  theme,
  isScrolled,
  activeChat,
  isSettingsOpen,
  handleNewChat,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-4 md:px-8 pt-4 pb-12 flex items-start justify-between pointer-events-none">
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
          isScrolled && activeChat.messages.length > 0 ? 'opacity-100' : 'opacity-0'
        } backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_30%,transparent)]`}
      />
      
      <div className="relative z-10 flex flex-col items-start justify-start w-1/3 pointer-events-auto">
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start w-1/3 pointer-events-auto">
      </div>
      
      <div className="relative z-10 flex justify-end items-start w-1/3 pointer-events-auto h-11">
        <AnimatePresence initial={false}>
          {!isSettingsOpen && (
            <motion.div
              key="settings-button-wrapper"
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: { type: "spring", damping: 25, stiffness: 500 } }}
              exit={{ scale: 0, transition: { duration: 0.1, ease: "easeOut" } }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                scale: { type: "spring", stiffness: 500, damping: 30 }
              }}
              style={{ transformOrigin: 'right center', willChange: "transform" }}
              className={`absolute right-0 flex items-center h-11 rounded-full border transition-colors overflow-hidden backdrop-blur-xl ${
                theme === 'dark' 
                  ? 'bg-black/40 border-white/10 text-white shadow-[0_4px_40px_rgba(0,0,0,0.04)]' 
                  : 'bg-white/30 border-white/40 text-black shadow-[0_4px_40px_rgba(0,0,0,0.08)]'
              }`}
            >
              <button 
                onClick={handleNewChat}
                disabled={activeChat.messages.length === 0}
                className={`w-11 h-11 flex items-center justify-center transition-opacity ${activeChat.messages.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                title="Новый чат"
              >
                <SquarePen className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
