import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

const PRESET_WALLPAPERS = [
  'https://picsum.photos/seed/nature/1920/1080',
  'https://picsum.photos/seed/abstract/1920/1080',
  'https://picsum.photos/seed/space/1920/1080',
  'https://picsum.photos/seed/mountains/1920/1080',
  'https://picsum.photos/seed/dark/1920/1080',
  'https://picsum.photos/seed/colorful/1920/1080',
  'https://picsum.photos/seed/beach/1920/1080',
  'https://picsum.photos/seed/minimal/1920/1080',
  'https://picsum.photos/seed/night/1920/1080',
];

interface WallpaperSettingsProps {
  theme: 'dark' | 'light';
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  setSettingsView: (view: any) => void;
  setIsSettingsInteracting: (isInteracting: boolean) => void;
  getAccentClass: (type: 'bg' | 'text' | 'border' | 'hover' | 'shadow') => string;
}

export default function WallpaperSettings({
  theme,
  backgroundImage,
  setBackgroundImage,
  setSettingsView,
  setIsSettingsInteracting,
  getAccentClass
}: WallpaperSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBackgroundImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col w-full h-[400px]">
      <div className="flex items-center gap-2 mb-4 px-2">
        <motion.button 
          whileTap={{ scale: 0.95 }}
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
          Обои
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-6">
        <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
          {PRESET_WALLPAPERS.map((url, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBackgroundImage(url)}
              className={`relative aspect-[9/16] sm:aspect-video rounded-xl overflow-hidden border-2 transition-colors ${
                backgroundImage === url 
                  ? 'border-cyan-500' 
                  : (theme === 'dark' ? 'border-transparent hover:border-white/20' : 'border-transparent hover:border-black/10')
              }`}
            >
              <img src={url} alt={`Wallpaper ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {theme === 'dark' && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-row gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onTapStart={() => setIsSettingsInteracting(true)}
            onTap={() => setIsSettingsInteracting(false)}
            onTapCancel={() => setIsSettingsInteracting(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 h-10 rounded-full font-medium text-white transition-all ${getAccentClass('bg')} ${getAccentClass('hover')}`}
          >
            Выбрать обои
          </motion.button>
          
          {backgroundImage && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onTapStart={() => setIsSettingsInteracting(true)}
              onTap={() => setIsSettingsInteracting(false)}
              onTapCancel={() => setIsSettingsInteracting(false)}
              onClick={() => setBackgroundImage(null)}
              className="flex-1 h-10 rounded-full font-medium text-white transition-all bg-red-500 hover:bg-red-600"
            >
              Удалить обои
            </motion.button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
