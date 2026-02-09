-- InfluGen Multi-User Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  wavespeed_api_key TEXT, -- User's personal Wavespeed API key
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Allow mixed case usernames, 3-30 chars, alphanumeric + underscore/hyphen
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$')
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view any profile"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. INFLUENCERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_prompt TEXT,
  llm_system_prompt TEXT,
  thumbnail_url TEXT,
  avatar_url TEXT,
  default_reference_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Slug format: lowercase, 1-50 chars
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9_-]{1,50}$'),
  -- Unique slug per user
  UNIQUE(user_id, slug)
);

-- Enable RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Policies for influencers
CREATE POLICY "Users can view own influencers"
  ON public.influencers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own influencers"
  ON public.influencers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own influencers"
  ON public.influencers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own influencers"
  ON public.influencers FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view influencers by username (for URL access)
CREATE POLICY "Public can view influencers by username lookup"
  ON public.influencers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = influencers.user_id
    )
  );

-- ============================================
-- 3. REFERENCE IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('face', 'body', 'boobs', 'pussy', 'edit')) DEFAULT 'face',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reference_images ENABLE ROW LEVEL SECURITY;

-- Policies for reference images (inherit from influencer ownership)
CREATE POLICY "Users can manage reference images for own influencers"
  ON public.reference_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = reference_images.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. GENERATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  is_series BOOLEAN DEFAULT FALSE,
  series_id UUID,
  content_mode TEXT CHECK (content_mode IN ('social', 'sensual', 'porn')) DEFAULT 'social',
  tags TEXT[] DEFAULT '{}',
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Policies for generations (inherit from influencer ownership)
CREATE POLICY "Users can manage generations for own influencers"
  ON public.generations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = generations.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TRASH TABLE (for soft deletes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_generation_id UUID,
  image_url TEXT,
  image_index INTEGER,
  item_type TEXT CHECK (item_type IN ('single_image', 'full_generation')) NOT NULL,
  generation_data JSONB,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;

-- Policies for trash
CREATE POLICY "Users can manage own trash"
  ON public.trash FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_influencers_user_id ON public.influencers(user_id);
CREATE INDEX IF NOT EXISTS idx_influencers_slug ON public.influencers(slug);
CREATE INDEX IF NOT EXISTS idx_generations_influencer_id ON public.generations(influencer_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_user_id ON public.trash(user_id);

-- ============================================
-- 7. DROP OLD TABLE (from previous schema)
-- ============================================
DROP TABLE IF EXISTS public.influencer_settings;
