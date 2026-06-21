import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface DeleteAllChatsModalProps {
  theme: string;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (val: boolean) => void;
  confirmDeleteAllChats: () => void;
}

export const DeleteAllChatsModal: React.FC<DeleteAllChatsModalProps> = ({
  theme,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  confirmDeleteAllChats
}) => {
  return (
    <AnimatePresence>
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteConfirmOpen(false)}
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
              <h3 className={`text-lg font-semibold mb-2 text-left ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Удалить все чаты?
              </h3>
              <p className={`text-sm text-left leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Данное действие приведет к удалению всех ваших чатов. После удаления чаты не получится восстановить.
              </p>
            </div>
            
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className={`appearance-none border border-transparent shadow-none flex-1 py-3 text-sm font-medium transition-colors rounded-full ${
                  theme === 'dark' 
                    ? 'bg-black/40 text-white hover:bg-white/20 active:bg-white/30' 
                    : 'bg-gray-300 text-black hover:bg-gray-400 active:bg-gray-500'
                }`}
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteAllChats}
                className="flex-1 py-3 text-sm font-semibold transition-colors bg-red-500 text-white hover:bg-red-600 active:bg-red-700 rounded-full"
              >
                Удалить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
