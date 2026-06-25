import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Support Vite (VITE_) and Next.js (NEXT_PUBLIC_) prefixes
declare global { interface Window { __env?: Record<string,string> } }
const envGet = (key: string): string | undefined => {
  const v = (import.meta as any).env
  const w = typeof window !== 'undefined' ? (window as any).__env || {} : {}
  return v?.[key] ?? v?.['NEXT_PUBLIC_' + key.replace(/^VITE_/,'')] ?? w[key] ?? w['NEXT_PUBLIC_' + key.replace(/^VITE_/,'')]
}

const url = envGet('VITE_SUPABASE_URL')
const anonKey = envGet('VITE_SUPABASE_ANON_KEY')

export const supabase: SupabaseClient | null = (url && anonKey) ? createClient(url, anonKey, { auth: { persistSession: true } }) : null
export const isSupabaseLive = !!supabase

export const CLOUDINARY_CLOUD_NAME = envGet('VITE_CLOUDINARY_CLOUD_NAME') || ''
export const CLOUDINARY_UPLOAD_PRESET = envGet('VITE_CLOUDINARY_UPLOAD_PRESET') || ''
export const ADMIN_PASSWORD = envGet('VITE_ADMIN_PASSWORD') || 'AndreLulu#2022*'

/*
  ================= SUPABASE SQL SETUP =================
  Run this in Supabase SQL Editor to create all tables, RLS, and realtime:

  -- Enable UUID extension
  create extension if not exists "uuid-ossp";

  -- Photos (gallery)
  create table if not exists public.photos (
    id uuid primary key default uuid_generate_v4(),
    image_url text not null,
    caption text,
    description text,
    created_at timestamptz default now()
  );

  -- Songs (playlist)
  create table if not exists public.songs (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    artist text,
    url text not null,
    type text not null default 'mp3', -- mp3 | youtube | spotify | soundcloud
    position int default 0,
    created_at timestamptz default now()
  );

  -- Events (timeline)
  create table if not exists public.events (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    date text not null,
    description text,
    emoji text default '💗',
    position int default 0
  );

  -- Love words (journal / quotes)
  create table if not exists public.love_words (
    id uuid primary key default uuid_generate_v4(),
    text text not null,
    author text not null,
    mood text default '💗',
    image_url text,
    created_at timestamptz default now()
  );

  -- Settings (singleton, id=1)
  create table if not exists public.settings (
    id int primary key default 1,
    couple_name text default 'Andre & Lulu',
    name_a text default 'Andre',
    name_b text default 'Lulu',
    photo_a text,
    photo_b text,
    hero_subtitle text default 'In a loving relationship 💞',
    city text default 'Jakarta, ID',
    background_music_url text,
    background_music_title text,
    background_music_artist text,
    background_music_type text default 'mp3',
    start_date date default '2023-05-16',
    constraint single_row check (id = 1)
  );
  insert into public.settings (id) values (1) on conflict do nothing;

  -- Enable RLS
  alter table public.photos enable row level security;
  alter table public.songs enable row level security;
  alter table public.events enable row level security;
  alter table public.love_words enable row level security;
  alter table public.settings enable row level security;

  -- Public read policies
  create policy "read_photos" on public.photos for select using (true);
  create policy "read_songs" on public.songs for select using (true);
  create policy "read_events" on public.events for select using (true);
  create policy "read_love_words" on public.love_words for select using (true);
  create policy "read_settings" on public.settings for select using (true);

  -- Public write policies (password protects UI layer, RLS open for simplicity; you can tighten later with auth)
  create policy "write_photos" on public.photos for all using (true) with check (true);
  create policy "write_songs" on public.songs for all using (true) with check (true);
  create policy "write_events" on public.events for all using (true) with check (true);
  create policy "write_love_words" on public.love_words for all using (true) with check (true);
  create policy "write_settings" on public.settings for all using (true) with check (true);

  -- Enable realtime for all tables
  alter publication supabase_realtime add table photos, songs, events, love_words, settings;

  -- Storage: buat bucket 'love-assets' (public) via Storage UI jika ingin pakai Supabase Storage,
  -- tapi kita pakai Cloudinary, jadi tidak perlu storage bucket.
*/
