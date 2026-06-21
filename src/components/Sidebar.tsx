import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SquarePen, Pencil, Trash2, MoreHorizontal, X } from 'lucide-react';
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
  getAccentClass: (type: 'bg' | 'text' | 'border' | 'shadow' | 'hover') => string;
  user?: any;
  profile?: { display_name?: string, avatar_url?: string } | null;
  getAvatarColor?: (name: string) => string;
  setIsSettingsOpen?: (open: boolean) => void;
  style?: React.CSSProperties;
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
  getAccentClass,
  user,
  profile,
  getAvatarColor,
  setIsSettingsOpen: setSettingsOpenApp,
  style,
}: SidebarProps) => {
  const [overscroll, setOverscroll] = useState(0);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        x: isSidebarOpen ? 0 : '-100%',
        opacity: isSidebarOpen ? 1 : 0
      }}
      transition={{ 
        type: "spring",
        damping: 40,
        stiffness: 400,
        mass: 1,
        restDelta: 0.001
      }}
      style={{ ...style, willChange: 'transform, opacity' }}
      className={`fixed inset-y-0 left-0 w-[70vw] md:w-72 flex flex-col z-[100] ${
        theme === 'dark' 
          ? 'bg-[#000000] text-white shadow-[10px_0_30px_rgba(0,0,0,0.5)]' 
          : 'bg-[#f5f0e6] text-black shadow-[10px_0_30px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div className="pt-6 px-6 pb-2 flex items-center justify-between">
        <h1 className={`text-3xl font-outfit font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'} flex items-center`}>
          <span className="flex items-center">
            Salaris<span className={getAccentClass('text')}>AI</span>
          </span>
        </h1>
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 1.1 }}
          onClick={handleNewChat}
          className={`w-12 h-12 flex items-center justify-center rounded-full border flex-shrink-0 transition-colors cursor-pointer overflow-hidden ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white hover:bg-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 text-black hover:bg-gray-50 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
        >
          <SquarePen className="w-6 h-6" />
        </motion.button>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {isSearchVisible && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="px-4 pb-4 flex items-center overflow-hidden"
          >
            <div 
              className={`flex-1 flex items-center gap-1.5 px-3 h-11 rounded-full border transition-colors ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 text-black shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <div className="flex items-center justify-center">
                <Search className={`w-[18px] h-[18px] flex-shrink-0 ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => { if (!searchQuery) setIsSearchFocused(false); }}
                className={`bg-transparent border-none outline-none w-full text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                autoFocus
                placeholder="Поиск..."
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              onClick={() => {
                setIsSearchVisible(false);
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              className={`w-[44px] ml-2 h-11 flex items-center justify-center rounded-full border flex-shrink-0 transition-colors overflow-hidden ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white hover:bg-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 text-black hover:bg-gray-50 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <X className="w-[18px] h-[18px] flex-shrink-0" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
        <div 
          className="flex-1 overflow-y-auto p-4 pb-24 flex gap-4 overscroll-none"
          onScroll={(e) => {
            const target = e.currentTarget;
            if (target.scrollTop < 0) {
              setOverscroll(target.scrollTop);
            } else if (target.scrollTop + target.clientHeight > target.scrollHeight) {
              setOverscroll(target.scrollTop + target.clientHeight - target.scrollHeight);
            } else if (overscroll !== 0) {
              setOverscroll(0);
            }
          }}
        >
          <div className="flex flex-col gap-4 flex-1">
            <AnimatePresence mode="popLayout">
              {filteredChats.filter((_, i) => i % 2 === 0).map((chat, localIdx) => {
                const userMsg = chat.messages?.find(m => m.role === 'user')?.content || chat.title;
                const aiMsg = chat.messages?.find(m => m.role === 'model')?.content || '';
                // Calculate stretch: 
                // negative overscroll (top border): top items stretch down more.
                // positive overscroll (bottom border): bottom items stretch up more.
                const stretchY = overscroll < 0 
                  ? -overscroll * (1 - (localIdx * 0.15)) // Top overscroll stretches downwards, less for lower items
                  : overscroll > 0
                    ? -overscroll * (1 - ((filteredChats.length/2 - localIdx) * 0.15)) // Bottom overscroll stretches upwards
                    : 0;
                
                // clamp stretchY direction
                const finalY = overscroll < 0 ? Math.max(0, stretchY) : Math.min(0, stretchY);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: finalY }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, layout: { type: "spring", stiffness: 400, damping: 30 } }}
                    style={{ willChange: "transform, opacity" }}
                    key={chat.id}
                    onClick={() => { 
                      if (editingChatId !== chat.id) { 
                        setActiveChatId(chat.id); 
                        setIsLoading(false);
                        setIsSidebarOpen(false); 
                      } 
                    }}
                    className={`group w-full shrink-0 flex flex-col p-4 rounded-3xl text-left transition-all duration-300 cursor-pointer border relative overflow-hidden aspect-[4/5] hover:-translate-y-1 ${
                      activeChatId === chat.id 
                        ? (theme === 'dark' ? 'bg-white/10 border-white/20 shadow-[0_8px_40px_rgba(255,255,255,0.02)]' : 'bg-[#e2dacb] border-black/10 shadow-[0_8px_40px_rgba(0,0,0,0.05)]') 
                        : (theme === 'dark' ? 'bg-[#111111] border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-white/10' : 'bg-white/40 border-transparent shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:bg-[#e2dacb] hover:border-black/5')
                    }`}
                  >
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <span className={`font-serif text-lg font-bold line-clamp-3 leading-snug ${theme === 'dark' ? 'text-white' : 'text-black'}`} style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        {userMsg}
                      </span>
                      {aiMsg && (
                        <span className={`text-xs line-clamp-4 leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                          {aiMsg}
                        </span>
                      )}
                      {chat.matchText && (
                        <span className="text-xs truncate text-orange-500 mt-0.5">{chat.matchText}</span>
                      )}
                    </div>
                    
                    {/* More Menu */}
                    <div className="absolute right-2 top-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          onOpenChatMenu(chat, rect);
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-white/60 text-black hover:bg-white'}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          <div className="flex flex-col gap-4 flex-1 pt-8">
            <AnimatePresence mode="popLayout">
              {filteredChats.filter((_, i) => i % 2 !== 0).map((chat, localIdx) => {
                const userMsg = chat.messages?.find(m => m.role === 'user')?.content || chat.title;
                const aiMsg = chat.messages?.find(m => m.role === 'model')?.content || '';
                const stretchY = overscroll < 0 
                  ? -overscroll * (1 - (localIdx * 0.15))
                  : overscroll > 0
                    ? -overscroll * (1 - ((filteredChats.length/2 - localIdx) * 0.15))
                    : 0;
                
                const finalY = overscroll < 0 ? Math.max(0, stretchY) : Math.min(0, stretchY);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: finalY }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, layout: { type: "spring", stiffness: 400, damping: 30 } }}
                    style={{ willChange: "transform, opacity" }}
                    key={chat.id}
                    onClick={() => { 
                      if (editingChatId !== chat.id) { 
                        setActiveChatId(chat.id); 
                        setIsLoading(false);
                        setIsSidebarOpen(false); 
                      } 
                    }}
                    className={`group w-full shrink-0 flex flex-col p-4 rounded-3xl text-left transition-all duration-300 cursor-pointer border relative overflow-hidden aspect-[4/5] hover:-translate-y-1 ${
                      activeChatId === chat.id 
                        ? (theme === 'dark' ? 'bg-white/10 border-white/20 shadow-[0_8px_40px_rgba(255,255,255,0.02)]' : 'bg-[#e2dacb] border-black/10 shadow-[0_8px_40px_rgba(0,0,0,0.05)]') 
                        : (theme === 'dark' ? 'bg-[#111111] border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-white/10' : 'bg-white/40 border-transparent shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:bg-[#e2dacb] hover:border-black/5')
                    }`}
                  >
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <span className={`font-serif text-lg font-bold line-clamp-3 leading-snug ${theme === 'dark' ? 'text-white' : 'text-black'}`} style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        {userMsg}
                      </span>
                      {aiMsg && (
                        <span className={`text-xs line-clamp-4 leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                          {aiMsg}
                        </span>
                      )}
                      {chat.matchText && (
                        <span className="text-xs truncate text-orange-500 mt-0.5">{chat.matchText}</span>
                      )}
                    </div>
                    
                    {/* More Menu */}
                    <div className="absolute right-2 top-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          onOpenChatMenu(chat, rect);
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-white/60 text-black hover:bg-white'}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Floating Controls */}
        <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 flex justify-between items-center z-10 pointer-events-none">
          {/* Profile Icon */}
          <div className="pointer-events-auto overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (setSettingsOpenApp) setSettingsOpenApp(true);
                // Also close the sidebar on mobile if needed, but App.tsx does not check this explicitly; 
                // wait, if we open settings, maybe close sidebar
                // setIsSidebarOpen(false); 
              }}
              className={`h-12 px-2 pr-4 flex items-center gap-3 rounded-full border transition-colors cursor-pointer ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white hover:bg-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)] backdrop-blur-xl' : 'bg-white/30 border-white/40 text-black hover:bg-gray-50 shadow-[0_4px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor ? getAvatarColor(profile?.display_name || user?.email || 'U') : 'bg-gradient-to-tr from-purple-500 to-orange-400'}`}>
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  (profile?.display_name || user?.email || 'U')[0]?.toUpperCase()
                )}
              </div>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {profile?.display_name || user?.email?.split('@')[0] || 'Пользователь'}
              </span>
            </motion.button>
          </div>

          {/* Floating Search Button */}
          <AnimatePresence>
            {!isSearchVisible && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 1.1 }}
                onClick={() => setIsSearchVisible(true)}
                className={`w-12 h-12 flex items-center justify-center rounded-full border flex-shrink-0 transition-colors pointer-events-auto cursor-pointer overflow-hidden ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white hover:bg-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)] backdrop-blur-xl' : 'bg-white/30 border-white/40 text-black hover:bg-gray-50 shadow-[0_4px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl'}`}
              >
                <Search className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
    </motion.aside>
  );
});

export default Sidebar;
