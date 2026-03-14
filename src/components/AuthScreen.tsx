import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  theme: 'dark' | 'light';
  accentColor: string;
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ theme, accentColor, onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAccentClass = (type: 'bg' | 'text' | 'border' | 'hover') => {
    switch (accentColor) {
      case 'pink': return type === 'bg' ? 'bg-pink-500' : type === 'text' ? 'text-pink-500' : type === 'border' ? 'border-pink-500' : 'hover:bg-pink-600';
      case 'purple': return type === 'bg' ? 'bg-purple-500' : type === 'text' ? 'text-purple-500' : type === 'border' ? 'border-purple-500' : 'hover:bg-purple-600';
      case 'emerald': return type === 'bg' ? 'bg-emerald-500' : type === 'text' ? 'text-emerald-500' : type === 'border' ? 'border-emerald-500' : 'hover:bg-emerald-600';
      case 'red': return type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-500' : type === 'border' ? 'border-red-500' : 'hover:bg-red-600';
      case 'orange': return type === 'bg' ? 'bg-orange-500' : type === 'text' ? 'text-orange-500' : type === 'border' ? 'border-orange-500' : 'hover:bg-orange-600';
      case 'laguna':
      default: return type === 'bg' ? 'bg-cyan-500' : type === 'text' ? 'text-cyan-500' : type === 'border' ? 'border-cyan-500' : 'hover:bg-cyan-600';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase не настроен. Добавьте ключи в .env');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log(`Attempting ${isLogin ? 'login' : 'signup'} for ${email}...`);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Превышено время ожидания ответа от сервера (30 сек)')), 30000)
      );

      if (isLogin) {
        const { data, error } = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          timeoutPromise
        ]) as any;
        if (error) throw error;
        console.log('Login successful');
        onLoginSuccess(data.user);
      } else {
        const { error, data } = await Promise.race([
          supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: {
                display_name: displayName || email.split('@')[0]
              }
            }
          }),
          timeoutPromise
        ]) as any;
        if (error) throw error;
        console.log('Signup successful', data);
        
        if (data?.user && !data.session) {
          setError('Регистрация успешна! Пожалуйста, проверьте почту для подтверждения (если это требуется в настройках Supabase).');
          setIsLoading(false);
          return;
        }
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Произошла ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px]"
      >
        <div className="flex flex-col items-center mb-12">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${getAccentClass('bg')}`}>
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-google font-bold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-0.5`}>
            salaris<span className={getAccentClass('text')}>ai</span>
          </h1>
          <p className={`mt-3 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Войдите в приложение, чтобы продолжить
          </p>
        </div>

        <div className={`p-8 rounded-[2rem] border shadow-xl ${
          theme === 'dark' 
            ? 'bg-[#1a1a1a] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
            : 'bg-white border-gray-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
        }`}>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="relative"
              >
                <Brain className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя"
                  required={!isLogin}
                  className={`w-full h-12 pl-12 pr-4 rounded-xl outline-none transition-colors ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:bg-white/10' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white'
                  }`}
                />
              </motion.div>
            )}
            <div>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className={`w-full h-12 pl-12 pr-4 rounded-xl outline-none transition-colors ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:bg-white/10' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white'
                  }`}
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  required
                  minLength={6}
                  className={`w-full h-12 pl-12 pr-4 rounded-xl outline-none transition-colors ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 focus:bg-white/10' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`w-full h-12 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all ${getAccentClass('bg')} ${getAccentClass('hover')} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Войти с SalarisAI' : 'Зарегистрироваться'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className={`text-sm font-medium transition-colors ${getAccentClass('text')} hover:underline`}
            >
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
