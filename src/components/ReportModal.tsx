import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  theme: 'dark' | 'light';
  isSubmitting?: boolean;
  type?: 'report' | 'like' | 'dislike';
}

export default function ReportModal({ isOpen, onClose, onSubmit, theme, isSubmitting, type = 'report' }: ReportModalProps) {
  const [reason, setReason] = useState('');

  const getTitle = () => {
    switch (type) {
      case 'like': return 'Расскажите, что вам понравилось?';
      case 'dislike': return 'Расскажите, что вам не понравилось?';
      default: return 'Сообщить об ошибке';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'like': return 'Расскажите, что именно было полезно...';
      case 'dislike': return 'Расскажите, что пошло не так...';
      default: return 'Опишите проблему...';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'like': return 'Ваш отзыв поможет нам сделать ответы лучше.';
      case 'dislike': return 'Мы изучим этот случай, чтобы исправить ошибки в будущем.';
      default: return 'Опишите проблему. Если вы сообщаете об ошибке в сообщении, мы автоматически прикрепим контекст переписки.';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'like': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'dislike': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-red-500 hover:bg-red-600';
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason.trim());
    setReason('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 500, mass: 0.8 }}
            style={{ willChange: "transform, opacity" }}
            className={`relative w-full max-w-[400px] rounded-[2rem] overflow-hidden hyper-glass hyper-glass-shadow pointer-events-auto`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-outfit font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {getTitle()}
                </h3>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {getDescription()}
              </p>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={getPlaceholder()}
                className={`w-full h-32 p-4 rounded-2xl resize-none outline-none transition-colors ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/60 focus:border-white/20 focus:bg-white/10' 
                    : 'bg-gray-50 border border-gray-200 text-black placeholder:text-black/60 focus:border-gray-300 focus:bg-white'
                }`}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-black'
                  }`}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason.trim() || isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-medium text-white transition-opacity ${
                    !reason.trim() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  } ${getButtonColor()}`}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
