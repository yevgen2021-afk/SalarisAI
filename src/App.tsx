import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import localforage from 'localforage';
import { ArrowUp, Menu, Settings, Moon, Sun, Trash2, Info, X, SquarePen, Plus, Paintbrush, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, Message } from './types';
import { generateResponseStream } from './services/gemini';
import ChatMessage from './components/ChatMessage';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';

const createNewChat = (): Chat => ({
  id: Date.now().toString(),
  title: 'Новый чат',
  messages: [],
  createdAt: Date.now()
});

const ACCENT_COLORS = [
  { id: 'sky', name: 'Небесный', bg: 'bg-sky-400', text: 'text-sky-400', border: 'border-sky-400', shadow: 'shadow-sky-400/20', hover: 'hover:bg-sky-500' },
  { id: 'pink', name: 'Румянец', bg: 'bg-pink-400', text: 'text-pink-400', border: 'border-pink-400', shadow: 'shadow-pink-400/20', hover: 'hover:bg-pink-500' },
  { id: 'purple', name: 'Аметист', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', shadow: 'shadow-purple-500/20', hover: 'hover:bg-purple-600' },
  { id: 'emerald', name: 'Мята', bg: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400', shadow: 'shadow-emerald-400/20', hover: 'hover:bg-emerald-500' },
  { id: 'red', name: 'Томат', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', shadow: 'shadow-red-500/20', hover: 'hover:bg-red-600' },
  { id: 'orange', name: 'Закат', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', shadow: 'shadow-orange-500/20', hover: 'hover:bg-orange-600' },
];

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
  const [accentColor, setAccentColor] = useState<string>('sky');
  const [isGlowEnabled, setIsGlowEnabled] = useState<boolean>(true);
  const [settingsView, setSettingsView] = useState<'main' | 'customization'>('main');
  const [isColorExpanded, setIsColorExpanded] = useState(false);
  const [isSettingsInteracting, setIsSettingsInteracting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isActionMenuInteracting, setIsActionMenuInteracting] = useState(false);
  const [actionMenuView, setActionMenuView] = useState<'main' | 'model'>('main');
  const [selectedModel, setSelectedModel] = useState<'gemini-3-flash-preview' | 'gemini-3.1-pro-preview'>('gemini-3-flash-preview');
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const [isExplicitImageMode, setIsExplicitImageMode] = useState<boolean>(false);

  // Load data from localforage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedChats = await localforage.getItem<Chat[]>('salaris_chats');
        const storedActiveChatId = await localforage.getItem<string>('salaris_active_chat');
        const storedTheme = await localforage.getItem<'dark' | 'light'>('salaris_theme');
        const storedAccentColor = await localforage.getItem<string>('salaris_accent');
        const storedGlow = await localforage.getItem<boolean>('salaris_glow');
        const storedModel = await localforage.getItem<'gemini-3-flash-preview' | 'gemini-3.1-pro-preview'>('salaris_model');

        if (storedChats) {
          setChats(storedChats);
          if (storedActiveChatId) {
            setActiveChatId(storedActiveChatId);
          } else if (storedChats.length > 0) {
            setActiveChatId(storedChats[0].id);
          }
        } else {
          // Default chat is already set in useState, just ensure activeChatId matches
          const newChat = chats[0];
          setActiveChatId(newChat.id);
        }

        if (storedTheme) setTheme(storedTheme);
        if (storedAccentColor) setAccentColor(storedAccentColor);
        if (storedGlow !== null) setIsGlowEnabled(storedGlow);
        if (storedModel) setSelectedModel(storedModel);
      } catch (error) {
        // Silently handle localforage load errors
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Save data to localforage on changes
  useEffect(() => {
    if (!isLoaded) return;
    localforage.setItem('salaris_chats', chats);
    localforage.setItem('salaris_active_chat', activeChatId);
    localforage.setItem('salaris_theme', theme);
    localforage.setItem('salaris_accent', accentColor);
    localforage.setItem('salaris_glow', isGlowEnabled);
    localforage.setItem('salaris_model', selectedModel);
  }, [chats, activeChatId, theme, accentColor, isGlowEnabled, selectedModel, isLoaded]);

  const [attachedImage, setAttachedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const [dashboardData, setDashboardData] = useState<{temp: number | null, wind: number | null, weatherCode: number | null}>({
    temp: null, wind: null, weatherCode: null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

    if (isRightSwipe && touchStartX.current < 40) {
      setIsSidebarOpen(true);
    }
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
    if (!isSettingsOpen) {
      // Reset settings view when closed, after a small delay to allow exit animation
      const timer = setTimeout(() => {
        setSettingsView('main');
        setIsColorExpanded(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isSettingsOpen]);

  const getAccentClass = useCallback((type: 'bg' | 'text' | 'border' | 'shadow' | 'hover') => {
    const color = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];
    return color[type];
  }, [accentColor]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.1824&longitude=29.0671&current_weather=true');
        const weather = await weatherRes.json();
        setDashboardData({
          temp: weather.current_weather?.temperature ?? null,
          wind: weather.current_weather?.windspeed ?? null,
          weatherCode: weather.current_weather?.weathercode ?? null
        });
      } catch (e) {
        // Silently handle dashboard data fetch errors
      }
    };
    fetchDashboardData();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user scrolls up more than 150px from the bottom, they are manually scrolling
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    isUserScrolling.current = !isAtBottom;
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
    const newChat = createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsLoading(false);
    setIsSidebarOpen(false);
  }, []);

  const deleteChat = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
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
  }, [activeChatId, chats, setChats, setActiveChatId]);

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
    const newChat = createNewChat();
    setChats([newChat]);
    setActiveChatId(newChat.id);
    setIsLoading(false);
    setIsDeleteConfirmOpen(false);
    setIsSidebarOpen(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const [mime, data] = base64.split(';base64,');
        setAttachedImage({
          mimeType: mime.split(':')[1],
          data: data
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMsg = input.trim();
    const currentImage = attachedImage;
    const currentThinkingMode = isThinkingMode;
    const currentExplicitImageMode = isExplicitImageMode;
    
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setAttachedImage(null);
    setIsThinkingMode(false);
    setIsExplicitImageMode(false);
    setIsLoading(true);

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMsg,
      images: currentImage ? [`data:${currentImage.mimeType};base64,${currentImage.data}`] : undefined
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

    try {
      const imageKeywords = ['нарисуй', 'изобрази', 'сгенерируй', 'создай картинку', 'создай изображение', 'draw', 'generate image', 'create image', 'picture of', 'image of'];
      const isImageGen = currentExplicitImageMode || imageKeywords.some(keyword => userMsg.toLowerCase().includes(keyword)) || !!(currentImage && (userMsg.toLowerCase().includes('иконк') || userMsg.toLowerCase().includes('сделай') || userMsg.toLowerCase().includes('создай')));
      
      const targetChatId = activeChatId;
      const modelMessageId = (Date.now() + 1).toString();

      if (isImageGen) {
        setIsLoading(false);
        setChats(prev => prev.map(chat => {
          if (chat.id === targetChatId) {
            return { ...chat, messages: [...chat.messages, { id: modelMessageId, role: 'model', content: '', isTyping: true, isImageGen: true }] };
          }
          return chat;
        }));
      }

      const stream = generateResponseStream(userMsg, currentImage, {
        model: selectedModel,
        thinkingMode: currentThinkingMode,
        isImageGeneration: isImageGen
      });

      if (isImageGen) {
        let fullContent = '';
        for await (const chunkText of stream) {
          fullContent += chunkText;
        }
        setChats(prev => prev.map(chat => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map(m => m.id === modelMessageId ? { ...m, content: fullContent, isTyping: false } : m)
            };
          }
          return chat;
        }));
      } else {
        let isFirstChunk = true;
        let currentTyped = '';
        for await (const chunkText of stream) {
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
          
          const tokens = chunkText.match(/(\s+|\S+)/g) || [];
          for (const token of tokens) {
            currentTyped += token;
            setChats(prev => prev.map(chat => {
              if (chat.id === targetChatId) {
                return {
                  ...chat,
                  messages: chat.messages.map(m => m.id === modelMessageId ? { ...m, content: currentTyped, isTyping: true } : m)
                };
              }
              return chat;
            }));
            // Small delay for natural typing feel
            await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 20));
          }
        }

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
      }

    } catch (error) {
      let errorText = 'Произошла ошибка связи с сервером. Пожалуйста, попробуйте позже.';
      if (error instanceof Error) {
        errorText = error.message;
        if (errorText.includes('429') || errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
          errorText = 'Превышен лимит запросов к API Google (Quota Exceeded). Пожалуйста, подождите (лимиты сбрасываются) или проверьте ваш аккаунт Google AI Studio.';
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
      
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: errorText
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, errorMessage] };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [input, attachedImage, isLoading, activeChatId, selectedModel, isThinkingMode, isExplicitImageMode, chats]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || isLoading) return;
    
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
    
    let currentImage = null;
    if (lastUserMsg.images && lastUserMsg.images.length > 0) {
      const dataUrl = lastUserMsg.images[0];
      const [mimePart, data] = dataUrl.split(';base64,');
      const mimeType = mimePart.split(':')[1];
      currentImage = { mimeType, data };
    }
    
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
    
    try {
      const imageKeywords = ['нарисуй', 'изобрази', 'сгенерируй', 'создай картинку', 'создай изображение', 'draw', 'generate image', 'create image', 'picture of', 'image of'];
      const isImageGen = imageKeywords.some(keyword => userMsgContent.toLowerCase().includes(keyword)) || !!(currentImage && (userMsgContent.toLowerCase().includes('иконк') || userMsgContent.toLowerCase().includes('сделай') || userMsgContent.toLowerCase().includes('создай')));

      const targetChatId = activeChatId;
      const modelMessageId = Date.now().toString();

      if (isImageGen) {
        setIsLoading(false);
        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return { ...c, messages: [...c.messages, { id: modelMessageId, role: 'model', content: '', isTyping: true, isImageGen: true }] };
          }
          return c;
        }));
      }

      const stream = generateResponseStream(userMsgContent, currentImage, {
        model: selectedModel,
        thinkingMode: isThinkingMode,
        isImageGeneration: isImageGen
      });

      if (isImageGen) {
        let fullContent = '';
        for await (const chunkText of stream) {
          fullContent += chunkText;
        }
        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === modelMessageId ? { ...m, content: fullContent, isTyping: false } : m)
            };
          }
          return c;
        }));
      } else {
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
      }

    } catch (error) {
      let errorText = 'Произошла ошибка связи с сервером. Пожалуйста, попробуйте позже.';
      if (error instanceof Error) {
        errorText = error.message;
        if (errorText.includes('429') || errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
          errorText = 'Превышен лимит запросов к API Google (Quota Exceeded). Пожалуйста, подождите (лимиты сбрасываются) или проверьте ваш аккаунт Google AI Studio.';
        } else if (errorText.includes('{')) {
          try {
            const match = errorText.match(/"message":\s*"([^"]+)"/);
            if (match && match[1]) {
              errorText = match[1].replace(/\\n/g, ' ');
            }
          } catch (e) {}
        }
      }

      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: errorText
      };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, errorMessage] };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [chats, activeChatId, isLoading, selectedModel, isThinkingMode]);

  if (!isLoaded) {
    return (
      <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#f8f9fa]'}`}>
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`flex h-screen ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#f8f9fa] text-gray-900'} font-sans selection:bg-red-500/30 overflow-hidden transition-colors duration-500 relative`}
    >
      
      {/* Ambient Glow Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#ff0080] ambient-blob animate-[ambient-blob-1_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] bg-[#8000ff] ambient-blob animate-[ambient-blob-2_25s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-[#0080ff] ambient-blob animate-[ambient-blob-3_22s_ease-in-out_infinite]"></div>
        <div className="absolute top-[10%] right-[20%] w-[30vw] h-[30vw] bg-[#00ff80] ambient-blob animate-[ambient-blob-1_28s_ease-in-out_infinite_reverse]"></div>
      </div>

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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 px-4 md:px-8 py-4 flex items-start justify-between pointer-events-none hyper-glass border-x-0 border-t-0">
          <div className="flex items-center gap-4 w-1/3 pointer-events-auto">
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

          <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
            <motion.div 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              style={{ willChange: "transform" }}
              className={`px-5 h-11 flex items-center justify-center rounded-full shadow-md border transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white border-gray-200/50 text-black shadow-[0_4px_15px_rgba(0,0,0,0.05)]'}`}
            >
              <h1 className={`text-lg font-google font-bold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-0.5`}>
                salaris<span className="text-pink-500">ai</span>
                <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                  beta
                </span>
              </h1>
            </motion.div>
          </div>
          
          <div className="flex justify-end items-start w-1/3 pointer-events-auto relative h-11">
            <AnimatePresence>
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
                    className="w-11 h-11 flex items-center justify-center cursor-pointer"
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
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 pb-24 md:pb-28 w-full max-w-5xl mx-auto flex flex-col"
        >
          {activeChat.messages.length === 0 ? (
            <AnimatePresence initial={false}>
              <Dashboard data={dashboardData} theme={theme} onActionClick={(text) => setInput(text)} />
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
                    images={msg.images}
                    theme={theme} 
                    isTyping={msg.isTyping} 
                    isImageGen={msg.isImageGen}
                    accentColor={accentColor}
                    isGlowEnabled={isGlowEnabled}
                    onRegenerate={handleRegenerate}
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

              <AnimatePresence>
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
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
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: isActionMenuInteracting ? 0.97 : 1, 
                        transition: { type: "spring", damping: 25, stiffness: 300 } 
                      }}
                      exit={{ scale: 0, transition: { duration: 0.15, ease: "easeOut" } }}
                      style={{ transformOrigin: '24px calc(100% - 24px)', willChange: "transform" }}
                      className={`absolute bottom-0 left-0 z-[200] w-64 rounded-[2rem] overflow-hidden p-2 hyper-glass hyper-glass-shadow`}
                    >
                      <div className="flex flex-col">
                        <motion.label
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          Добавить
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            handleFileChange(e);
                            setIsActionMenuOpen(false);
                          }} />
                        </motion.label>

                        <motion.button
                          onTapStart={() => setIsActionMenuInteracting(true)}
                          onTap={() => setIsActionMenuInteracting(false)}
                          onTapCancel={() => setIsActionMenuInteracting(false)}
                          onClick={() => {
                            setIsExplicitImageMode(!isExplicitImageMode);
                            setIsActionMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isExplicitImageMode ? getAccentClass('text') : ''}>
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                              <path d="m12 18 3-3" />
                              <path d="m12 18-3-3" />
                              <path d="M12 18V8" />
                              <path d="M8 12h8" />
                            </svg>
                            <span className={isExplicitImageMode ? getAccentClass('text') : ''}>Изображение</span>
                          </div>
                          {isExplicitImageMode && <Check className={`w-4 h-4 ${getAccentClass('text')}`} />}
                        </motion.button>

                        <motion.button
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isThinkingMode ? getAccentClass('text') : ''}>
                              <path d="M9 18h6" />
                              <path d="M10 22h4" />
                              <path d="M12 2v1" />
                              <path d="M12 7v1" />
                              <path d="M12 12v1" />
                              <path d="M19 12h-1" />
                              <path d="M14 12h-1" />
                              <path d="M5 12h1" />
                              <path d="M10 12h1" />
                              <path d="M17 5l-1 1" />
                              <path d="M13 9l-1 1" />
                              <path d="M7 5l1 1" />
                              <path d="M11 9l1 1" />
                            </svg>
                            <span className={isThinkingMode ? getAccentClass('text') : ''}>Размышление</span>
                          </div>
                          {isThinkingMode && <Check className={`w-4 h-4 ${getAccentClass('text')}`} />}
                        </motion.button>

                        <div className={`h-px w-full my-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                        <motion.button 
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            Модель
                          </div>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedModel === 'gemini-3-flash-preview' ? 'SalarisAI classic' : 'SalarisAI Pro'}
                          </span>
                        </motion.button>

                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="model"
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: isActionMenuInteracting ? 0.97 : 1, 
                        transition: { type: "spring", damping: 25, stiffness: 300 } 
                      }}
                      exit={{ scale: 0, transition: { duration: 0.15, ease: "easeOut" } }}
                      style={{ transformOrigin: '24px calc(100% - 24px)', willChange: "transform" }}
                      className={`absolute bottom-0 left-0 z-[200] w-64 rounded-[2rem] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.2)] border p-2 backdrop-blur-xl ${
                        theme === 'dark' 
                          ? 'bg-white/10 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]' 
                          : 'bg-white/60 border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 px-2 pb-2">
                          <motion.button 
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setActionMenuView('main')}
                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </motion.button>
                          <span className="font-medium">Выберите модель</span>
                        </div>
                        <button 
                          onClick={() => { setSelectedModel('gemini-3-flash-preview'); setActionMenuView('main'); }}
                          className={`flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          SalarisAI classic
                          {selectedModel === 'gemini-3-flash-preview' && <Check className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => { setSelectedModel('gemini-3.1-pro-preview'); setActionMenuView('main'); }}
                          className={`flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                              : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                          }`}
                        >
                          SalarisAI Pro
                          {selectedModel === 'gemini-3.1-pro-preview' && <Check className="w-4 h-4" />}
                        </button>
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
                  {(attachedImage || isThinkingMode || isExplicitImageMode) && (
                    <motion.div 
                      key="pills-container"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center gap-2 px-3 pt-2 pb-1.5 pointer-events-auto">
                        <AnimatePresence>
                          {attachedImage && (
                            <motion.div 
                              key="attached-image"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="relative inline-block"
                            >
                              <img 
                                src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} 
                                alt="Attachment" 
                                className="w-10 h-10 object-cover rounded-xl border border-white/20 shadow-sm"
                              />
                              <button 
                                onClick={() => setAttachedImage(null)} 
                                className={`absolute -top-2 -right-2 rounded-full p-0.5 shadow-md transition-colors ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )}
                          {isThinkingMode && (
                            <motion.div 
                              key="thinking-mode"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className={`flex items-center gap-1.5 shadow-sm rounded-full px-3 py-1.5 border ${theme === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-100'}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={getAccentClass('text')}>
                                <path d="M9 18h6" />
                                <path d="M10 22h4" />
                                <path d="M12 2v1" />
                                <path d="M12 7v1" />
                                <path d="M12 12v1" />
                                <path d="M19 12h-1" />
                                <path d="M14 12h-1" />
                                <path d="M5 12h1" />
                                <path d="M10 12h1" />
                                <path d="M17 5l-1 1" />
                                <path d="M13 9l-1 1" />
                                <path d="M7 5l1 1" />
                                <path d="M11 9l1 1" />
                              </svg>
                              <span className={`text-[13px] font-medium ${getAccentClass('text')}`}>Размышление</span>
                              <button onClick={() => setIsThinkingMode(false)} className={`ml-1 ${getAccentClass('text')} hover:opacity-70 transition-opacity`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                          {isExplicitImageMode && (
                            <motion.div 
                              key="image-mode"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className={`flex items-center gap-1.5 shadow-sm rounded-full px-3 py-1.5 border ${theme === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-100'}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={getAccentClass('text')}>
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="m12 18 3-3" />
                                <path d="m12 18-3-3" />
                                <path d="M12 18V8" />
                                <path d="M8 12h8" />
                              </svg>
                              <span className={`text-[13px] font-medium ${getAccentClass('text')}`}>Изображение</span>
                              <button onClick={() => setIsExplicitImageMode(false)} className={`ml-1 ${getAccentClass('text')} hover:opacity-70 transition-opacity`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-end gap-2 w-full pt-0.5">
                  <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${Math.max(34, Math.min(textareaRef.current.scrollHeight, 128))}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ваш вопрос..."
                  className={`flex-1 bg-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-900'} placeholder-gray-500 resize-none max-h-32 h-[34px] min-h-[34px] py-[8px] px-4 focus:outline-none text-[14.5px] font-normal font-google-sans leading-tight`}
                  rows={1}
                />
                <motion.button
                  whileTap={{ scale: 1.1 }}
                  style={{ willChange: "transform" }}
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className={`w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0 shadow-sm ${
                    (!input.trim() && !attachedImage)
                      ? (theme === 'dark' ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400')
                      : `${getAccentClass('bg')} ${getAccentClass('hover')} text-white ${getAccentClass('shadow')}`
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </motion.button>
                </div>
              </div>
            </div>
          </div>
          <p className={`text-center text-[11px] ${theme === 'dark' ? 'text-gray-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-gray-400 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'} mt-4 font-medium hidden sm:block pointer-events-auto`}>
            SalarisAI может ошибаться. Перепроверяйте информацию.
          </p>
        </footer>
      </div>

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
                        : 'bg-gray-200 text-gray-900 placeholder-gray-500 focus:bg-gray-300'
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
                  className="flex-1 py-3 text-sm font-semibold transition-colors bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 rounded-full"
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
              initial={{ scale: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.97 : 1, 
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ transformOrigin: 'calc(100% - 44px) 22px', willChange: "transform" }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-64 rounded-[2rem] overflow-hidden p-2 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                <motion.button 
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                      : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                  }`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.97 }}
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
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={deleteAllChats}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20 mt-1`}
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить все чаты
                </motion.button>
                
                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />
                
                <motion.button 
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                      : 'hover:bg-black/5 active:bg-black/10 text-gray-900'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  О приложении
                </motion.button>
                
                <div className="px-4 py-2 text-center">
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Version: 0.8.2.test
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="customization"
              initial={{ scale: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.97 : 1, 
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ transformOrigin: 'calc(100% - 44px) 22px', willChange: "transform" }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-64 rounded-[2rem] overflow-hidden p-2 hyper-glass hyper-glass-shadow`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 px-2 pb-2">
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
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

                <motion.div layout className="flex flex-col gap-1">
                  {/* Color Selection */}
                  <motion.div 
                    layout
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`rounded-3xl overflow-hidden transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <motion.button
                      layout="position"
                      onTapStart={() => setIsSettingsInteracting(true)}
                      onTap={() => setIsSettingsInteracting(false)}
                      onTapCancel={() => setIsSettingsInteracting(false)}
                      onClick={() => setIsColorExpanded(!isColorExpanded)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-colors ${
                         theme === 'dark' ? 'active:bg-white/10' : 'active:bg-black/10'
                      }`}
                    >
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Выбор цвета
                      </span>
                      <div className={`w-5 h-5 rounded-full ${getAccentClass('bg')} shadow-sm`} />
                    </motion.button>

                    <motion.div
                      initial={false}
                      animate={{ 
                        height: isColorExpanded ? 'auto' : 0,
                        opacity: isColorExpanded ? 1 : 0
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2 flex flex-col gap-1">
                        {ACCENT_COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setAccentColor(color.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-full transition-colors ${
                              theme === 'dark' ? 'hover:bg-white/10 active:bg-white/20' : 'hover:bg-black/5 active:bg-black/10'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full ${color.bg} shadow-sm flex items-center justify-center`}>
                              {accentColor === color.id && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              {color.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Separator */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isColorExpanded ? 1 : 0 }}
                    className={`h-px mx-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} 
                  />

                  {/* Glow Toggle */}
                  <motion.div 
                    layout="position"
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    className={`rounded-full px-4 py-2.5 flex items-center justify-between transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Эффекты сияния
                    </span>
                    <motion.button
                      onClick={() => setIsGlowEnabled(!isGlowEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        isGlowEnabled ? getAccentClass('bg') : (theme === 'dark' ? 'bg-white/20' : 'bg-gray-300')
                      }`}
                    >
                      <motion.div 
                        animate={{ x: isGlowEnabled ? 22 : 2 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
