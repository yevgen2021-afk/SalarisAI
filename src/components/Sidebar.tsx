import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SquarePen, Pencil, Trash2 } from 'lucide-react';
import { Chat } from '../types';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  handleNewChat: () => void;
  filteredChats: (Chat & { matchText: string | null })[];
  activeChatId: string;
  setActiveChatId: (id: string) => void;
  startEditingChat: (e: React.MouseEvent, id: string, currentTitle: string) => void;
  deleteChat: (e: React.MouseEvent, id: string) => void;
  setIsLoading: (loading: boolean) => void;
  editingChatId: string | null;
  isMobile: boolean;
}

const Sidebar = React.memo(({
  isSidebarOpen,
  setIsSidebarOpen,
  theme,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  handleNewChat,
  filteredChats,
  activeChatId,
  setActiveChatId,
  startEditingChat,
  deleteChat,
  setIsLoading,
  editingChatId,
  isMobile
}: SidebarProps) => {
  return (
    <motion.aside 
      initial={false}
      animate={{ 
        opacity: isSidebarOpen ? 1 : 0,
        x: isSidebarOpen ? 0 : -20,
      }}
      transition={{ 
        type: "spring",
        damping: 40,
        stiffness: 400,
        mass: 1,
        restDelta: 0.001
      }}
      style={{ willChange: 'transform, opacity' }}
      className={`fixed inset-y-0 left-0 w-[70vw] md:w-72 overflow-hidden flex flex-col z-0 ${
        theme === 'dark' 
          ? 'bg-[#050505] text-white' 
          : 'bg-white text-gray-900'
      }`}
    >
      <div className="p-4 pb-12 flex items-center">
        <motion.div 
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`flex-1 flex items-center gap-2 px-4 h-11 rounded-full shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
        >
          <motion.div className="flex items-center justify-center">
            <Search className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
          </motion.div>
          <motion.input 
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => { if (!searchQuery) setIsSearchFocused(false); }}
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-gray-400"
          />
        </motion.div>
        <AnimatePresence mode="popLayout" initial={false}>
          {!isSearchFocused && (
            <motion.button 
              layout
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              transition={{ 
                duration: 0.3, 
                ease: "easeInOut",
                scale: { type: "spring", stiffness: 500, damping: 30 }
              }}
              style={{ willChange: "transform, opacity" }}
              onClick={handleNewChat}
              className={`w-[44px] ml-2 h-11 flex items-center justify-center rounded-full shadow-md border flex-shrink-0 transition-colors overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white hover:bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black hover:bg-gray-50 shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
            >
              <SquarePen className="w-[18px] h-[18px] flex-shrink-0" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence mode="popLayout">
          {filteredChats.map(chat => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              style={{ willChange: "transform, opacity" }}
              key={chat.id}
              onClick={() => { 
                if (editingChatId !== chat.id) { 
                  setActiveChatId(chat.id); 
                  setIsLoading(false);
                  setIsSidebarOpen(false); 
                } 
              }}
              className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-[22px] text-left transition-colors cursor-pointer ${
                activeChatId === chat.id 
                  ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black') 
                  : (theme === 'dark' ? 'text-gray-400 hover:bg-white/5 active:bg-white/10 hover:text-gray-200' : 'text-black hover:bg-black/5 active:bg-black/10')
              }`}
            >
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-sm truncate font-medium">{chat.title}</span>
                {chat.matchText && (
                  <span className="text-xs truncate opacity-60 mt-0.5">{chat.matchText}</span>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                <motion.button 
                  whileTap={{ scale: 1.2 }}
                  style={{ willChange: "transform" }}
                  onClick={(e) => startEditingChat(e, chat.id, chat.title)}
                  className="p-1.5 hover:bg-gray-500/20 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 1.2 }}
                  style={{ willChange: "transform" }}
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
});

export default Sidebar;
