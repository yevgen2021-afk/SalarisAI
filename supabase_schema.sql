-- ==========================================
-- 1. ТАБЛИЦА ПРОФИЛЕЙ (profiles)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для profiles
CREATE POLICY "Профили видны всем" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Пользователи могут обновлять свой профиль" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Пользователи могут вставлять свой профиль" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. ТАБЛИЦА ЖАЛОБ И ОТЗЫВОВ (reports)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'report', -- 'report', 'like', 'dislike'
  reason TEXT NOT NULL,
  message_id TEXT,
  message_text TEXT,
  chat_id TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для reports
CREATE POLICY "Пользователи могут отправлять отчеты" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Админы могут видеть все отчеты" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Функция для удаления пользователя (вызывается через RPC)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. АВТОМАТИЗАЦИЯ (Триггеры)
-- ==========================================

-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. ХРАНИЛИЩЕ (Storage) - ИНСТРУКЦИЯ
-- ==========================================
-- Эти команды нельзя выполнить в SQL Editor для создания бакета, 
-- бакет 'avatars' нужно создать вручную в интерфейсе Supabase (раздел Storage).
-- Но политики для него можно прописать здесь:

/*
-- Политики для бакета 'avatars' (выполнить после создания бакета вручную):

CREATE POLICY "Аватарки доступны всем"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Пользователи могут загружать свои аватарки"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Пользователи могут обновлять свои аватарки"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
*/
