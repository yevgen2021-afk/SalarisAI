import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface RenameChatModalProps {
  theme: string;
  editingChatId: string | null;
  setEditingChatId: (val: string | null) => void;
  editingTitle: string;
  setEditingTitle: (val: string) => void;
  saveChatTitle: (id: string) => void;
  getAccentClass: (type: 'bg' | 'text' | 'border' | 'shadow' | 'hover') => string;
}

export const RenameChatModal: React.FC<RenameChatModalProps> = ({
  theme,
  editingChatId,
  setEditingChatId,
  editingTitle,
  setEditingTitle,
  saveChatTitle,
  getAccentClass
}) => {
  return (
    <AnimatePresence>
      {editingChatId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingChatId(null)}
            style={{ willChange: "opacity" }}
            className="absolute inset-0 bg-black/10"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 500, mass: 0.8 }}
            style={{ willChange: "transform, opacity" }}
            className={`relative w-full max-w-[300px] rounded-[2rem] overflow-hidden border ${
              theme === 'dark' 
                ? 'bg-black/40 border-white/20 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' 
                : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'
            } backdrop-blur-xl`}
          >
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 text-left ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Переименовать чат
              </h3>
              <div className="relative group">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveChatTitle(editingChatId);
                    if (e.key === 'Escape') setEditingChatId(null);
                  }}
                  autoFocus
                  placeholder="Название"
                  className={`appearance-none border border-transparent shadow-none w-full py-3 px-5 text-base transition-all duration-300 focus:outline-none focus:ring-0 rounded-full ${
                    theme === 'dark' 
                      ? 'bg-black/40 text-white placeholder-white/40' 
                      : 'bg-gray-300 text-black placeholder-black/60'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setEditingChatId(null)}
                className={`appearance-none border border-transparent shadow-none flex-1 py-3 text-sm font-medium transition-colors rounded-full ${
                  theme === 'dark' 
                    ? 'bg-black/40 text-white hover:bg-white/20 active:bg-white/30' 
                    : 'bg-gray-300 text-black hover:bg-gray-400 active:bg-gray-500'
                }`}
              >
                Отмена
              </button>
              <button
                onClick={() => saveChatTitle(editingChatId)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors text-white rounded-full ${getAccentClass('bg')} ${getAccentClass('hover')}`}
              >
                Продолжить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
