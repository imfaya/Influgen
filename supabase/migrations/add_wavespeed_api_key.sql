-- Migration to add wavespeed_api_key column to profiles table
-- Run this in Supabase SQL Editor if database already exists

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wavespeed_api_key TEXT;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.profiles.wavespeed_api_key IS 'User personal Wavespeed API key for image generation';
