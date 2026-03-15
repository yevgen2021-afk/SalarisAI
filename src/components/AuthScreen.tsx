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
  const [success, setSuccess] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

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

  const translateError = (message: string) => {
    if (message.includes('Invalid login credentials')) return 'Неверный email или пароль';
    if (message.includes('User already registered')) return 'Пользователь с таким email уже зарегистрирован';
    if (message.includes('Password should be at least 6 characters')) return 'Пароль должен содержать минимум 6 символов';
    if (message.includes('Email not confirmed')) return 'Email не подтвержден. Проверьте почту.';
    if (message.includes('Too many requests')) return 'Слишком много попыток. Попробуйте позже.';
    if (message.includes('Database error saving new user')) return 'Ошибка базы данных при создании профиля. Попробуйте другой Email или обратитесь в поддержку.';
    return message;
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.totp[0];
      if (!totpFactor) throw new Error('Фактор аутентификации не найден');

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: mfaCode
      });

      if (verifyError) throw verifyError;

      const { data: { user } } = await supabase.auth.getUser();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(translateError(err.message || 'Неверный код подтверждения'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Ошибка на стороне сервера. Повторите попытку позже.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Проверяем, требуется ли MFA
        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors();
        if (!mfaError && mfaData.all && mfaData.all.length > 0) {
          setMfaStep(true);
          setIsLoading(false);
          return;
        }

        onLoginSuccess(data.user);
      } else {
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0]
            }
          }
        });
        if (error) throw error;
        
        if (data?.user && !data.session) {
          setSuccess('Ещё чуть-чуть. Проверьте почту и подтвердите регистрацию.');
          setIsLoading(false);
          return;
        }
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(translateError(err.message || 'Произошла ошибка при авторизации'));
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
            {mfaStep ? 'Введите 6-значный код безопасности' : 'Войдите в Salaris Account, чтобы продолжить'}
          </p>
        </div>

        <div className={`p-8 rounded-[2rem] border shadow-xl ${
          theme === 'dark' 
            ? 'bg-[#1a1a1a] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
            : 'bg-white border-gray-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
        }`}>
          {mfaStep ? (
            <form onSubmit={handleMfaVerify} className="space-y-6">
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  autoFocus
                  className={`w-full h-14 pl-12 pr-4 text-center text-2xl tracking-[0.5em] font-mono rounded-xl outline-none transition-colors ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:bg-white/10' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-gray-300 focus:bg-white'
                  }`}
                />
              </div>

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className={`w-full h-12 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all ${getAccentClass('bg')} ${getAccentClass('hover')} ${isLoading || mfaCode.length !== 6 ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Подтвердить'}
              </button>

              <button
                type="button"
                onClick={() => setMfaStep(false)}
                className={`w-full text-sm font-medium ${theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Вернуться к входу
              </button>
            </form>
          ) : (
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
                  className="text-red-500 text-sm text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-emerald-500 text-sm text-center font-medium"
                >
                  {success}
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
                  {isLogin ? 'Войти с Salaris Account' : 'Зарегистрироваться'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          )}

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
