import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Lightbulb, Check, ChevronLeft, FlaskConical, X, Square } from 'lucide-react';
import { SalarisLogo } from './SalarisLogo';

export interface ChatInputProps {
  theme: string;
  isActionMenuOpen: boolean;
  setIsActionMenuOpen: (val: boolean) => void;
  actionMenuView: 'main' | 'model';
  setActionMenuView: (val: 'main' | 'model') => void;
  isActionMenuInteracting: boolean;
  setIsActionMenuInteracting: (val: boolean) => void;
  isThinkingMode: boolean;
  setIsThinkingMode: (val: boolean) => void;
  selectedModel: string;
  setSelectedModel: (val: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  input: string;
  setInput: (val: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isGenerating: boolean;
  isLoading: boolean;
  handleSend: () => void;
  handleStopGeneration: () => void;
  getAccentClass: (type: 'bg' | 'text' | 'border' | 'shadow' | 'hover') => string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  theme,
  isActionMenuOpen,
  setIsActionMenuOpen,
  actionMenuView,
  setActionMenuView,
  isActionMenuInteracting,
  setIsActionMenuInteracting,
  isThinkingMode,
  setIsThinkingMode,
  selectedModel,
  setSelectedModel,
  fileInputRef,
  selectedFiles,
  setSelectedFiles,
  input,
  setInput,
  textareaRef,
  isGenerating,
  isLoading,
  handleSend,
  handleStopGeneration,
  getAccentClass,
}) => {
  return (
    <>
      <div className="flex items-end gap-3 max-w-3xl mx-auto w-full pointer-events-auto">
        {/* Action Menu Button */}
        <div className="relative w-12 h-12 flex-shrink-0">
          {/* Backdrop for action menu */}
          <AnimatePresence>
            {isActionMenuOpen && (
              <motion.div
                key="action-menu-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsActionMenuOpen(false)}
                style={{ willChange: "opacity" }}
                className="fixed inset-0 z-[-1] bg-transparent pointer-events-auto"
              />
            )}
          </AnimatePresence>

          {/* Plus icon inside the round toggle button */}
          <AnimatePresence>
            {!isActionMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ 
                    scale: 0.95,
                    transition: { type: "spring", stiffness: 400, damping: 30 }
                  }}
                  animate={{
                    transition: { type: "spring", stiffness: 400, damping: 30 },
                    scale: 1 
                  }}
                  style={{ willChange: "transform" }}
                  onClick={() => setIsActionMenuOpen(true)}
                  className={`w-full h-full flex items-center justify-center rounded-full border transition-colors cursor-pointer backdrop-blur-xl ${
                    theme === 'dark' 
                      ? 'bg-black/40 border-white/10 text-white shadow-[0_4px_40px_rgba(0,0,0,0.04)]' 
                      : 'bg-white/30 border-white/40 text-black shadow-[0_4px_40px_rgba(0,0,0,0.08)]'
                  }`}
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
                  className={`absolute bottom-0 left-0 z-[200] w-64 rounded-[2rem] overflow-hidden p-2 backdrop-blur-xl backdrop-saturate-150 border ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
                >
                  <div className="flex flex-col">
                    <motion.button
                      
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
                          : 'hover:bg-black/5 active:bg-black/10 text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Plus className="w-4 h-4" />
                        <span>Добавить файл</span>
                      </div>
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
                          : 'hover:bg-black/5 active:bg-black/10 text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Lightbulb className={`w-4 h-4 ${isThinkingMode ? getAccentClass('text') : ''}`} />
                        <span className={isThinkingMode ? getAccentClass('text') : ''}>Размышление</span>
                      </div>
                      {isThinkingMode && <Check className={`w-4 h-4 ${getAccentClass('text')}`} />}
                    </motion.button>

                    <motion.button 
                      
                      onTapStart={() => setIsActionMenuInteracting(true)}
                      onTap={() => setIsActionMenuInteracting(false)}
                      onTapCancel={() => setIsActionMenuInteracting(false)}
                      onClick={() => setActionMenuView('model')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                          : 'hover:bg-black/5 active:bg-black/10 text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FlaskConical className="w-4 h-4" />
                        Модель
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {selectedModel === 'moonshotai/kimi-k2-instruct-0905' ? 'Osmium XL' : 'Osmium V'}
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
                  className={`absolute bottom-0 left-0 z-[200] w-64 rounded-[2rem] overflow-hidden border p-2 backdrop-blur-xl ${
                    theme === 'dark' 
                      ? 'bg-black/40 border-white/20 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' 
                      : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 px-2 pb-2">
                      <motion.button 
                        onTapStart={() => setIsActionMenuInteracting(true)}
                        onTap={() => setIsActionMenuInteracting(false)}
                        onTapCancel={() => setIsActionMenuInteracting(false)}
                        onClick={() => setActionMenuView('main')}
                        className={`p-2 rounded-full transition-colors ${
                          theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </motion.button>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        Выберите модель
                      </span>
                    </div>
                    
                    <motion.button 
                      
                      onTapStart={() => setIsActionMenuInteracting(true)}
                      onTap={() => setIsActionMenuInteracting(false)}
                      onTapCancel={() => setIsActionMenuInteracting(false)}
                      onClick={() => { setSelectedModel('meta-llama/llama-4-scout-17b-16e-instruct'); setActionMenuView('main'); }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                          : 'hover:bg-black/5 active:bg-black/10 text-black'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>Osmium V</span>
                        <span className={`text-[11px] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Быстрый ответ</span>
                      </div>
                      {selectedModel === 'meta-llama/llama-4-scout-17b-16e-instruct' && <Check className="w-4 h-4" />}
                    </motion.button>
                    <motion.button 
                      
                      onTapStart={() => setIsActionMenuInteracting(true)}
                      onTap={() => setIsActionMenuInteracting(false)}
                      onTapCancel={() => setIsActionMenuInteracting(false)}
                      onClick={() => { setSelectedModel('moonshotai/kimi-k2-instruct-0905'); setActionMenuView('main'); }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                          : 'hover:bg-black/5 active:bg-black/10 text-black'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>Osmium XL</span>
                        <span className={`text-[11px] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Подробный ответ</span>
                      </div>
                      {selectedModel === 'moonshotai/kimi-k2-instruct-0905' && <Check className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        <div className="relative group flex-1">
          {/* Vibrant rainbow glow (bloom) */}
          <div className="absolute -inset-[1px] z-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-[5px]">
            <div 
              className="w-full h-full rounded-[2.5rem] relative overflow-hidden"
              style={{
                padding: '2px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude'
              }}
            >
              <div className="absolute top-1/2 left-1/2 w-[4000px] h-[4000px] max-w-none max-h-none bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] animate-spin-center" style={{ animationDuration: '6s' }}></div>
            </div>
          </div>

          {/* Input Bar Container */}
          <div className={`relative z-10 flex flex-col rounded-[2rem] p-1.5 backdrop-blur-xl backdrop-saturate-150 border transition-shadow duration-700 group-focus-within:!shadow-none ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}>
            
            {/* Top section: Pills and Image Preview */}
            <AnimatePresence initial={false}>
              {isThinkingMode && (
                <motion.div 
                  key="pills-container"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', willChange: 'height, opacity' }}
                >
                  <div className="flex flex-wrap items-center gap-2 px-3 pt-2 pb-1.5 pointer-events-auto">
                    <motion.div 
                      key="thinking-mode"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-full px-3 py-1.5 border ${theme === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-100'}`}
                    >
                      <Lightbulb className={`w-3.5 h-3.5 ${getAccentClass('text')}`} />
                      <span className={`text-[13px] font-medium ${getAccentClass('text')}`}>Размышление</span>
                      <button onClick={() => setIsThinkingMode(false)} className={`ml-1 ${getAccentClass('text')} hover:opacity-70 transition-opacity`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 w-full">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
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
                      <div key={idx} className={`relative flex items-center justify-center w-12 h-12 rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-white/20' : 'border-black/10'}`}>
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                        <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
              placeholder="Спросить SalarisAI"
              className={`w-full bg-transparent ${theme === 'dark' ? 'text-white placeholder-white/60' : 'text-black placeholder-black/60'} resize-none min-h-[36px] overflow-y-auto py-[8px] px-4 focus:outline-none text-[16px] font-medium font-sans leading-tight`}
              rows={1}
            />
            </div>
            <motion.button
              whileTap={{ scale: 1.1 }}
              style={{ willChange: "transform" }}
              onClick={isGenerating ? handleStopGeneration : handleSend}
              disabled={(!isGenerating && !input.trim() && selectedFiles.length === 0) || (isLoading && !isGenerating)}
              className={`w-[36px] h-[36px] flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] ${
                (!isGenerating && !input.trim() && selectedFiles.length === 0)
                  ? (theme === 'dark' ? 'bg-white/10 text-white/20' : 'bg-black/5 text-black/20')
                  : `${getAccentClass('bg')} ${getAccentClass('hover')} text-white ${getAccentClass('shadow')}`
              } ${(isLoading && !isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? <Square className="w-4 h-4 fill-current" /> : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12.707 3.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L11 6.414V20a1 1 0 1 0 2 0V6.414l5.293 5.293a1 1 0 0 0 1.414-1.414l-7-7z" />
                </svg>
              )}
            </motion.button>
            </div>
          </div>
        </div>
      </div>
      <p className={`text-center text-[11px] ${theme === 'dark' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'} mt-4 font-medium hidden sm:block pointer-events-auto`}>
        <SalarisLogo className="w-3 h-3 inline-block align-middle mr-1 pb-[1px]" />
        SalarisAI может ошибаться. Перепроверяйте информацию.
      </p>
    </>
  );
}
