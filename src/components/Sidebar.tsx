import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SquarePen, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
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
  setIsLoading: (loading: boolean) => void;
  editingChatId: string | null;
  onOpenChatMenu: (chat: Chat, rect: DOMRect) => void;
  activeChatMenu: { chat: Chat, rect: DOMRect } | null;
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
  setIsLoading,
  editingChatId,
  onOpenChatMenu,
  activeChatMenu,
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
      className={`fixed inset-y-0 left-0 w-[70vw] md:w-72 flex flex-col z-0 ${
        theme === 'dark' 
          ? 'bg-[#050505] text-white' 
          : 'bg-white text-gray-900'
      }`}
    >
      <div className="p-4 pb-12 flex items-center">
        <div 
          className={`flex-1 flex items-center gap-2 px-4 h-11 rounded-full shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
        >
          <div className="flex items-center justify-center">
            <Search className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
          </div>
          <input 
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => { if (!searchQuery) setIsSearchFocused(false); }}
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-gray-400"
          />
        </div>
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
              whileTap={{ scale: 0.95 }}
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
              className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-left transition-colors cursor-pointer ${
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

              <div 
                className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 relative"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="relative w-7 h-7 mr-2 flex-shrink-0">
                  <AnimatePresence initial={false}>
                    {activeChatMenu?.chat.id !== chat.id && (
                      <motion.div
                        key="more-button-wrapper"
                        className="absolute inset-0"
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
                        style={{ willChange: "transform" }}
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            onOpenChatMenu(chat, rect);
                          }}
                          className={`w-full h-full flex items-center justify-center rounded-full shadow-md border transition-colors cursor-pointer ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
                        >
                          <MoreHorizontal className="w-[14px] h-[14px]" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
});

export default Sidebar;
