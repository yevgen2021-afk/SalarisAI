import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown, Copy, Check, RefreshCw } from 'lucide-react';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'model';
  content: string;
  theme: 'dark' | 'light';
  isTyping?: boolean;
  accentColor: string;
  isGlowEnabled: boolean;
  onRegenerate?: (id: string) => void;
}

const ChatMessage = memo(({ id, role, content, theme, isTyping, accentColor, isGlowEnabled, onRegenerate }: ChatMessageProps) => {
  const isUser = role === 'user';
  const [showFinishGlow, setShowFinishGlow] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(!isTyping);
  const prevIsTyping = useRef(isTyping);

  useEffect(() => {
    let glowTimer: NodeJS.Timeout;
    let actionTimer: NodeJS.Timeout;

    if (prevIsTyping.current === true && isTyping === false) {
      if (isGlowEnabled) {
        setShowFinishGlow(true);
        glowTimer = setTimeout(() => setShowFinishGlow(false), 1500);
      }
      actionTimer = setTimeout(() => setShowActions(true), 1500);
    } else if (isTyping) {
      setShowActions(false);
      setShowFinishGlow(false);
    }

    prevIsTyping.current = isTyping;

    return () => {
      clearTimeout(glowTimer);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{ transformOrigin: 'center', willChange: "transform, opacity" }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-12 group`}
    >
      {isUser && (
        <button 
          onClick={handleCopy}
          className={`mr-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full self-center ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'}`}
          title="Копировать"
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
      <div className="relative max-w-[85%] md:max-w-[75%] w-fit">
        <div className="relative">
          {/* Finish Glow - Edges */}
          {isGlowEnabled && (
            <div className={`absolute -inset-[2px] z-0 transition-opacity duration-1000 ease-out blur-[8px] ${showFinishGlow ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
              <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
                <div className="absolute top-1/2 left-1/2 w-[4000px] h-[4000px] max-w-none max-h-none bg-[conic-gradient(from_0deg,#ffb3ba,#ffdfba,#ffffba,#baffc9,#bae1ff,#dcbaff,#ffb3ba)] animate-spin-center"></div>
              </div>
            </div>
          )}

          {/* Finish Glow - Inner (Center to Edges) */}
          {isGlowEnabled && (
            <div className={`absolute inset-0 z-20 rounded-[2rem] transition-opacity duration-1000 ease-out ${showFinishGlow ? 'opacity-100' : 'opacity-0'} pointer-events-none mix-blend-overlay`}
                 style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 80%)' }}
            />
          )}

          <AnimatePresence mode="wait">
              <motion.div
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`relative z-10 px-4 py-2.5 rounded-[2rem] font-sans ${isUser ? `${getAccentClasses()} shadow-sm` : 'glass-panel'} transition-all duration-300`}
              >
                <ReactMarkdown 
                  urlTransform={(url) => url}
                  components={{
                    img: ({node, ...props}) => {
                      if (!props.src) return null;
                      return (
                        <img 
                          className="rounded-xl max-w-full h-auto my-2 border border-white/10 shadow-sm block" 
                          {...props} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      );
                    },
                p: ({node, ...props}) => <p className={`mb-3 last:mb-0 leading-relaxed text-[16px] font-normal ${isUser ? 'text-white' : (theme === 'dark' ? 'text-gray-100' : 'text-gray-800')}`} {...props} />,
                a: ({node, ...props}) => <a className={`${isUser ? 'text-white underline' : 'text-pink-400 hover:text-pink-300 underline'} underline-offset-4 transition-colors text-[16px]`} {...props} />,
                strong: ({node, ...props}) => <strong className={`font-medium ${isUser ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-gray-900')}`} {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-3 space-y-2 text-[16px]" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-3 space-y-2 text-[16px]" {...props} />,
                li: ({node, ...props}) => <li className={`leading-relaxed text-[16px] font-normal ${isUser ? 'text-white' : (theme === 'dark' ? 'text-gray-100' : 'text-gray-800')}`} {...props} />,
                blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-4 italic my-3 ${isUser ? 'border-white/50 text-white/90' : (theme === 'dark' ? 'border-gray-500 text-gray-300' : 'border-gray-400 text-gray-600')}`} {...props} />,
                code: ({node, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return match ? (
                    <pre className={`${isUser ? 'bg-black/10 text-white' : 'glass-panel'} rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono leading-relaxed`}>
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code className={`${isUser ? 'bg-black/10 text-white' : 'glass-panel'} px-2 py-0.5 rounded-md text-sm font-mono`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </motion.div>
        </AnimatePresence>
        </div>

        {/* Action Icons */}
        {!isUser && (
          <div className={`absolute top-full left-2 mt-2 flex items-center gap-1 transition-opacity duration-500 z-10 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
              <button 
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'}`}
                title="Лайк"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'}`}
                title="Дизлайк"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
              <button 
                onClick={handleCopy}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'}`}
                title="Копировать"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              {onRegenerate && (
                <button 
                  onClick={() => onRegenerate(id)}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'}`}
                  title="Переделать ответ"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ChatMessage;
