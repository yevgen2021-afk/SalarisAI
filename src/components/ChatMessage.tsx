import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThumbsUp, ThumbsDown, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'model';
  content: string;
  images?: string[];
  theme: 'dark' | 'light';
  isTyping?: boolean;
  accentColor: string;
  isGlowEnabled?: boolean;
  onRegenerate?: (id: string) => void;
  onReport?: (id: string) => void;
  onLike?: (id: string) => void;
  onDislike?: (id: string) => void;
}

const ChatMessage = memo(({ id, role, content, images, theme, isTyping, accentColor, onRegenerate, onReport, onLike, onDislike }: ChatMessageProps) => {
  const isUser = role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(!isTyping);
  const prevIsTyping = useRef(isTyping);

  useEffect(() => {
    let actionTimer: NodeJS.Timeout;

    if (prevIsTyping.current === true && isTyping === false) {
      actionTimer = setTimeout(() => setShowActions(true), 1500);
    } else if (isTyping) {
      setShowActions(false);
    }

    prevIsTyping.current = isTyping;

    return () => {
      clearTimeout(actionTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const getAccentTextClass = () => {
    switch (accentColor) {
      case 'pink': return 'text-pink-500';
      case 'purple': return 'text-purple-500';
      case 'emerald': return 'text-emerald-500';
      case 'red': return 'text-red-500';
      case 'orange': return 'text-orange-500';
      case 'laguna':
      default: return 'text-cyan-500';
    }
  };

  const getAccentClasses = () => {
    switch (accentColor) {
      case 'pink': return 'bg-pink-400 shadow-pink-400/20';
      case 'purple': return 'bg-purple-500 shadow-purple-500/20';
      case 'emerald': return 'bg-emerald-400 shadow-emerald-400/20';
      case 'red': return 'bg-red-500 shadow-red-500/20';
      case 'orange': return 'bg-orange-500 shadow-orange-500/20';
      case 'laguna':
      default: return 'bg-cyan-500 shadow-cyan-500/20';
    }
  };

  const markdownComponents = useMemo(() => ({
    img: ({node, ...props}: any) => {
      if (!props.src) return null;
      return (
        <img 
          className="rounded-xl max-w-full h-auto my-2 border border-white/20 shadow-sm block" 
          {...props} 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    },
    p: ({node, ...props}: any) => <p className={`mb-3 last:mb-0 leading-relaxed text-[16px] font-medium ${isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-black')}`} {...props} />,
    a: ({node, ...props}: any) => <a className={`${isUser ? 'text-white underline' : 'text-pink-400 hover:text-pink-300 underline'} underline-offset-4 transition-colors text-[16px]`} {...props} />,
    strong: ({node, ...props}: any) => <strong className={`font-bold ${isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-black')}`} {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-3 space-y-2 text-[16px]" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-3 space-y-2 text-[16px]" {...props} />,
    li: ({node, ...props}: any) => <li className={`leading-relaxed text-[16px] font-medium ${isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-black')}`} {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className={`border-l-4 pl-4 italic my-3 ${isUser ? 'border-white/50 text-white/90' : (theme === 'dark' ? 'border-gray-500 text-white' : 'border-gray-400 text-black')}`} {...props} />,
    code: ({node, className, children, ...props}: any) => {
      const match = /language-(\w+)/.exec(className || '')
      const isInline = !match && !className;
      
      if (!isInline && match) {
        return (
          <div className="my-4 rounded-xl overflow-hidden border border-white/20 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 text-xs text-white font-mono border-b border-white/20">
              <span>{match[1]}</span>
            </div>
            <SyntaxHighlighter
              style={theme === 'dark' ? vscDarkPlus : vs}
              language={match[1]}
              PreTag="div"
              customStyle={{ margin: 0, borderRadius: 0, background: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)' }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      return (
        <code className={`${isUser ? 'bg-black/10 text-white' : (theme === 'dark' ? 'bg-black/40 text-pink-300' : 'bg-black/5 text-pink-600')} px-1.5 py-0.5 rounded-md text-sm font-mono`} {...props}>
          {children}
        </code>
      )
    },
    table: ({node, ...props}: any) => (
      <div className="overflow-x-auto my-4 rounded-xl border border-white/20">
        <table className="w-full text-left border-collapse text-sm" {...props} />
      </div>
    ),
    thead: ({node, ...props}: any) => <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} {...props} />,
    th: ({node, ...props}: any) => <th className={`p-3 font-semibold border-b ${theme === 'dark' ? 'border-white/20 text-white' : 'border-black/10 text-black'}`} {...props} />,
    td: ({node, ...props}: any) => <td className={`p-3 border-b ${theme === 'dark' ? 'border-white/20 text-white' : 'border-black/10 text-black'}`} {...props} />,
    tr: ({node, ...props}: any) => <tr className={theme === 'dark' ? 'hover:bg-white/5 transition-colors' : 'hover:bg-black/5 transition-colors'} {...props} />
  }), [isUser, theme]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{ transformOrigin: 'center' }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-12 group`}
    >
      <div className="relative max-w-[85%] md:max-w-[75%] w-fit">
        <div className="relative">
          {/* Message Content */}
          <AnimatePresence mode="wait">
              <motion.div
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`relative z-10 px-4 py-2.5 rounded-[2rem] font-sans backdrop-blur-xl backdrop-saturate-150 ${
                  isUser 
                    ? `${getAccentClasses()} shadow-sm` 
                    : (theme === 'dark' 
                        ? 'bg-black/40 border border-white/20 text-white shadow-[0_0_15px_rgba(0,0,0,0.1)]' 
                        : 'bg-white/60 border border-white/40 text-black shadow-[0_0_15px_rgba(0,0,0,0.12)]')
                } transition-all duration-300`}
              >
                <ReactMarkdown 
                  urlTransform={(url) => url}
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
              {content}
            </ReactMarkdown>
            {images && images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) => (
                  <img key={idx} src={img} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-white/20 shadow-sm" />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>

        {/* Action Icons */}
        {!isUser && (
          <div className={`absolute top-full left-2 mt-2 flex items-center gap-2 transition-opacity duration-500 z-20 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
              <motion.button 
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 1.1 }}
                onClick={() => onLike?.(id)}
                className={`p-1.5 rounded-full transition-colors backdrop-blur-xl backdrop-saturate-150 ${theme === 'dark' ? 'bg-black/40 border border-white/20 text-white hover:text-emerald-400 shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-white/60 border border-white/40 text-black hover:text-emerald-600 shadow-[0_0_15px_rgba(0,0,0,0.12)]'}`}
                title="Лайк"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 1.1 }}
                onClick={() => onDislike?.(id)}
                className={`p-1.5 rounded-full transition-colors backdrop-blur-xl backdrop-saturate-150 ${theme === 'dark' ? 'bg-black/40 border border-white/20 text-white hover:text-orange-400 shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-white/60 border border-white/40 text-black hover:text-orange-600 shadow-[0_0_15px_rgba(0,0,0,0.12)]'}`}
                title="Дизлайк"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 1.1 }}
                onClick={handleCopy}
                className={`p-1.5 rounded-full transition-colors backdrop-blur-xl backdrop-saturate-150 ${theme === 'dark' ? 'bg-black/40 border border-white/20 text-white hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-white/60 border border-white/40 text-black hover:text-black shadow-[0_0_15px_rgba(0,0,0,0.12)]'}`}
                title="Копировать"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </motion.button>
              {onRegenerate && (
                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => onRegenerate(id)}
                  className={`p-1.5 rounded-full transition-colors backdrop-blur-xl backdrop-saturate-150 ${theme === 'dark' ? 'bg-black/40 border border-white/20 text-white hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-white/60 border border-white/40 text-black hover:text-black shadow-[0_0_15px_rgba(0,0,0,0.12)]'}`}
                  title="Переделать ответ"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </motion.button>
              )}
              {onReport && (
                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => onReport(id)}
                  className={`p-1.5 rounded-full transition-colors backdrop-blur-xl backdrop-saturate-150 ${theme === 'dark' ? 'bg-black/40 border border-white/20 text-white hover:text-red-400 shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-white/60 border border-white/40 text-black hover:text-red-500 shadow-[0_0_15px_rgba(0,0,0,0.12)]'}`}
                  title="Сообщить об ошибке"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        )}
        
        {/* User Action Icons */}
        {isUser && (
          <div className="absolute top-full right-2 mt-2 flex items-center gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.1 }}
              onClick={handleCopy}
              className={`p-1.5 rounded-full transition-colors backdrop-blur-xl backdrop-saturate-150 ${theme === 'dark' ? 'bg-black/40 border border-white/20 text-white hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-white/60 border-white/40 text-black hover:text-black shadow-[0_0_15px_rgba(0,0,0,0.12)]'}`}
              title="Копировать"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ChatMessage;
