import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SalarisLogo } from './SalarisLogo';
import { WindowsSpinner } from './WindowsSpinner';

interface AuthScreenProps {
  theme: 'dark' | 'light';
  accentColor: string;
  onLoginSuccess: (user: any) => void;
}

type ViewState = 'initial' | 'login' | 'register' | 'mfa';

export default function AuthScreen({ theme, accentColor, onLoginSuccess }: AuthScreenProps) {
  const [viewState, setViewState] = useState<ViewState>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const getAccentClass = (type: 'bg' | 'text' | 'border' | 'hover' | 'shadow') => {
    switch (accentColor) {
      case 'pink': return type === 'bg' ? 'bg-pink-400' : type === 'text' ? 'text-pink-400' : type === 'border' ? 'border-pink-400' : type === 'shadow' ? 'shadow-pink-400/20' : 'hover:bg-pink-500';
      case 'purple': return type === 'bg' ? 'bg-purple-500' : type === 'text' ? 'text-purple-500' : type === 'border' ? 'border-purple-500' : type === 'shadow' ? 'shadow-purple-500/20' : 'hover:bg-purple-600';
      case 'emerald': return type === 'bg' ? 'bg-emerald-400' : type === 'text' ? 'text-emerald-400' : type === 'border' ? 'border-emerald-400' : type === 'shadow' ? 'shadow-emerald-400/20' : 'hover:bg-emerald-500';
      case 'red': return type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-500' : type === 'border' ? 'border-red-500' : type === 'shadow' ? 'shadow-red-500/20' : 'hover:bg-red-600';
      case 'orange': return type === 'bg' ? 'bg-orange-500' : type === 'text' ? 'text-orange-500' : type === 'border' ? 'border-orange-500' : type === 'shadow' ? 'shadow-orange-500/20' : 'hover:bg-orange-600';
      case 'sky':
      default: return type === 'bg' ? 'bg-[#007AFF]' : type === 'text' ? 'text-[#007AFF]' : type === 'border' ? 'border-[#007AFF]' : type === 'shadow' ? 'shadow-[#007AFF]/20' : 'hover:bg-[#0062cc]';
    }
  };

  const translateError = (message: string) => {
    if (message.includes('Invalid login credentials')) return 'Неверный email или пароль';
    if (message.includes('User already registered')) return 'Пользователь с таким email уже зарегистрирован';
    if (message.includes('Password should be at least 6 characters')) return 'Пароль должен содержать минимум 6 символов';
    if (message.includes('Email not confirmed')) return 'Email не подтвержден. Проверьте почту.';
    if (message.includes('Too many requests')) return 'Слишком много попыток. Попробуйте позже.';
    if (message.includes('Database error saving new user')) return 'Ошибка базы данных при создании профиля. Попробуйте другой Email или обратитесь в поддержку.';
    if (message.includes('Failed to fetch') || message.includes('Load failed')) return 'Нет соединения с базой данных. (Возможно, ваш проект Supabase ушел в спящий режим/paused, так как вы долго не заходили).';
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
      if (viewState === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Проверяем, требуется ли MFA
        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors();
        if (!mfaError && mfaData.all && mfaData.all.length > 0) {
          setViewState('mfa');
          setIsLoading(false);
          return;
        }

        onLoginSuccess(data.user);
      } else if (viewState === 'register') {
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
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#f5f0e6] text-black'} transition-colors duration-500`}>
      
      <div className="w-full max-w-[400px] flex flex-col gap-6 my-auto relative">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-2"
          >
            <SalarisLogo className="w-12 h-12 object-contain" />
            <h1 className={`text-4xl font-outfit font-bold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              salaris<span className={getAccentClass('text')}>ai</span>
            </h1>
          </motion.div>
          <p className={`text-sm mt-2 font-medium tracking-tight h-5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
            Твой персональный ИИ ассистент
          </p>
        </div>

        {/* Floating Authentication Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewState}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              style={{ willChange: "transform, opacity" }}
              className={`w-full rounded-[2.5rem] border relative overflow-hidden backdrop-blur-xl ${
                theme === 'dark' 
                  ? 'bg-[#121212]/90 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)]' 
                  : 'bg-[#eae1d3]/95 border-[#d6cfc2] shadow-[0_25px_60px_rgba(0,0,0,0.08)]'
              } ${viewState === 'initial' ? 'pt-8 px-6 pb-8' : 'pt-10 px-8 pb-8'}`}
            >
              {/* Back Button */}
              {viewState !== 'initial' && (
                <button
                  type="button"
                  onClick={() => {
                    if (viewState === 'mfa') setViewState('login');
                    else setViewState('initial');
                  }}
                  className={`absolute left-6 top-6 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5' 
                      : 'bg-black/5 hover:bg-black/10 text-black border border-black/5'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              {/* Title inside card */}
              {viewState !== 'initial' && (
                <div className="text-center mb-6">
                  <h2 className={`text-xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {viewState === 'login' ? 'Вход в аккаунт' : viewState === 'register' ? 'Регистрация' : 'MFA Подтверждение'}
                  </h2>
                </div>
              )}

              {/* Initial Screen View */}
              {viewState === 'initial' && (
                <div className="flex flex-col gap-4">
                  <div className="text-center mb-2 px-2">
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                      Для продолжения работы, пожалуйста, авторизуйтесь под своим аккаунтом Salaris.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setViewState('login')}
                    className={`w-full h-14 rounded-full font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-98 ${
                      theme === 'dark'
                        ? 'bg-white text-black hover:bg-gray-100 shadow-white/5'
                        : 'bg-black text-white hover:bg-gray-900 shadow-black/10'
                    }`}
                  >
                    Войти с Salaris Account
                    <ArrowRight className="w-5 h-5 flex-shrink-0" />
                  </button>

                  <div className="text-center mt-2">
                    <button
                      onClick={() => setViewState('register')}
                      className={`text-sm font-semibold transition-colors ${
                        theme === 'dark' ? 'text-[#8B5CF6] hover:text-[#a78bfa]' : 'text-[#8B5CF6] hover:text-[#7c3aed]'
                      }`}
                    >
                      Создать новый аккаунт
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Factor Authentication View */}
              {viewState === 'mfa' && (
                <form onSubmit={handleMfaVerify} className="space-y-6">
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} />
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      autoFocus
                      className={`w-full h-14 pl-12 pr-4 text-center text-2xl tracking-[0.5em] font-mono rounded-full outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/5 text-white placeholder:text-white/30 focus:border-white/10 focus:bg-white/10' 
                          : 'bg-black/5 border border-black/5 text-black placeholder:text-black/40 focus:border-black/10 focus:bg-white/50'
                      }`}
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 py-2.5 px-4 rounded-2xl border border-red-500/10">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || mfaCode.length !== 6}
                    className={`w-full h-14 rounded-full font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.08)] select-none active:scale-98 ${getAccentClass('bg')} ${getAccentClass('hover')} ${getAccentClass('shadow')} ${isLoading || mfaCode.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? <WindowsSpinner className="w-5 h-5" colorClass="text-white" /> : 'Подтвердить'}
                  </button>
                </form>
              )}

              {/* Login & Register Views */}
              {(viewState === 'login' || viewState === 'register') && (
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {viewState === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative"
                      >
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Ваше имя"
                          required={viewState === 'register'}
                          className={`w-full h-14 pl-12 pr-4 rounded-full outline-none transition-all ${
                            theme === 'dark' 
                              ? 'bg-white/5 border border-white/5 text-white placeholder:text-white/30 focus:border-white/10 focus:bg-white/10' 
                              : 'bg-black/5 border border-black/5 text-black placeholder:text-black/40 focus:border-black/10 focus:bg-white/50'
                          }`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className={`w-full h-14 pl-12 pr-4 rounded-full outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/5 text-white placeholder:text-white/30 focus:border-white/10 focus:bg-white/10' 
                          : 'bg-black/5 border border-black/5 text-black placeholder:text-black/40 focus:border-black/10 focus:bg-white/50'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      required
                      minLength={6}
                      className={`w-full h-14 pl-12 pr-4 rounded-full outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/5 text-white placeholder:text-white/30 focus:border-white/10 focus:bg-white/10' 
                          : 'bg-black/5 border border-black/5 text-black placeholder:text-black/40 focus:border-black/10 focus:bg-white/50'
                      }`}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-500 text-sm text-center font-semibold bg-red-500/10 py-2.5 px-4 rounded-2xl border border-red-500/10 leading-snug"
                      >
                        {error}
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-emerald-500 text-sm text-center font-semibold bg-emerald-500/10 py-2.5 px-4 rounded-2xl border border-emerald-500/10 leading-snug"
                      >
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className={`w-full h-14 mt-2 rounded-full font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-98 ${getAccentClass('bg')} ${getAccentClass('hover')} ${getAccentClass('shadow')} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <WindowsSpinner className="w-5 h-5" colorClass="text-white" />
                    ) : (
                      <>
                        {viewState === 'login' ? 'Войти' : 'Зарегистрироваться'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Form Toggles */}
              {(viewState === 'login' || viewState === 'register') && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setViewState(viewState === 'login' ? 'register' : 'login')}
                    className={`text-sm font-semibold transition-colors ${
                      theme === 'dark' ? 'text-[#8B5CF6] hover:text-[#a78bfa]' : 'text-[#8B5CF6] hover:text-[#7c3aed]'
                    }`}
                  >
                    {viewState === 'login' ? 'Создать новый аккаунт' : 'Уже есть аккаунт? Войти'}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
