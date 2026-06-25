# Andre &amp; Lulu ❤️
> A beautiful romantic couple website with realtime sync across all devices.

Stack: Vite + React + TypeScript + Tailwind + Framer Motion + Supabase + Cloudinary

## 🚀 Production Setup

### 1. Supabase
- Create project at https://supabase.com
- Copy **Project URL** and **anon public key**
- Run SQL from `src/lib/supabaseClient.ts` in Supabase SQL Editor (creates 5 tables + RLS + realtime)

### 2. Cloudinary
- Create account at https://cloudinary.com
- Create **unsigned upload preset** (Settings > Upload > Upload presets)
- Copy cloud name and preset name

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
VITE_ADMIN_PASSWORD=AndreLulu#2022*
```

### 4. Deploy to Vercel
- Push to GitHub → import to Vercel
- Add env vars in Vercel project settings
- Connect custom domain `andrelulu.my.id`

## 🔐 Admin
- Click the floating ❤️ Love button in the top right
- Password: `AndreLulu#2022*` (or env `VITE_ADMIN_PASSWORD`)
- Admin can upload, edit, and delete: Journal posts, Gallery photos, Songs, Timeline events, and Site settings.

## 📱 Features
- 💖 Realtime across ALL devices (Supabase Realtime)
- 📸 Masonry photo gallery with lightbox/fullscreen
- 🎵 Music player (MP3 / YouTube / Spotify / SoundCloud) with floating glassmorphism widget
- 📝 Love journal
- 🗓️ Timeline events
- ⚙️ Background music synced across all devices
- 🦋 Floating hearts, butterflies, sparkles, heart cursor
- 🌙 Mobile responsive
- 🔒 Password-protected admin
