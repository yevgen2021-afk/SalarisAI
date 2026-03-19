import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import localforage from 'localforage';
import { ArrowUp, ArrowDown, Menu, Settings, Trash2, Info, X, SquarePen, Plus, Paintbrush, ChevronLeft, Check, Square, AlertCircle, User, LogOut, Camera, Lightbulb, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Chat, Message } from './types';
import { generateGroqResponseStream } from './services/groq';
import ChatMessage from './components/ChatMessage';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import BlockedScreen from './components/BlockedScreen';
import ReportModal from './components/ReportModal';
import { supabase } from './lib/supabase';

const createNewChat = (): Chat => ({
  id: Date.now().toString(),
  title: 'Новый чат',
  messages: [],
  createdAt: Date.now()
});

const ACCENT_COLORS = [
  { id: 'laguna', name: 'Лагуна', bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', shadow: 'shadow-cyan-500/20', hover: 'hover:bg-cyan-600' },
  { id: 'pink', name: 'Румянец', bg: 'bg-pink-400', text: 'text-pink-400', border: 'border-pink-400', shadow: 'shadow-pink-400/20', hover: 'hover:bg-pink-500' },
  { id: 'purple', name: 'Аметист', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', shadow: 'shadow-purple-500/20', hover: 'hover:bg-purple-600' },
  { id: 'emerald', name: 'Мята', bg: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400', shadow: 'shadow-emerald-400/20', hover: 'hover:bg-emerald-500' },
  { id: 'red', name: 'Томат', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', shadow: 'shadow-red-500/20', hover: 'hover:bg-red-600' },
  { id: 'orange', name: 'Закат', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', shadow: 'shadow-orange-500/20', hover: 'hover:bg-orange-600' },
];

const ColorOptionButton = ({ color, theme, accentColor, setAccentColor, setIsSettingsInteracting, setSettingsView }: any) => {
  const controls = useAnimation();
  return (
    <motion.button
      animate={controls}
      onTapStart={async () => {
        setIsSettingsInteracting(true);
        await controls.start({ scale: 0.95, transition: { duration: 0.1 } });
        controls.start({ scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } });
      }}
      onTap={() => setIsSettingsInteracting(false)}
      onTapCancel={() => setIsSettingsInteracting(false)}
      onClick={() => {
        setAccentColor(color.id);
        setSettingsView('customization');
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-colors ${
        theme === 'dark' 
          ? 'hover:bg-white/10 active:bg-white/20 text-white' 
          : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full ${color.bg} shadow-sm`} />
        <span className="text-sm font-medium">
          {color.name}
        </span>
      </div>
      {accentColor === color.id && <Check className="w-4 h-4" />}
    </motion.button>
  );
};

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [chats, setChats] = useState<Chat[]>([createNewChat()]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [autoTheme, setAutoTheme] = useState<boolean>(false);
  const [accentColor, setAccentColor] = useState<string>('laguna');
  const [isGlowEnabled, setIsGlowEnabled] = useState<boolean>(true);

  // Auth & Report State
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [settingsView, setSettingsView] = useState<'main' | 'customization' | 'about' | 'account' | 'edit-profile' | 'color-selection'>('main');
  const [isSettingsInteracting, setIsSettingsInteracting] = useState(false);
  const [profile, setProfile] = useState<{ display_name?: string, avatar_url?: string } | null>(null);
  const [tempName, setTempName] = useState('');


  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, is_banned')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
      if (data.is_banned) {
        setIsBanned(true);
      } else {
        setIsBanned(false);
      }
    } else if (error) {
      console.error('Error fetching profile:', error);
      // Если профиль не найден (PGRST116)
      if (error.code === 'PGRST116') {
        console.warn('Profile not found. Verifying user existence...');
        // Проверяем, существует ли еще пользователь в auth
        const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !verifiedUser) {
          console.error('User no longer exists. Signing out...');
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
        }
      } else if (error.code === '42501' || error.message.toLowerCase().includes('permission denied') || error.message.toLowerCase().includes('jwt')) {
        // Ошибка прав доступа или JWT - скорее всего сессия недействительна
        console.warn('Access denied or invalid token. Verifying user existence...');
        const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !verifiedUser) {
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
        }
      }
    }
  } catch (err: any) {
      console.error('Unexpected error in fetchProfile:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile?.display_name) {
      setTempName(profile.display_name);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!supabase || !user || !tempName) return;
    if (tempName === profile?.display_name) {
      setSettingsView('main');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: tempName })
      .eq('id', user.id);
    
    if (error) {
      alert('Ошибка при обновлении профиля: ' + error.message);
    } else {
      setProfile(prev => prev ? { ...prev, display_name: tempName } : { display_name: tempName });
      setSettingsView('main');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      // 1. Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : { avatar_url: publicUrl });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      if (error.message === 'Load failed') {
        alert('Ошибка сети при загрузке аватара. Проверьте соединение.');
      } else {
        alert('Ошибка при загрузке аватара: ' + error.message);
      }
    }
  };

  const handleDeleteAccount = async () => {
    console.log('handleDeleteAccount called', { hasSupabase: !!supabase, hasUser: !!user });
    if (!supabase || !user) {
      alert('Ошибка: Supabase или пользователь не инициализированы. Проверьте подключение.');
      return;
    }
    
    const confirm = window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.');
    if (!confirm) return;

    setIsLoading(true);
    try {
      console.log('Calling RPC delete_user...');
      // Вызываем функцию удаления через RPC
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('RPC success, signing out...');
      // После удаления выходим из сессии
      await supabase.auth.signOut();
      setUser(null);
      setIsSettingsOpen(false);
      alert('Ваш аккаунт был успешно удален.');
    } catch (err: any) {
      console.error('Delete account error:', err);
      alert('Ошибка при удалении аккаунта: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsSettingsOpen(false);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-emerald-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isActionMenuInteracting, setIsActionMenuInteracting] = useState(false);
  const [actionMenuView, setActionMenuView] = useState<'main' | 'model'>('main');
  const [selectedModel, setSelectedModel] = useState<'llama-3.3-70b-versatile' | 'meta-llama/llama-4-scout-17b-16e-instruct'>('meta-llama/llama-4-scout-17b-16e-instruct');
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  
  const stateRef = useRef({ chats, activeChatId, isLoading, selectedModel, isThinkingMode, profile });
  useEffect(() => {
    stateRef.current = { chats, activeChatId, isLoading, selectedModel, isThinkingMode, profile };
  }, [chats, activeChatId, isLoading, selectedModel, isThinkingMode, profile]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const stopGenerationRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('Auth State:', { isLoaded, isAuthReady, user: user?.email, hasSupabase: !!supabase });
  }, [isLoaded, isAuthReady, user]);

  const [reportContext, setReportContext] = useState<{ messageId?: string, text?: string, type: 'report' | 'like' | 'dislike' } | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleStopGeneration = useCallback(() => {
    stopGenerationRef.current = true;
    setIsGenerating(false);
    setIsLoading(false);
  }, []);

  // Periodic check to verify user existence (handles external deletion)
  useEffect(() => {
    if (!supabase || !user) return;

    // Проверка раз в 30 секунд для быстрой реакции на блокировку/удаление
    const checkInterval = setInterval(async () => {
      try {
        const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !verifiedUser) {
          console.warn('User session invalid or user deleted externally. Signing out...');
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
          setIsBanned(false);
          return;
        }

        // Проверяем статус блокировки в профиле
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', verifiedUser.id)
          .single();
        
        if (profileError) {
          console.error('Error checking ban status in interval:', profileError);
          return;
        }
        
        console.log('Current ban status from DB:', profileData?.is_banned);
        
        if (profileData?.is_banned === true) {
          console.log('User is banned, showing blocked screen');
          setIsBanned(true);
        } else {
          setIsBanned(false);
        }
      } catch (err) {
        console.error('Interval check failed:', err);
      }
    }, 30000); 

    return () => clearInterval(checkInterval);
  }, [user]);

  // Load data from localforage on mount
  useEffect(() => {
    // Auth Listener
    if (supabase) {
      // Первичная проверка пользователя при загрузке
      // getUser() делает запрос к серверу, в отличие от getSession()
      supabase.auth.getUser().then(({ data: { user: initialUser }, error }) => {
        if (error || !initialUser) {
          if (error && error.message !== 'Auth session missing!') {
            console.error('Initial auth check error:', error.message);
            if (error.message === 'Load failed') {
              console.error('Network error: Supabase auth request failed (Load failed).');
            }
          }
          setUser(null);
        } else {
          setUser(initialUser);
        }
        setIsAuthReady(true);
      }).catch((err) => {
        console.error('Auth check promise rejected:', err);
        setIsAuthReady(true);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsBanned(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsAuthReady(true); // If no supabase configured, just proceed
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedChats = await localforage.getItem<Chat[]>('salaris_chats');
        const storedActiveChatId = await localforage.getItem<string>('salaris_active_chat');
        const storedTheme = await localforage.getItem<'dark' | 'light'>('salaris_theme');
        const storedAutoTheme = await localforage.getItem<boolean>('salaris_auto_theme');
        const storedAccentColor = await localforage.getItem<string>('salaris_accent');
        const storedGlow = await localforage.getItem<boolean>('salaris_glow');
        const storedModel = await localforage.getItem<string>('salaris_model');

        if (storedChats && storedChats.length > 0) {
          let newChats = storedChats;
          let newActiveId = storedActiveChatId;
          
          const emptyChat = storedChats.find(c => c.messages.length === 0);
          
          if (!emptyChat) {
            const newChat = createNewChat();
            newChats = [newChat, ...storedChats];
            newActiveId = newChat.id;
          } else {
            newActiveId = emptyChat.id;
            newChats = [emptyChat, ...storedChats.filter(c => c.id !== emptyChat.id)];
          }
          
          setChats(newChats);
          setActiveChatId(newActiveId!);
        } else {
          // Default chat is already set in useState, just ensure activeChatId matches
          const newChat = chats[0];
          setActiveChatId(newChat.id);
        }

        if (storedTheme) setTheme(storedTheme);
        if (storedAutoTheme !== null) setAutoTheme(storedAutoTheme);
        if (storedAccentColor) setAccentColor(storedAccentColor);
        if (storedGlow !== null) setIsGlowEnabled(storedGlow);
        if (['llama-3.3-70b-versatile', 'meta-llama/llama-4-scout-17b-16e-instruct'].includes(storedModel || '')) {
          setSelectedModel(storedModel as any);
        } else {
          setSelectedModel('meta-llama/llama-4-scout-17b-16e-instruct');
          localforage.setItem('salaris_model', 'meta-llama/llama-4-scout-17b-16e-instruct');
        }
      } catch (error) {
        // Silently handle localforage load errors
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Save data to localforage on changes (debounced for performance)
  useEffect(() => {
    if (!isLoaded) return;
    
    const timer = setTimeout(() => {
      localforage.setItem('salaris_chats', chats);
      localforage.setItem('salaris_active_chat', activeChatId);
      localforage.setItem('salaris_theme', theme);
      localforage.setItem('salaris_auto_theme', autoTheme);
      localforage.setItem('salaris_accent', accentColor);
      localforage.setItem('salaris_glow', isGlowEnabled);
      localforage.setItem('salaris_model', selectedModel);
    }, 1000);

    return () => clearTimeout(timer);
  }, [chats, activeChatId, theme, autoTheme, accentColor, isGlowEnabled, selectedModel, isLoaded]);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (!isActionMenuOpen) {
      const timer = setTimeout(() => setActionMenuView('main'), 150); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [isActionMenuOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Right swipe opens sidebar (from anywhere)
    if (isRightSwipe && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
    // Left swipe closes sidebar
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || chats[0], [chats, activeChatId]);

  const filteredChats = useMemo(() => {
    return chats.map(chat => {
      if (!searchQuery.trim()) return { ...chat, matchText: null };
      
      const query = searchQuery.toLowerCase();
      if (chat.title.toLowerCase().includes(query)) {
        return { ...chat, matchText: null };
      }

      const matchedMessage = chat.messages.find(m => m.content.toLowerCase().includes(query));
      if (matchedMessage) {
        const text = matchedMessage.content;
        const index = text.toLowerCase().indexOf(query);
        let snippet = text;
        if (index > 15) {
          snippet = '...' + text.substring(index - 10, index + query.length + 20);
        } else {
          snippet = text.substring(0, index + query.length + 20);
        }
        if (index + query.length + 20 < text.length) {
          snippet += '...';
        }
        return { ...chat, matchText: snippet };
      }

      return null;
    }).filter(Boolean) as (Chat & { matchText: string | null })[];
  }, [chats, searchQuery]);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    if (!autoTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    handleChange(mediaQuery as any);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [autoTheme]);

  useEffect(() => {
    if (!isSettingsOpen) {
      // Reset settings view when closed, after a small delay to allow exit animation
      const timer = setTimeout(() => {
        setSettingsView('main');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isSettingsOpen]);

  const getAccentClass = useCallback((type: 'bg' | 'text' | 'border' | 'shadow' | 'hover') => {
    const color = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];
    return color[type];
  }, [accentColor]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    
    setIsScrolled(scrollTop > 20);

    // If user scrolls up more than 150px from the bottom, they are manually scrolling
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    isUserScrolling.current = !isAtBottom;
    setShowScrollToBottom(!isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!isUserScrolling.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat.messages, scrollToBottom]);

  const handleNewChat = useCallback(() => {
    if (activeChat.messages.length === 0) {
      setIsSidebarOpen(false);
      return;
    }

    if (isGenerating) {
      handleStopGeneration();
    }

    const newChat = createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsLoading(false);
    setIsSidebarOpen(false);
    setSelectedFiles([]);
  }, [activeChat.messages.length, isGenerating, handleStopGeneration]);

  const deleteChat = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (id === activeChatId && isGenerating) {
      handleStopGeneration();
    }

    // We calculate the new state first to avoid side effects in the updater
    const filtered = chats.filter(c => c.id !== id);
    
    if (filtered.length === 0) {
      const newChat = createNewChat();
      setChats([newChat]);
      setActiveChatId(newChat.id);
    } else {
      setChats(filtered);
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id);
      }
    }
  }, [activeChatId, chats, setChats, setActiveChatId, isGenerating, handleStopGeneration]);

  const startEditingChat = useCallback((e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditingTitle(currentTitle);
  }, []);

  const saveChatTitle = useCallback((id: string) => {
    if (editingTitle.trim()) {
      setChats(prev => prev.map(chat => 
        chat.id === id ? { ...chat, title: editingTitle.trim() } : chat
      ));
    }
    setEditingChatId(null);
  }, [editingTitle]);

  const deleteAllChats = useCallback(() => {
    setIsDeleteConfirmOpen(true);
    setIsSettingsOpen(false);
  }, []);

  const confirmDeleteAllChats = useCallback(() => {
    if (isGenerating) {
      handleStopGeneration();
    }
    const newChat = createNewChat();
    setChats([newChat]);
    setActiveChatId(newChat.id);
    setIsLoading(false);
    setIsDeleteConfirmOpen(false);
    setIsSidebarOpen(false);
  }, [isGenerating, handleStopGeneration]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    // Reset manual scroll when sending a message
    isUserScrolling.current = false;
    setShowScrollToBottom(false);

    const userMsg = input.trim();
    const currentThinkingMode = isThinkingMode;
    const currentFiles = [...selectedFiles];
    
    setInput('');
    setSelectedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsThinkingMode(false);
    setIsLoading(true);
    setIsGenerating(true);
    stopGenerationRef.current = false;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMsg
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstUserMessage = chat.messages.length === 0;
        return {
          ...chat,
          title: isFirstUserMessage ? (userMsg || 'Изображение').slice(0, 25) + (userMsg.length > 25 ? '...' : '') : chat.title,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    }));

    const targetChatId = activeChatId;
    const modelMessageId = (Date.now() + 1).toString();

    try {
      const chatHistory = activeChat ? activeChat.messages : [];
      
      const stream = generateGroqResponseStream(userMsg, selectedModel, chatHistory, profile?.display_name);

      let isFirstChunk = true;
      let currentTyped = '';
      for await (const chunkText of stream) {
        if (stopGenerationRef.current) break;
        if (isFirstChunk) {
          setIsLoading(false); // Stop showing typing indicator once we start receiving the response
          // Add empty message first to start typing
          setChats(prev => prev.map(chat => {
            if (chat.id === targetChatId) {
              return { ...chat, messages: [...chat.messages, { id: modelMessageId, role: 'model', content: '', isTyping: true }] };
            }
            return chat;
          }));
          isFirstChunk = false;
        }
        
        currentTyped += chunkText;
        setChats(prev => prev.map(chat => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map(m => m.id === modelMessageId ? { ...m, content: currentTyped, isTyping: true } : m)
            };
          }
          return chat;
        }));
        if (stopGenerationRef.current) break;
      }
      setIsGenerating(false);

      // Finish typing
      setChats(prev => prev.map(chat => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: chat.messages.map(m => m.id === modelMessageId ? { ...m, isTyping: false } : m)
          };
        }
        return chat;
      }));
      setIsGenerating(false);
      setIsLoading(false);

    } catch (error) {
      setIsGenerating(false);
      setIsLoading(false);
      let errorText = 'Произошла ошибка связи с сервером. Пожалуйста, попробуйте позже.';
      if (error instanceof Error) {
        errorText = error.message;
        if (errorText.includes('429') || errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
          errorText = `Превышен лимит запросов к API Google (Quota Exceeded). Пожалуйста, подождите (лимиты сбрасываются) или проверьте ваш аккаунт Google AI Studio.`;
        } else if (errorText.includes('{')) {
          try {
            // Attempt to extract a cleaner message if it's JSON
            const match = errorText.match(/"message":\s*"([^"]+)"/);
            if (match && match[1]) {
              errorText = match[1].replace(/\\n/g, ' ');
            }
          } catch (e) {}
        }
      }
      
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          const hasModelMessage = chat.messages.some(m => m.id === modelMessageId);
          if (hasModelMessage) {
            return {
              ...chat,
              messages: chat.messages.map(m => {
                if (m.id === modelMessageId) {
                  const newContent = m.content.trim() === '{' || m.content.trim() === '' 
                    ? errorText 
                    : `${m.content}\n\n**Ошибка:** ${errorText}`;
                  return { ...m, content: newContent, isTyping: false };
                }
                return m;
              })
            };
          } else {
            const errorMessage: Message = { 
              id: (Date.now() + 1).toString(), 
              role: 'model', 
              content: errorText
            };
            return { ...chat, messages: [...chat.messages, errorMessage] };
          }
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeChatId, selectedModel, isThinkingMode, chats, profile]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    const { chats, activeChatId, isLoading, selectedModel, profile } = stateRef.current;
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || isLoading) return;
    
    // Reset manual scroll when regenerating
    isUserScrolling.current = false;
    setShowScrollToBottom(false);

    const msgIndex = chat.messages.findIndex(m => m.id === messageId);
    if (msgIndex <= 0) return;
    
    let lastUserMsgIndex = -1;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (chat.messages[i].role === 'user') {
        lastUserMsgIndex = i;
        break;
      }
    }
    if (lastUserMsgIndex === -1) return;
    
    const lastUserMsg = chat.messages[lastUserMsgIndex];
    const userMsgContent = lastUserMsg.content;
    
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: c.messages.slice(0, msgIndex)
        };
      }
      return c;
    }));
    
    setIsLoading(true);
    
    const targetChatId = activeChatId;
    const modelMessageId = Date.now().toString();

    try {
      const chatHistory = chat ? chat.messages.slice(0, lastUserMsgIndex) : [];
      
      const stream = generateGroqResponseStream(userMsgContent, selectedModel, chatHistory, profile?.display_name);

      let isFirstChunk = true;
      let currentTyped = '';
      for await (const chunkText of stream) {
        if (isFirstChunk) {
          setIsLoading(false);
          setChats(prev => prev.map(c => {
            if (c.id === targetChatId) {
              return { ...c, messages: [...c.messages, { id: modelMessageId, role: 'model', content: '', isTyping: true }] };
            }
            return c;
          }));
          isFirstChunk = false;
        }
        
        const tokens = chunkText.match(/(\s+|\S+)/g) || [];
        for (const token of tokens) {
          currentTyped += token;
          setChats(prev => prev.map(c => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map(m => m.id === modelMessageId ? { ...m, content: currentTyped, isTyping: true } : m)
              };
            }
            return c;
          }));
          await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 20));
        }
      }

      setChats(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === modelMessageId ? { ...m, isTyping: false } : m)
          };
        }
        return c;
      }));

    } catch (error) {
      let errorText = 'Произошла ошибка связи с сервером. Пожалуйста, попробуйте позже.';
      if (error instanceof Error) {
        errorText = error.message;
        if (errorText.includes('429') || errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
          errorText = `Превышен лимит запросов к API Google (Quota Exceeded). Пожалуйста, подождите (лимиты сбрасываются) или проверьте ваш аккаунт Google AI Studio.`;
        } else if (errorText.includes('{')) {
          try {
            const match = errorText.match(/"message":\s*"([^"]+)"/);
            if (match && match[1]) {
              errorText = match[1].replace(/\\n/g, ' ');
            }
          } catch (e) {}
        }
      }

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          const hasModelMessage = c.messages.some(m => m.id === modelMessageId);
          if (hasModelMessage) {
            return {
              ...c,
              messages: c.messages.map(m => {
                if (m.id === modelMessageId) {
                  const newContent = m.content.trim() === '{' || m.content.trim() === '' 
                    ? errorText 
                    : `${m.content}\n\n**Ошибка:** ${errorText}`;
                  return { ...m, content: newContent, isTyping: false };
                }
                return m;
              })
            };
          } else {
            const errorMessage: Message = { 
              id: (Date.now() + 1).toString(), 
              role: 'model', 
              content: errorText
            };
            return { ...c, messages: [...c.messages, errorMessage] };
          }
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReport = useCallback((messageId?: string) => {
    const { chats, activeChatId } = stateRef.current;
    if (messageId) {
      const chat = chats.find(c => c.id === activeChatId);
      const message = chat?.messages.find(m => m.id === messageId);
      if (message) {
        setReportContext({ messageId, text: message.content, type: 'report' });
      }
    } else {
      setReportContext({ type: 'report' });
    }
    setIsReportModalOpen(true);
    setIsSettingsOpen(false); // Close settings if opened from there
  }, []);

  const handleLike = useCallback((messageId: string) => {
    const { chats, activeChatId } = stateRef.current;
    const chat = chats.find(c => c.id === activeChatId);
    const message = chat?.messages.find(m => m.id === messageId);
    if (message) {
      setReportContext({ messageId, text: message.content, type: 'like' });
      setIsReportModalOpen(true);
    }
  }, []);

  const handleDislike = useCallback((messageId: string) => {
    const { chats, activeChatId } = stateRef.current;
    const chat = chats.find(c => c.id === activeChatId);
    const message = chat?.messages.find(m => m.id === messageId);
    if (message) {
      setReportContext({ messageId, text: message.content, type: 'dislike' });
      setIsReportModalOpen(true);
    }
  }, []);

  const submitReport = async (reason: string) => {
    if (!supabase || !user) {
      alert('Ошибка: База данных не подключена или вы не авторизованы.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const { error } = await supabase.from('reports').insert([
        {
          user_id: user.id,
          reason: reason,
          type: reportContext?.type || 'report',
          message_id: reportContext?.messageId || null,
          message_text: reportContext?.text || null,
          chat_id: activeChatId || null,
          model: selectedModel,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      
      setIsReportModalOpen(false);
      setReportContext(null);
      // Optional: show success toast
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Произошла ошибка при отправке жалобы.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!isLoaded || !isAuthReady) {
    return (
      <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#f8f9fa]'}`}>
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen theme={theme} accentColor={accentColor} onLoginSuccess={(u) => setUser(u)} />;
  }

  if (isBanned) {
    return <BlockedScreen theme={theme} onLogout={handleLogout} />;
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`flex h-screen ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-white text-gray-900'} font-sans selection:bg-red-500/30 overflow-hidden transition-colors duration-500 relative`}
    >
      
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        theme={theme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        handleNewChat={handleNewChat}
        filteredChats={filteredChats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        startEditingChat={startEditingChat}
        deleteChat={deleteChat}
        setIsLoading={setIsLoading}
        editingChatId={editingChatId}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <motion.div 
        animate={{ 
          x: isSidebarOpen ? (isMobile ? '70vw' : '288px') : 0,
          borderTopLeftRadius: isSidebarOpen ? '32px' : '0px',
          borderBottomLeftRadius: isSidebarOpen ? '32px' : '0px',
          borderLeftColor: isSidebarOpen 
            ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') 
            : 'rgba(0, 0, 0, 0)',
        }}
        transition={{ 
          type: "spring", 
          damping: 40, 
          stiffness: 400,
          mass: 1,
          restDelta: 0.001
        }}
        style={{ willChange: 'transform, border-radius' }}
        className={`flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden border-l shadow-2xl ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#f8f9fa]'}`}
      >
        {/* Ambient Glow Background - Moved inside to clip with rounded corners and move with content */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#ff0080] ambient-blob animate-[ambient-blob-1_20s_ease-in-out_infinite]"></div>
          <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-[#8000ff] ambient-blob animate-[ambient-blob-2_25s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-[#0080ff] ambient-blob animate-[ambient-blob-3_22s_ease-in-out_infinite]"></div>
          <div className="absolute top-[10%] right-[20%] w-[30vw] h-[30vw] bg-[#00ff80] ambient-blob animate-[ambient-blob-1_28s_ease-in-out_infinite_reverse]"></div>
        </div>

        {/* Overlay when sidebar is open */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                type: "spring",
                damping: 40,
                stiffness: 400,
                mass: 1
              }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-[60] bg-black/20 cursor-pointer"
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 px-4 md:px-8 pt-4 pb-12 flex items-start justify-between pointer-events-none">
          <div 
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
              isScrolled ? 'opacity-100' : 'opacity-0'
            } bg-gradient-to-b ${theme === 'dark' ? 'from-[#050505] via-[#050505]/80 to-transparent' : 'from-[#f8f9fa] via-[#f8f9fa]/80 to-transparent'}`}
          />
          
          <div className="relative z-10 flex items-center gap-4 w-1/3 pointer-events-auto">
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              style={{ willChange: "transform" }}
              onClick={() => setIsSidebarOpen(true)}
              className={`w-11 h-11 flex items-center justify-center rounded-full shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5 pointer-events-auto">
            <motion.div 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              style={{ willChange: "transform" }}
              className={`px-5 h-11 flex items-center justify-center rounded-full shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
            >
              <h1 className={`text-lg font-google font-bold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-0.5`}>
                salaris<span className={getAccentClass('text')}>ai</span>
              </h1>
            </motion.div>
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
                  className={`absolute right-0 flex items-center h-11 rounded-full shadow-md border transition-colors overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
                >
                  <button 
                    onClick={handleNewChat}
                    disabled={activeChat.messages.length === 0}
                    className={`w-11 h-11 flex items-center justify-center transition-opacity ${activeChat.messages.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                    title="Новый чат"
                  >
                    <SquarePen className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-11 h-11 flex items-center justify-center cursor-pointer"
                    title="Настройки"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Chat Area */}
        <main 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-10 pt-24 pb-24 md:pb-28 w-full max-w-5xl mx-auto flex flex-col"
        >
          {activeChat.messages.length === 0 ? (
            <AnimatePresence initial={false}>
              <Dashboard theme={theme} onActionClick={setInput} userName={profile?.display_name} />
            </AnimatePresence>
          ) : (
            <div className="mt-auto flex flex-col">
              <AnimatePresence initial={false}>
                {activeChat.messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id}
                    id={msg.id}
                    role={msg.role} 
                    content={msg.content} 
                    theme={theme} 
                    isTyping={msg.isTyping} 
                    accentColor={accentColor}
                    isGlowEnabled={isGlowEnabled}
                    onRegenerate={handleRegenerate}
                    onReport={handleReport}
                    onLike={handleLike}
                    onDislike={handleDislike}
                  />
                ))}
              </AnimatePresence>
              
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    key="loading-indicator"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    style={{ willChange: "transform, opacity" }}
                    className="flex justify-start mb-10"
                  >
                    <div className="relative w-fit">
                      <div className={`relative z-10 px-6 py-4 rounded-[2rem] glass-panel flex items-center gap-1.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass('bg')} typing-dot`} style={{ animationDelay: '0s' }} />
                        <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass('bg')} typing-dot`} style={{ animationDelay: '0.2s' }} />
                        <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass('bg')} typing-dot`} style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 w-full max-w-5xl mx-auto ${isActionMenuOpen ? 'z-[100]' : 'z-20'} pointer-events-none`}>
          {/* Scroll to Bottom Button */}
          <div className="relative max-w-3xl mx-auto w-full mb-4 flex justify-center">
            <AnimatePresence>
              {showScrollToBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    isUserScrolling.current = false;
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-1.5 rounded-full shadow-lg border transition-colors pointer-events-auto ${
                    theme === 'dark' 
                      ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                      : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-end gap-3 max-w-3xl mx-auto w-full pointer-events-auto">
            {/* Action Menu Button */}
            <div className="relative w-12 h-12 flex-shrink-0">
              {/* Backdrop for action menu moved here to share stacking context */}
              <AnimatePresence>
                {isActionMenuOpen && (
                  <motion.div
                    key="action-menu-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setIsActionMenuOpen(false)}
                    className="fixed inset-0 z-[190] bg-black/10 backdrop-blur-[2px] pointer-events-auto"
                  />
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {!isActionMenuOpen && (
                  <motion.div
                    key="action-button-wrapper"
                    className="absolute inset-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, transition: { type: "spring", damping: 25, stiffness: 500 } }}
                    exit={{ scale: 0, transition: { duration: 0.1, ease: "easeOut" } }}
                  >
                      <motion.button 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 1.1 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 30,
                          scale: { type: "spring", stiffness: 500, damping: 30 }
                        }}
                        style={{ willChange: "transform" }}
                        onClick={() => setIsActionMenuOpen(true)}
                        className={`w-full h-full flex items-center justify-center rounded-full shadow-md border transition-colors cursor-pointer ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
                      >
                        <Plus className="w-6 h-6" />
                      </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Menu Content */}
              <AnimatePresence mode="wait">
                {isActionMenuOpen && (
                  actionMenuView === 'main' ? (
                    <motion.div
                      key="main"
                      initial={{ scale: 0, opacity: 0, z: 0 }}
                      animate={{ 
                        scale: isActionMenuInteracting ? 0.95 : 1, 
                        opacity: 1,
                        z: 0,
                        transition: { type: "spring", damping: 25, stiffness: 300 } 
                      }}
                      exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
                      style={{ transformOrigin: '24px calc(100% - 24px)', willChange: "transform, opacity" }}
                      className={`absolute bottom-0 left-0 z-[200] w-64 rounded-[2rem] overflow-hidden p-2 hyper-glass hyper-glass-shadow`}
                    >
                      <div className="flex flex-col">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          onClick={() => {
                            fileInputRef.current?.click();
                            setIsActionMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Plus className="w-4 h-4" />
                            <span>Добавить файл</span>
                          </div>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          onClick={() => {
                            setIsThinkingMode(!isThinkingMode);
                            setIsActionMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Lightbulb className={`w-4 h-4 ${isThinkingMode ? getAccentClass('text') : ''}`} />
                            <span className={isThinkingMode ? getAccentClass('text') : ''}>Размышления</span>
                          </div>
                          {isThinkingMode && <Check className={`w-4 h-4 ${getAccentClass('text')}`} />}
                        </motion.button>

                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          onClick={() => setActionMenuView('model')}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FlaskConical className="w-4 h-4" />
                            Модель
                          </div>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedModel === 'llama-3.3-70b-versatile' ? 'Osmium X' : 'Osmium V'}
                          </span>
                        </motion.button>

                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="model"
                      initial={{ scale: 0, opacity: 0, z: 0 }}
                      animate={{ 
                        scale: isActionMenuInteracting ? 0.95 : 1, 
                        opacity: 1,
                        z: 0,
                        transition: { type: "spring", damping: 25, stiffness: 300 } 
                      }}
                      exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
                      style={{ transformOrigin: '24px calc(100% - 24px)', willChange: "transform, opacity" }}
                      className={`absolute bottom-0 left-0 z-[200] w-64 rounded-[2rem] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.2)] border p-2 backdrop-blur-xl ${
                        theme === 'dark' 
                          ? 'bg-white/10 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]' 
                          : 'bg-white/60 border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 px-2 pb-2">
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActionMenuView('main')}
                            className={`p-2 rounded-full transition-colors ${
                              theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </motion.button>
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Выберите модель
                          </span>
                        </div>
                        
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          onClick={() => { setSelectedModel('meta-llama/llama-4-scout-17b-16e-instruct'); setActionMenuView('main'); }}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span>Osmium V</span>
                            <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Быстрый ответ</span>
                          </div>
                          {selectedModel === 'meta-llama/llama-4-scout-17b-16e-instruct' && <Check className="w-4 h-4" />}
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          onClick={() => { setSelectedModel('llama-3.3-70b-versatile'); setActionMenuView('main'); }}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span>Osmium X</span>
                            <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Подробный ответ</span>
                          </div>
                          {selectedModel === 'llama-3.3-70b-versatile' && <Check className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>

            <div className="relative group flex-1">
              {/* Soft diffuse shadow for floating effect */}
              <div className={`absolute inset-0 rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.2)] ${theme === 'dark' ? 'shadow-[0_15px_50px_rgba(0,0,0,0.6)]' : ''} pointer-events-none`}></div>
            
              {/* Pastel rainbow glow (bloom) */}
              {isGlowEnabled && (
                <div className="absolute -inset-[1px] z-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-[8px]">
                  <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 w-[4000px] h-[4000px] max-w-none max-h-none bg-[conic-gradient(from_0deg,#ffb3ba,#ffdfba,#ffffba,#baffc9,#bae1ff,#dcbaff,#ffb3ba)] animate-spin-center"></div>
                  </div>
                </div>
              )}

              {/* Input Bar Container */}
              <div className={`relative z-10 flex flex-col rounded-[2rem] p-1.5 hyper-glass hyper-glass-shadow`}>
                
                {/* Top section: Pills and Image Preview */}
                <AnimatePresence initial={false}>
                  {isThinkingMode && (
                    <motion.div 
                      key="pills-container"
                      initial={{ opacity: 0, scaleY: 0.95 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{ transformOrigin: 'top', willChange: 'transform, opacity' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center gap-2 px-3 pt-2 pb-1.5 pointer-events-auto">
                        <AnimatePresence>
                          {isThinkingMode && (
                            <motion.div 
                              key="thinking-mode"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className={`flex items-center gap-1.5 shadow-sm rounded-full px-3 py-1.5 border ${theme === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-100'}`}
                            >
                              <Lightbulb className={`w-3.5 h-3.5 ${getAccentClass('text')}`} />
                              <span className={`text-[13px] font-medium ${getAccentClass('text')}`}>Размышления</span>
                              <button onClick={() => setIsThinkingMode(false)} className={`ml-1 ${getAccentClass('text')} hover:opacity-70 transition-opacity`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-end gap-2 w-full">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                      e.target.value = ''; // Reset input
                    }} 
                  />
                  <div className="flex flex-col flex-1">
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'}`}>
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="hover:opacity-70 transition-opacity">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                    ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${Math.max(36, Math.min(textareaRef.current.scrollHeight, 128))}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (isGenerating) {
                        handleStopGeneration();
                      } else {
                        handleSend();
                      }
                    }
                  }}
                  placeholder="Ваш вопрос..."
                  className={`flex-1 bg-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-900'} placeholder-gray-500 resize-none max-h-32 h-[36px] min-h-[36px] py-[8px] px-4 focus:outline-none text-[16px] font-medium font-sans leading-tight`}
                  rows={1}
                />
                </div>
                <motion.button
                  whileTap={{ scale: 1.1 }}
                  style={{ willChange: "transform" }}
                  onClick={isGenerating ? handleStopGeneration : handleSend}
                  disabled={(!isGenerating && !input.trim() && selectedFiles.length === 0) || (isLoading && !isGenerating)}
                  className={`w-[36px] h-[36px] flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0 shadow-sm ${
                    (!isGenerating && !input.trim() && selectedFiles.length === 0)
                      ? (theme === 'dark' ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400')
                      : `${getAccentClass('bg')} ${getAccentClass('hover')} text-white ${getAccentClass('shadow')}`
                  } ${(isLoading && !isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? <Square className="w-4 h-4 fill-current" /> : <ArrowUp className="w-4 h-4" />}
                </motion.button>
                </div>
              </div>
            </div>
          </div>
          <p className={`text-center text-[11px] ${theme === 'dark' ? 'text-gray-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-gray-400 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'} mt-4 font-medium hidden sm:block pointer-events-auto`}>
            SalarisAI может ошибаться. Перепроверяйте информацию.
          </p>
        </footer>
      </motion.div>

      {/* Modals at the end for proper stacking context */}
      <AnimatePresence>
        {editingChatId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingChatId(null)}
              style={{ willChange: "opacity" }}
              className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 500, mass: 0.8 }}
              style={{ willChange: "transform, opacity" }}
              className={`relative w-full max-w-[300px] rounded-[2rem] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.2)] border ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/60 border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
              } backdrop-blur-xl`}
            >
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-4 text-left ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
                        ? 'bg-white/10 text-white placeholder-white/40 focus:bg-white/20' 
                        : 'bg-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-400'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setEditingChatId(null)}
                  className={`appearance-none border border-transparent shadow-none flex-1 py-3 text-sm font-medium transition-colors rounded-full ${
                    theme === 'dark' 
                      ? 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30' 
                      : 'bg-gray-300 text-gray-900 hover:bg-gray-400 active:bg-gray-500'
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

      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              style={{ willChange: "opacity" }}
              className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 500, mass: 0.8 }}
              style={{ willChange: "transform, opacity" }}
              className={`relative w-full max-w-[300px] rounded-[2rem] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.2)] border ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/60 border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
              } backdrop-blur-xl`}
            >
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-2 text-left ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  Удалить все чаты?
                </h3>
                <p className={`text-sm text-left leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Данное действие приведет к удалению всех ваших чатов. После удаления чаты не получится восстановить.
                </p>
              </div>
              
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className={`appearance-none border border-transparent shadow-none flex-1 py-3 text-sm font-medium transition-colors rounded-full ${
                    theme === 'dark' 
                      ? 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30' 
                      : 'bg-gray-300 text-gray-900 hover:bg-gray-400 active:bg-gray-500'
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

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsSettingsOpen(false)}
            style={{ willChange: "opacity" }}
            className="fixed inset-0 z-[200] bg-black/10 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSettingsOpen && (
          settingsView === 'main' ? (
            <motion.div 
              key="main"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                {user && (
                  <div className="flex items-center gap-4 mb-4 px-2">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0 ${getAvatarColor(profile?.display_name || user?.email || 'U')}`}>
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          decoding="async" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('Avatar load failed:', profile.avatar_url);
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        (profile?.display_name || user?.email || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-base font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {profile?.display_name || 'Пользователь'}
                      </span>
                      <span className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {user?.email}
                      </span>
                    </div>
                  </div>
                )}

                {user && (
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => {
                      setTempName(profile?.display_name || '');
                      setSettingsView('edit-profile');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                        : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Редактировать профиль
                  </motion.button>
                )}

                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={() => setSettingsView('customization')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                      : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />
                  Кастомизация
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={() => setSettingsView('about')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                      : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  О приложении
                </motion.button>
              </div>
            </motion.div>
          ) : settingsView === 'edit-profile' ? (
            <motion.div 
              key="edit-profile"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('main')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Редактировать профиль
                  </span>
                </div>

                <div className="flex flex-col gap-4 px-2 mb-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ${getAvatarColor(profile?.display_name || user?.email || 'U')}`}>
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('Avatar load failed (settings):', profile.avatar_url);
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        (profile?.display_name || user?.email || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div className="relative w-full">
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onTapStart={() => setIsSettingsInteracting(true)}
                        onTap={() => setIsSettingsInteracting(false)}
                        onTapCancel={() => setIsSettingsInteracting(false)}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          theme === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10 text-white' 
                            : 'bg-black/5 hover:bg-black/10 text-gray-900'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        Изменить фото
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Имя пользователя
                    </label>
                    <input 
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className={`appearance-none border border-transparent shadow-none w-full h-10 px-4 text-sm transition-all duration-300 focus:outline-none focus:ring-0 rounded-full ${
                        theme === 'dark' 
                          ? 'bg-white/10 text-white placeholder-white/40 focus:bg-white/20' 
                          : 'bg-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-400'
                      }`}
                    />
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={handleUpdateProfile}
                    className={`w-full h-10 rounded-full font-medium text-white transition-all ${getAccentClass('bg')} ${getAccentClass('hover')}`}
                  >
                    Сохранить
                  </motion.button>
                </div>

                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                <div className="flex flex-col">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти из аккаунта
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={handleDeleteAccount}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить аккаунт
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : settingsView === 'customization' ? (
            <motion.div 
              key="customization"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('main')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Кастомизация
                  </span>
                </div>

                <div className="flex flex-col">
                  {/* Color Selection */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('color-selection')}
                    className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Выбрать цвет
                    </span>
                    <div className="h-6 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full ${getAccentClass('bg')} shadow-sm`} />
                    </div>
                  </motion.button>

                  {/* Auto Theme Toggle */}
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setAutoTheme(!autoTheme)}
                    className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Системная тема
                    </span>
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${
                        autoTheme ? getAccentClass('bg') : (theme === 'dark' ? 'bg-white/20' : 'bg-gray-300')
                      }`}
                    >
                      <motion.div 
                        animate={{ 
                          x: autoTheme ? 20 : 4,
                          width: 16,
                          backgroundColor: "rgba(255,255,255,1)",
                          backdropFilter: "blur(0px)"
                        }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute left-0 h-4 rounded-full shadow-sm"
                      />
                    </div>
                  </motion.button>

                  {/* Dark Theme Toggle */}
                  <AnimatePresence initial={false}>
                    {!autoTheme && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onTapStart={() => setIsSettingsInteracting(true)}
                          onTap={() => setIsSettingsInteracting(false)}
                          onTapCancel={() => setIsSettingsInteracting(false)}
                          onClick={toggleTheme}
                          className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                            theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                          }`}
                        >
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Темная тема
                          </span>
                          <div
                            className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${
                              theme === 'dark' ? getAccentClass('bg') : 'bg-gray-300'
                            }`}
                          >
                            <motion.div 
                              animate={{ 
                                x: theme === 'dark' ? 20 : 4,
                                width: 16,
                                backgroundColor: "rgba(255,255,255,1)",
                                backdropFilter: "blur(0px)"
                              }}
                              transition={{ type: "spring", damping: 20, stiffness: 300 }}
                              className="absolute left-0 h-4 rounded-full shadow-sm"
                            />
                          </div>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Glow Toggle */}
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setIsGlowEnabled(!isGlowEnabled)}
                    className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Эффекты сияния
                    </span>
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${
                        isGlowEnabled ? getAccentClass('bg') : (theme === 'dark' ? 'bg-white/20' : 'bg-gray-300')
                      }`}
                    >
                      <motion.div 
                        animate={{ 
                          x: isGlowEnabled ? 20 : 4,
                          width: 16,
                          backgroundColor: "rgba(255,255,255,1)",
                          backdropFilter: "blur(0px)"
                        }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute left-0 h-4 rounded-full shadow-sm"
                      />
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : settingsView === 'color-selection' ? (
            <motion.div 
              key="color-selection"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-56 rounded-[2rem] overflow-hidden p-4 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('customization')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Выберите цвет
                  </span>
                </div>

                <div className="flex flex-col gap-1 px-2">
                  {ACCENT_COLORS.map((color) => (
                    <ColorOptionButton
                      key={color.id}
                      color={color}
                      theme={theme}
                      accentColor={accentColor}
                      setAccentColor={setAccentColor}
                      setIsSettingsInteracting={setIsSettingsInteracting}
                      setSettingsView={setSettingsView}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="about"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('main')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    О приложении
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Версия
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    1.3
                  </span>
                </div>

                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={deleteAllChats}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить все чаты
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={() => handleReport()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  Сообщить об ошибке
                </motion.button>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={submitReport}
        theme={theme}
        isSubmitting={isSubmittingReport}
        type={reportContext?.type || 'report'}
      />
    </div>
  );
}
