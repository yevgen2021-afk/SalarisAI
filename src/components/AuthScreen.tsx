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
  const [error, setError] = useState<string | null>(supabase ? null : 'Supabase не настроен. Пожалуйста, добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройки (Settings -> Environment Variables).');

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

  const handleGoogleAuth = async () => {
    if (!supabase) {
      setError('Supabase не настроен. Добавьте ключи в .env');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при авторизации через Google');
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

          <div className="mt-6 flex items-center gap-4">
            <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>или</span>
            <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className={`mt-6 w-full h-12 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors ${
              theme === 'dark'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Войти с Google
          </button>

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
