import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = (url && anonKey) ? createClient(url, anonKey, {
  auth: { persistSession: true }
}) : null

export const isSupabaseLive = !!supabase

// Simple schema helpers (for when you connect your real Supabase project)
// Run this SQL in Supabase SQL Editor to create tables:
//
// create table public.profiles (
//   id uuid primary key default gen_random_uuid(),
//   name_a text, name_b text,
//   photo_a text, photo_b text,
//   start_date date,
//   status text,
//   updated_at timestamptz default now()
// );
// create table public.posts (
//   id uuid primary key default gen_random_uuid(),
//   author text, body text,
//   image_url text,
//   mood text,
//   created_at timestamptz default now()
// );
// create table public.gallery (
//   id uuid primary key default gen_random_uuid(),
//   url text, caption text,
//   likes int default 0,
//   created_at timestamptz default now()
// );
// create table public.music (
//   id uuid primary key default gen_random_uuid(),
//   title text, artist text,
//   source text, -- youtube | mp3 | spotify | soundcloud
//   url text,
//   position int default 0
// );
// alter table public.posts enable row level security;
// alter table public.gallery enable row level security;
// alter table public.music enable row level security;
// -- public read
// create policy "public_read_posts" on public.posts for select using (true);
// create policy "public_read_gallery" on public.gallery for select using (true);
// create policy "public_read_music" on public.music for select using (true);
// -- authenticated write
// create policy "admin_write_posts" on public.posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
// create policy "admin_write_gallery" on public.gallery for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
// create policy "admin_write_music" on public.music for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
// -- enable realtime
// alter publication supabase_realtime add table posts, gallery, music;
// -- storage bucket: love-images (public)
