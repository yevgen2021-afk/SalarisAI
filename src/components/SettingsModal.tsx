import React from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { User, LogOut, Paintbrush, Info, ChevronLeft, Camera, Trash2, Check, AlertCircle } from 'lucide-react';
import { ACCENT_COLORS } from '../constants';

const ColorOptionButton = ({ color, theme, accentColor, setAccentColor, setIsSettingsInteracting, setSettingsView }: any) => {
  const controls = useAnimation();
  return (
    <motion.button
      animate={controls}
      onTapStart={async () => {
        setIsSettingsInteracting(true);
        await controls.start({ scale: 0.95, transition: { duration: 0.1 } });
        controls.start({ scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } });
      }}
      onTap={() => setIsSettingsInteracting(false)}
      onTapCancel={() => setIsSettingsInteracting(false)}
      onClick={() => {
        setAccentColor(color.id);
        setSettingsView('customization');
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-colors ${
        theme === 'dark' 
          ? 'hover:bg-white/10 active:bg-white/20 text-white' 
          : 'hover:bg-black/5 active:bg-black/10 text-black'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full ${color.bg} shadow-sm`} />
        <span className="text-sm font-medium">
          {color.name}
        </span>
      </div>
      {accentColor === color.id && <Check className="w-4 h-4" />}
    </motion.button>
  );
};

export interface SettingsModalProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settingsView: 'main' | 'customization' | 'about' | 'account' | 'edit-profile' | 'color-selection';
  setSettingsView: (view: 'main' | 'customization' | 'about' | 'account' | 'edit-profile' | 'color-selection') => void;
  isSettingsInteracting: boolean;
  setIsSettingsInteracting: (interacting: boolean) => void;
  theme: 'dark' | 'light';
  user: any;
  profile: { display_name?: string, avatar_url?: string } | null;
  getAvatarColor: (name: string) => string;
  setTempName: (name: string) => void;
  tempName: string;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: () => void;
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  getAccentClass: (type: 'bg' | 'text' | 'border' | 'shadow' | 'hover') => string;
  accentColor: string;
  setAccentColor: (color: string) => void;
  autoTheme: boolean;
  setAutoTheme: (autoTheme: boolean) => void;
  toggleTheme: () => void;
  deleteAllChats: () => void;
  handleReport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isSettingsOpen,
  setIsSettingsOpen,
  settingsView,
  setSettingsView,
  isSettingsInteracting,
  setIsSettingsInteracting,
  theme,
  user,
  profile,
  getAvatarColor,
  setTempName,
  tempName,
  handleAvatarUpload,
  handleUpdateProfile,
  handleLogout,
  handleDeleteAccount,
  getAccentClass,
  accentColor,
  setAccentColor,
  autoTheme,
  setAutoTheme,
  toggleTheme,
  deleteAllChats,
  handleReport,
}) => {
  return (
    <>
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
            className="fixed inset-0 z-[200] bg-transparent"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSettingsOpen && (
          settingsView === 'main' ? (
            <motion.div 
              key="main"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 backdrop-blur-xl backdrop-saturate-150 border ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <div className="flex flex-col">
                {user && (
                  <div className="flex items-center gap-4 mb-4 px-2">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-[0_4px_40px_rgba(0,0,0,0.04)] flex-shrink-0 ${getAvatarColor(profile?.display_name || user?.email || 'U')}`}>
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          decoding="async" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('Avatar load failed:', profile.avatar_url);
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        (profile?.display_name || user?.email || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-base font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {profile?.display_name || 'Пользователь'}
                      </span>
                      <span className={`text-xs truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {user?.email}
                      </span>
                    </div>
                  </div>
                )}

                {user && (
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => {
                      setTempName(profile?.display_name || '');
                      setSettingsView('edit-profile');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                        : 'hover:bg-black/5 active:bg-black/10 text-black'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Редактировать профиль
                  </motion.button>
                )}

                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                <motion.button 
                  
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={() => setSettingsView('customization')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                      : 'hover:bg-black/5 active:bg-black/10 text-black'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />
                  Кастомизация
                </motion.button>
                
                <motion.button 
                  
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={() => setSettingsView('about')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 active:bg-white/20 text-white' 
                      : 'hover:bg-black/5 active:bg-black/10 text-black'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  О приложении
                </motion.button>
              </div>
            </motion.div>
          ) : settingsView === 'edit-profile' ? (
            <motion.div 
              key="edit-profile"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 backdrop-blur-xl backdrop-saturate-150 border ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('main')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    Редактировать профиль
                  </span>
                </div>

                <div className="flex flex-col gap-4 px-2 mb-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-[0_4px_40px_rgba(0,0,0,0.04)] ${getAvatarColor(profile?.display_name || user?.email || 'U')}`}>
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('Avatar load failed (settings):', profile.avatar_url);
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        (profile?.display_name || user?.email || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div className="relative w-full">
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <motion.button 
                        
                        onTapStart={() => setIsSettingsInteracting(true)}
                        onTap={() => setIsSettingsInteracting(false)}
                        onTapCancel={() => setIsSettingsInteracting(false)}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          theme === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10 text-white' 
                            : 'bg-black/5 hover:bg-black/10 text-black'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        Изменить фото
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      Имя пользователя
                    </label>
                    <input 
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className={`appearance-none border border-transparent shadow-none w-full h-10 px-4 text-sm transition-all duration-300 focus:outline-none focus:ring-0 rounded-full ${
                        theme === 'dark' 
                          ? 'bg-black/40 text-white placeholder-white/40' 
                          : 'bg-gray-300 text-black placeholder-black/60'
                      }`}
                    />
                  </div>

                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={handleUpdateProfile}
                    className={`w-full h-10 rounded-full font-medium text-white transition-all ${getAccentClass('bg')} ${getAccentClass('hover')}`}
                  >
                    Сохранить
                  </motion.button>
                </div>

                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                <div className="flex flex-col">
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти из аккаунта
                  </motion.button>

                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={handleDeleteAccount}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить аккаунт
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : settingsView === 'customization' ? (
            <motion.div 
              key="customization"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 backdrop-blur-xl backdrop-saturate-150 border ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('main')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    Кастомизация
                  </span>
                </div>

                <div className="flex flex-col">
                  {/* Color Selection */}
                  <motion.button
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('color-selection')}
                    className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      Цвет сообщений
                    </span>
                    <div className="h-6 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full ${getAccentClass('bg')} shadow-sm`} />
                    </div>
                  </motion.button>

                  {/* Auto Theme Toggle */}
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setAutoTheme(!autoTheme)}
                    className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                    }`}
                  >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      Системная тема
                    </span>
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${
                        autoTheme ? getAccentClass('bg') : (theme === 'dark' ? 'bg-white/20' : 'bg-gray-300')
                      }`}
                    >
                      <motion.div 
                        animate={{ 
                          x: autoTheme ? 20 : 4,
                          width: 16,
                          backgroundColor: "rgba(255,255,255,1)",
                          backdropFilter: "blur(0px)"
                        }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute left-0 h-4 rounded-full shadow-sm"
                      />
                    </div>
                  </motion.button>

                  {/* Dark Theme Toggle */}
                  <AnimatePresence initial={false}>
                    {!autoTheme && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <motion.button 
                          
                          onTapStart={() => setIsSettingsInteracting(true)}
                          onTap={() => setIsSettingsInteracting(false)}
                          onTapCancel={() => setIsSettingsInteracting(false)}
                          onClick={toggleTheme}
                          className={`w-full rounded-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                            theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-black/5 active:bg-black/10'
                          }`}
                        >
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            Темная тема
                          </span>
                          <div
                            className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${
                              theme === 'dark' ? getAccentClass('bg') : 'bg-gray-300'
                            }`}
                          >
                            <motion.div 
                              animate={{ 
                                x: theme === 'dark' ? 20 : 4,
                                width: 16,
                                backgroundColor: "rgba(255,255,255,1)",
                                backdropFilter: "blur(0px)"
                              }}
                              transition={{ type: "spring", damping: 20, stiffness: 300 }}
                              className="absolute left-0 h-4 rounded-full shadow-sm"
                            />
                          </div>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : settingsView === 'color-selection' ? (
            <motion.div 
              key="color-selection"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-56 rounded-[2rem] overflow-hidden p-4 backdrop-blur-xl backdrop-saturate-150 border ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('customization')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    Выберите цвет
                  </span>
                </div>

                <div className="flex flex-col gap-1 px-2">
                  {ACCENT_COLORS.map((color) => (
                    <ColorOptionButton
                      key={color.id}
                      color={color}
                      theme={theme}
                      accentColor={accentColor}
                      setAccentColor={setAccentColor}
                      setIsSettingsInteracting={setIsSettingsInteracting}
                      setSettingsView={setSettingsView}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="about"
              initial={{ scale: 0, opacity: 0, z: 0 }}
              animate={{ 
                scale: isSettingsInteracting ? 0.95 : 1, 
                opacity: 1,
                z: 0,
                transition: { type: "spring", damping: 25, stiffness: 300 } 
              }}
              exit={{ scale: 0, opacity: 0, z: 0, transition: { duration: 0.15, ease: "easeOut" } }}
              style={{ 
                transformOrigin: 'calc(100% - 44px) 22px', 
                willChange: "transform, opacity"
              }}
              className={`fixed top-4 right-4 md:right-8 z-[201] w-72 rounded-[2rem] overflow-hidden p-4 backdrop-blur-xl backdrop-saturate-150 border ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.04)]' : 'bg-white/30 border-white/40 shadow-[0_4px_40px_rgba(0,0,0,0.08)]'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <motion.button 
                    
                    onTapStart={() => setIsSettingsInteracting(true)}
                    onTap={() => setIsSettingsInteracting(false)}
                    onTapCancel={() => setIsSettingsInteracting(false)}
                    onClick={() => setSettingsView('main')}
                    className={`p-2 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    О приложении
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    Версия
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    1.5
                  </span>
                </div>

                <div className={`h-px w-full my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />

                <motion.button 
                  
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={deleteAllChats}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить все чаты
                </motion.button>

                <motion.button
                  
                  onTapStart={() => setIsSettingsInteracting(true)}
                  onTap={() => setIsSettingsInteracting(false)}
                  onTapCancel={() => setIsSettingsInteracting(false)}
                  onClick={() => handleReport()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  Сообщить об ошибке
                </motion.button>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </>
  );
};
