import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import localforage from 'localforage';
import { ArrowUp, ArrowBigUp, ArrowUpCircle, ArrowDown, Menu, Settings, Trash2, Info, X, SquarePen, Plus, Paintbrush, ChevronLeft, ChevronDown, Check, Square, AlertCircle, User, LogOut, Camera, Lightbulb, FlaskConical, Pencil, PanelLeft, Image, Upload, Cpu, Layout, Droplet, Wrench, Send } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Chat, Message } from './types';
import { generateGroqResponseStream } from './services/groq';
import ChatMessage from './components/ChatMessage';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import BlockedScreen from './components/BlockedScreen';
import ReportModal from './components/ReportModal';
import { supabase } from './lib/supabase';

import { SettingsModal } from './components/SettingsModal';
import { WindowsSpinner } from './components/WindowsSpinner';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { RenameChatModal } from './components/RenameChatModal';
import { DeleteAllChatsModal } from './components/DeleteAllChatsModal';
import { ACCENT_COLORS } from './constants';
import UpdateScreen from './components/UpdateScreen';

const createNewChat = (): Chat => ({
  id: Date.now().toString(),
  title: 'Новый чат',
  messages: [],
  createdAt: Date.now()
});


export default function App() {
  return <UpdateScreen />;
  
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
  const [accentColor, setAccentColor] = useState<string>('sky');

  // Auth & Report State
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<{ chat: Chat, rect: DOMRect } | null>(null);
  const [isChatMenuInteracting, setIsChatMenuInteracting] = useState(false);

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
  const [selectedModel, setSelectedModel] = useState<'moonshotai/kimi-k2-instruct-0905' | 'meta-llama/llama-4-scout-17b-16e-instruct'>('meta-llama/llama-4-scout-17b-16e-instruct');
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  
  const stateRef = useRef({ chats, activeChatId, isLoading, selectedModel, isThinkingMode, profile });
  useEffect(() => {
    stateRef.current = { chats, activeChatId, isLoading, selectedModel, isThinkingMode, profile };
  }, [chats, activeChatId, isLoading, selectedModel, isThinkingMode, profile]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
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
        if (storedAccentColor) {
          setAccentColor(storedAccentColor === 'laguna' ? 'sky' : storedAccentColor);
        }
        if (['moonshotai/kimi-k2-instruct-0905', 'meta-llama/llama-4-scout-17b-16e-instruct'].includes(storedModel || '')) {
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
      localforage.setItem('salaris_model', selectedModel);
    }, 1000);

    return () => clearTimeout(timer);
  }, [chats, activeChatId, theme, autoTheme, accentColor, selectedModel, isLoaded]);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const isAnyOverlayOpen = !!(isSettingsOpen || isReportModalOpen || isDeleteConfirmOpen || isActionMenuOpen || activeChatMenu || editingChatId);
  const [editingTitle, setEditingTitle] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '0px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(36, Math.min(scrollHeight, 136))}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!isActionMenuOpen) {
      const timer = setTimeout(() => setActionMenuView('main'), 150); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [isActionMenuOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null || touchEndY.current === null) return;
    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    
    // Strictly horizontal swipe: horizontal distance must be significantly larger than vertical
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY) * 2;
    const isLeftSwipe = distanceX > 50 && isHorizontal;
    const isRightSwipe = distanceX < -50 && isHorizontal;

    // Right swipe opens sidebar (from anywhere)
    if (isRightSwipe && !isSidebarOpen && !isAnyOverlayOpen) {
      setIsSidebarOpen(true);
    }
    // Left swipe closes sidebar
    if (isLeftSwipe && isSidebarOpen && !isAnyOverlayOpen) {
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

    // Check if we are at the bottom (with a small threshold)
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);

    // If user scrolls up more than 150px from the bottom, they are manually scrolling
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    isUserScrolling.current = !isNearBottom;
    setShowScrollToBottom(!isNearBottom);
  }, []);

  const lastScrollHeight = useRef<number>(0);

  const scrollToBottom = useCallback((smooth = false) => {
    if (!isUserScrolling.current && chatContainerRef.current) {
      const currentScrollHeight = chatContainerRef.current.scrollHeight;
      
      // Only scroll if the height actually changed or if smooth scrolling is explicitly requested
      if (currentScrollHeight !== lastScrollHeight.current || smooth) {
        chatContainerRef.current.scrollTo({
          top: currentScrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
        lastScrollHeight.current = currentScrollHeight;
      }
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
    setIsScrolled(false);
    setIsAtBottom(true);
    setShowScrollToBottom(false);
    isUserScrolling.current = false;
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
    setIsThinkingMode(false);
    setIsLoading(true);
    setIsGenerating(true);
    stopGenerationRef.current = false;

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    const base64Images = currentFiles.length > 0 ? await Promise.all(currentFiles.map(fileToBase64)) : undefined;
    const finalUserMsg = userMsg || (base64Images ? 'Посмотри на это изображение' : '');

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: finalUserMsg,
      images: base64Images
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstUserMessage = chat.messages.length === 0;
        return {
          ...chat,
          title: isFirstUserMessage ? (finalUserMsg || 'Изображение').slice(0, 25) + (finalUserMsg.length > 25 ? '...' : '') : chat.title,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    }));

    const targetChatId = activeChatId;
    const modelMessageId = (Date.now() + 1).toString();

    try {
      const chatHistory = activeChat ? activeChat.messages : [];
      
      const modelToUse = currentThinkingMode ? 'moonshotai/kimi-k2-instruct-0905' : selectedModel;
      const stream = generateGroqResponseStream(finalUserMsg, modelToUse, chatHistory, profile?.display_name, currentThinkingMode, base64Images);

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
          errorText = `Превышен лимит запросов к API (Quota Exceeded). Пожалуйста, подождите (лимиты сбрасываются) или проверьте ваш аккаунт.`;
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
    const userMsgImages = lastUserMsg.images;
    const currentThinkingMode = stateRef.current.isThinkingMode;
    setIsThinkingMode(false);
    
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
      
      const modelToUse = currentThinkingMode ? 'moonshotai/kimi-k2-instruct-0905' : selectedModel;
      const stream = generateGroqResponseStream(userMsgContent, modelToUse, chatHistory, profile?.display_name, currentThinkingMode, userMsgImages);

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
          errorText = `Превышен лимит запросов к API (Quota Exceeded). Пожалуйста, подождите (лимиты сбрасываются) или проверьте ваш аккаунт.`;
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
      <div className={`flex h-[100dvh] items-center justify-center ${theme === 'dark' ? 'bg-[#171717]' : 'bg-[#f5f0e6]'}`}>
        <WindowsSpinner className="w-8 h-8" colorClass="text-[#007AFF]" />
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
      className={`flex h-[100dvh] ${theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#f5f0e6] text-black'} font-sans selection:bg-red-500/30 overflow-hidden transition-colors duration-500 relative`}
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
        setIsLoading={setIsLoading}
        editingChatId={editingChatId}
        onOpenChatMenu={(chat, rect) => setActiveChatMenu({ chat, rect })}
        activeChatMenu={activeChatMenu}
        getAccentClass={getAccentClass}
        user={user}
        profile={profile}
        getAvatarColor={getAvatarColor}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      {/* Main Content */}
      <motion.div 
        className={`flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden ${theme === 'dark' ? 'bg-[#171717]' : 'bg-[#f5f0e6]'}`}
      >
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

        <ChatHeader 
          theme={theme}
          isScrolled={isScrolled}
          activeChat={activeChat}
          isSettingsOpen={isSettingsOpen}
          handleNewChat={handleNewChat}
        />

        {/* Chat Area */}
        <main 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-10 pt-24 pb-24 md:pb-28 w-full max-w-5xl mx-auto flex flex-col"
        >
          {activeChat.messages.length === 0 ? null : (
            <div className="mt-auto flex flex-col">
              <AnimatePresence initial={false}>
                {activeChat.messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id}
                    id={msg.id}
                    role={msg.role} 
                    content={msg.content} 
                    images={msg.images}
                    theme={theme} 
                    isTyping={msg.isTyping} 
                    accentColor={accentColor}
                    onRegenerate={handleRegenerate}
                    onReport={handleReport}
                    onLike={handleLike}
                    onDislike={handleDislike}
                  />
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <div 
                  className="flex justify-start mb-10"
                >
                  <div className="relative w-fit">
                    <div className={`relative z-10 px-6 py-4 rounded-[2rem] backdrop-blur-xl backdrop-saturate-150 border flex items-center gap-1.5 ${theme === 'dark' ? 'bg-black/40 border-white/20 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/60 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass('bg')} typing-dot`} style={{ animationDelay: '0s' }} />
                      <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass('bg')} typing-dot`} style={{ animationDelay: '0.2s' }} />
                      <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass('bg')} typing-dot`} style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Bottom Gradient Overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 h-40 z-10 pointer-events-none transition-opacity duration-500 ease-in-out ${
            !isAtBottom && activeChat.messages.length > 0 ? 'opacity-100' : 'opacity-0'
          } backdrop-blur-md [mask-image:linear-gradient(to_top,black_30%,transparent)]`}
        />

        {/* Input Area */}
        <footer className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 w-full max-w-5xl mx-auto ${isActionMenuOpen ? 'z-[100]' : 'z-20'} pointer-events-none`}>
          {/* Scroll to Bottom Button */}
          <div className="relative max-w-3xl mx-auto w-full mb-4 flex justify-center">
            <AnimatePresence>
              {showScrollToBottom && activeChat.messages.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    isUserScrolling.current = false;
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTo({
                        top: chatContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`p-1.5 rounded-full border transition-colors pointer-events-auto backdrop-blur-xl backdrop-saturate-150 ${
                    theme === 'dark' 
                      ? 'bg-black/40 border-white/20 text-white shadow-[0_4px_40px_rgba(0,0,0,0.04)]' 
                      : 'bg-white/60 border-white/40 text-black shadow-[0_4px_40px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <ChatInput 
            theme={theme}
            isActionMenuOpen={isActionMenuOpen}
            setIsActionMenuOpen={setIsActionMenuOpen}
            actionMenuView={actionMenuView}
            setActionMenuView={setActionMenuView}
            isActionMenuInteracting={isActionMenuInteracting}
            setIsActionMenuInteracting={setIsActionMenuInteracting}
            isThinkingMode={isThinkingMode}
            setIsThinkingMode={setIsThinkingMode}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            fileInputRef={fileInputRef}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            input={input}
            setInput={setInput}
            textareaRef={textareaRef}
            isGenerating={isGenerating}
            isLoading={isLoading}
            handleSend={handleSend}
            handleStopGeneration={handleStopGeneration}
            getAccentClass={getAccentClass}
          />
        </footer>
      </motion.div>

      {/* Modals at the end for proper stacking context */}
      <RenameChatModal 
        theme={theme}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        saveChatTitle={saveChatTitle}
        getAccentClass={getAccentClass}
      />

      <DeleteAllChatsModal
        theme={theme}
        isDeleteConfirmOpen={isDeleteConfirmOpen}
        setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
        confirmDeleteAllChats={confirmDeleteAllChats}
      />

      <SettingsModal
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        settingsView={settingsView}
        setSettingsView={setSettingsView}
        isSettingsInteracting={isSettingsInteracting}
        setIsSettingsInteracting={setIsSettingsInteracting}
        theme={theme}
        user={user}
        profile={profile}
        getAvatarColor={getAvatarColor}
        setTempName={setTempName}
        tempName={tempName}
        handleAvatarUpload={handleAvatarUpload}
        handleUpdateProfile={handleUpdateProfile}
        handleLogout={handleLogout}
        handleDeleteAccount={handleDeleteAccount}
        getAccentClass={getAccentClass}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        autoTheme={autoTheme}
        setAutoTheme={setAutoTheme}
        toggleTheme={toggleTheme}
        deleteAllChats={deleteAllChats}
        handleReport={handleReport}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={submitReport}
        theme={theme}
        isSubmitting={isSubmittingReport}
        type={reportContext?.type || 'report'}
      />

      {/* Global Chat Menu Backdrop */}
      <AnimatePresence>
        {activeChatMenu && (
          <motion.div
            key="global-chat-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setActiveChatMenu(null)}
            className="fixed inset-0 z-[1000] bg-transparent pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Global Chat Menu Content */}
      <AnimatePresence>
        {activeChatMenu && (
          <motion.div
            key="global-chat-menu-content"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isChatMenuInteracting ? 0.95 : 1, 
              opacity: 1,
              transition: { type: "spring", damping: 25, stiffness: 300 } 
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
            style={{ 
              position: 'fixed',
              top: activeChatMenu.rect.top,
              left: activeChatMenu.rect.right - 192, // 192px is w-48
              transformOrigin: 'calc(100% - 16px) 16px',
              willChange: "transform, opacity",
              zIndex: 1001
            }}
            className={`w-48 rounded-[2rem] overflow-hidden p-2 backdrop-blur-xl backdrop-saturate-150 border ${
              theme === 'dark' ? 'bg-black/50 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div className="flex flex-col">
              <motion.button
                
                onTapStart={() => setIsChatMenuInteracting(true)}
                onTap={() => setIsChatMenuInteracting(false)}
                onTapCancel={() => setIsChatMenuInteracting(false)}
                onClick={(e) => {
                  startEditingChat(e, activeChatMenu.chat.id, activeChatMenu.chat.title);
                  setActiveChatMenu(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                    : 'hover:bg-black/5 active:bg-black/10 text-black'
                }`}
              >
                <Pencil className="w-4 h-4" />
                <span>Переименовать</span>
              </motion.button>

              <motion.button
                
                onTapStart={() => setIsChatMenuInteracting(true)}
                onTap={() => setIsChatMenuInteracting(false)}
                onTapCancel={() => setIsChatMenuInteracting(false)}
                onClick={(e) => {
                  deleteChat(e, activeChatMenu.chat.id);
                  setActiveChatMenu(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
