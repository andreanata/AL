import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Music2, Image as ImageIcon, BookHeart, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, LogOut, Plus, Send, X, Link as LinkIcon, CalendarDays, MapPin, Cherry, Pencil, Trash2, Save, ShieldCheck, Upload, Shuffle, Minimize2, Maximize2 } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { supabase, isSupabaseLive, ADMIN_PASSWORD } from './lib/supabaseClient'
import { uploadToCloudinary } from './lib/cloudinary'

// ---- Types (map to new Supabase schema)
type LoveWord = { id: string; text: string; author: 'Andre' | 'Lulu' | string; mood?: string; image_url?: string | null; created_at: string }
type Photo = { id: string; image_url: string; caption?: string; description?: string; created_at: string }
type Song = { id: string; title: string; artist?: string; url: string; type: 'mp3' | 'youtube' | 'spotify' | 'soundcloud'; position?: number; created_at?: string }
type EventItem = { id: string; title: string; date: string; description?: string; emoji?: string; position?: number }
type Settings = {
  id?: number
  couple_name?: string
  name_a: string; name_b: string
  photo_a: string; photo_b: string
  hero_subtitle: string
  city: string
  background_music_url?: string | null
  background_music_title?: string | null
  background_music_artist?: string | null
  background_music_type?: 'mp3' | 'youtube' | 'spotify' | 'soundcloud'
  start_date: string
}

// ---- Fallback demo (used ONLY if Supabase is not configured — in-memory only, no persistence)
const DEMO_SETTINGS: Settings = {
  name_a: 'Andre', name_b: 'Lulu',
  photo_a: 'https://images.pexels.com/photos/6789624/pexels-photo-6789624.jpeg?auto=compress&cs=tinysrgb&w=520&h=520&fit=crop',
  photo_b: 'https://images.pexels.com/photos/33046894/pexels-photo-33046894.jpeg?auto=compress&cs=tinysrgb&w=520&h=520&fit=crop',
  start_date: '2023-05-16',
  hero_subtitle: 'In a loving relationship 💞',
  city: 'Jakarta, ID',
  background_music_url: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
  background_music_title: 'Blue — Yung Kai',
  background_music_artist: 'Andre & Lulu',
  background_music_type: 'mp3'
}
const DEMO_WORDS: LoveWord[] = [
  { id:'p3', author:'Lulu', text:'Hari ini makan seblak bareng, ketawa sampe sakit perut hihi 🥹❤️ kamu selalu bikin hariku manis.', mood:'🥹', image_url:'https://images.pexels.com/photos/33046894/pexels-photo-33046894.jpeg?auto=compress&cs=tinysrgb&w=900', created_at: new Date(Date.now()-1000*60*60*8).toISOString() },
  { id:'p2', author:'Andre', text:'Nemenin Lulu ngerjain tugas sampai malem, lucu banget pas ngantuk-ngantuk gitu 😭💤 love u more.', mood:'😴', image_url:null, created_at: new Date(Date.now()-1000*60*60*30).toISOString() },
  { id:'p1', author:'Lulu', text:'First date anniversary core memory ✨ nonton + es krim strawberry. Kamu genggam tanganku terus 🍓', mood:'🍓', image_url:'https://images.pexels.com/photos/31530483/pexels-photo-31530483.jpeg?auto=compress&cs=tinysrgb&w=900', created_at: new Date(Date.now()-1000*60*60*72).toISOString() },
]
const DEMO_PHOTOS: Photo[] = [
  { id:'g1', image_url:'https://images.pexels.com/photos/31530483/pexels-photo-31530483.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'Sunset kita berdua 🌅', created_at: new Date().toISOString() },
  { id:'g2', image_url:'https://images.pexels.com/photos/33046894/pexels-photo-33046894.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'Cafe date pinky pinky', created_at: new Date().toISOString() },
  { id:'g3', image_url:'https://images.pexels.com/photos/6789624/pexels-photo-6789624.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'hidung ketemu hidung hehe', created_at: new Date().toISOString() },
  { id:'g4', image_url:'https://images.pexels.com/photos/8450328/pexels-photo-8450328.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'bunga buat kamu 🌷', created_at: new Date().toISOString() },
  { id:'g5', image_url:'https://images.pexels.com/photos/9619136/pexels-photo-9619136.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'jalan sore di pantai', created_at: new Date().toISOString() },
  { id:'g6', image_url:'https://images.pexels.com/photos/14839227/pexels-photo-14839227.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'pelukan yang paling nyaman', created_at: new Date().toISOString() },
]
const DEMO_SONGS: Song[] = [
  { id:'t1', title:'Blue — Yung Kai', artist:'Andre & Lulu', url:'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3', type:'mp3', position:0 },
  { id:'t2', title:'first love (lofi edit)', artist:'Andre <3 Lulu', url:'https://cdn.pixabay.com/audio/2022/05/09/audio_7d0e0c1d6a.mp3', type:'mp3', position:1 },
  { id:'t3', title:'Sunday Morning Slow', artist:'Our song', url:'https://cdn.pixabay.com/audio/2022/10/30/audio_c3c28d0e7f.mp3', type:'mp3', position:2 },
]
const DEMO_EVENTS: EventItem[] = [
  { id:'e1', date:'16 Mei 2023', title:'First date', description:'Mulai jadi official 💗', emoji:'💗' },
  { id:'e2', date:'12 Agu 2023', title:'Trip puncak', description:'Foto di kebun teh, dingin tapi hangat', emoji:'🏔️' },
  { id:'e3', date:'16 Nov 2023', title:'6 month', description:'Surprise dinner small smallan', emoji:'✨' },
  { id:'e4', date:'16 Mei 2024', title:'1st Anniversary', description:'Nonton bioskop + es krim strawberry', emoji:'🍓' },
  { id:'e5', date:'24 Des 2024', title:'Christmas cozy', description:'Movie marathon & hot choco', emoji:'🎄' },
  { id:'e6', date:'14 Feb 2025', title:'Valentine', description:'Buket bunga & surat tulis tangan', emoji:'💌' },
  { id:'e7', date:'Hari ini', title:'Masih bucin', description:'Love dashboard live ✨', emoji:'🌸' },
]

function daysBetween(a: Date, b: Date) { return Math.floor((b.getTime() - a.getTime()) / 86400000) }

// ---- Music helpers
function parseYouTubeId(url: string) {
  try { const u = new URL(url); if (u.hostname.includes('youtu.be')) return u.pathname.slice(1); if (u.hostname.includes('youtube')) return u.searchParams.get('v') } catch { }
  return null
}
function getSpotifyEmbed(url: string) { const m = url.match(/track\/([a-zA-Z0-9]+)/); return m ? `https://open.spotify.com/embed/track/${m[1]}` : url }
function getSoundcloudEmbed(url: string) { return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff6aa9&auto_play=false` }

// ========== MAIN APP ==========
export default function App() {
  const [booting, setBooting] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'journal' | 'gallery' | 'music' | 'timeline'>('home')
  useEffect(() => { const t = setTimeout(() => setBooting(false), 1450); return () => clearTimeout(t) }, [])

  // In-memory admin session (NO localStorage/sessionStorage per requirement)
 const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('isAdmin') === 'true')

  // In-memory state (synced via Supabase Realtime)
  const [settings, setSettings] = useState<Settings>(isSupabaseLive ? { ...DEMO_SETTINGS } : DEMO_SETTINGS)
const [words, setWords] = useState<LoveWord[]>(isSupabaseLive ? [] : DEMO_WORDS)
const [photos, setPhotos] = useState<Photo[]>(isSupabaseLive ? [] : DEMO_PHOTOS)
const [songs, setSongs] = useState<Song[]>(isSupabaseLive ? [] : DEMO_SONGS)
const [events, setEvents] = useState<EventItem[]>(isSupabaseLive ? [] : DEMO_EVENTS)

  // --- Initial fetch from Supabase ---
  useEffect(() => {
    if (!isSupabaseLive || !supabase) return
    const sb = supabase
    ;(async () => {
      try {
        const [{ data: s }, { data: w }, { data: p }, { data: sg }, { data: e }] = await Promise.all([
          sb.from('settings').select('*').eq('id', 1).maybeSingle(),
          sb.from('love_words').select('*').order('created_at', { ascending: false }),
          sb.from('photos').select('*').order('created_at', { ascending: false }),
          sb.from('songs').select('*').order('position', { ascending: true }),
          sb.from('events').select('*').order('position', { ascending: true }),
        ])
      // Line 109–113 (SESUDAH)
if (s) setSettings({ ...DEMO_SETTINGS, ...s })
if (w !== null) setWords(w as any)
if (p !== null) setPhotos(p as any)
if (sg !== null) setSongs(sg as any)
if (e !== null) setEvents(e as any)
        setRealtimeConnected(true)
      } catch (err: any) {
        console.warn('Supabase fetch failed, using demo in-memory data:', err?.message)
      }
    })()
  }, [])

  // --- Realtime subscriptions ---
  useEffect(() => {
    if (!isSupabaseLive || !supabase) return
    const sb = supabase
    const ch = sb.channel('andrelulu-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.1' }, (payload: any) => {
        if (payload.new) setSettings(prev => ({ ...prev, ...payload.new }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'love_words' }, (payload: any) => {
        setWords(cur => {
          if (payload.eventType === 'INSERT') return [payload.new as LoveWord, ...cur]
          if (payload.eventType === 'UPDATE') return cur.map(x => x.id === payload.new.id ? payload.new : x)
          if (payload.eventType === 'DELETE') return cur.filter(x => x.id !== payload.old.id)
          return cur
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, (payload: any) => {
        setPhotos(cur => {
          if (payload.eventType === 'INSERT') return [payload.new as Photo, ...cur]
          if (payload.eventType === 'UPDATE') return cur.map(x => x.id === payload.new.id ? payload.new : x)
          if (payload.eventType === 'DELETE') return cur.filter(x => x.id !== payload.old.id)
          return cur
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setSongs(cur => {
            const exists = cur.find(x => x.id === payload.new.id)
            if (exists) return cur.map(x => x.id === payload.new.id ? payload.new : x)
            return [...cur, payload.new]
          })
        } else if (payload.eventType === 'DELETE') {
          setSongs(cur => cur.filter(x => x.id !== payload.old.id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload: any) => {
        setEvents(cur => {
          if (payload.eventType === 'INSERT') return [...cur, payload.new as EventItem]
          if (payload.eventType === 'UPDATE') return cur.map(x => x.id === payload.new.id ? payload.new : x)
          if (payload.eventType === 'DELETE') return cur.filter(x => x.id !== payload.old.id)
          return cur
        })
      })
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  // ======== CRUD Helpers (writes go to Supabase when live, otherwise in-memory) ========
  // ----- Love words (journal)
  const addWord = async (p: Omit<LoveWord, 'id' | 'created_at'>) => {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('love_words').insert({ text: p.text, author: p.author, mood: p.mood ?? null, image_url: p.image_url ?? null })
      if (error) { toast.error(error.message); return }
      toast.success('Post terkirim! Live sync 💗')
    } else {
      setWords(cur => [{ ...p, id: Math.random().toString(36).slice(2), created_at: new Date().toISOString() }, ...cur])
      toast.success('Post terkirim! 💌')
    }
  }
  const updateWord = async (id: string, patch: Partial<LoveWord>) => {
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('love_words').update(patch).eq('id', id); if (error) { toast.error(error.message); return false } }
    else setWords(cur => cur.map(x => x.id === id ? { ...x, ...patch } : x))
    toast.success('Diupdate ✨'); return true
  }
  const deleteWord = async (id: string) => {
    if (!confirm('Hapus?')) return
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('love_words').delete().eq('id', id); if (error) { toast.error(error.message); return } }
    else setWords(cur => cur.filter(x => x.id !== id))
    toast.success('Terhapus')
  }
  // ----- Photos (gallery)
  const addPhoto = async (image_url: string, caption: string, description = '') => {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('photos').insert({ image_url, caption, description })
      if (error) { toast.error(error.message); return }
    } else {
      setPhotos(cur => [{ id: Math.random().toString(36).slice(2), image_url, caption, description, created_at: new Date().toISOString() }, ...cur])
    }
    toast.success('Foto ditambahkan ✨')
  }
  const updatePhoto = async (id: string, patch: Partial<Photo>) => {
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('photos').update(patch).eq('id', id); if (error) { toast.error(error.message); return false } }
    else setPhotos(cur => cur.map(x => x.id === id ? { ...x, ...patch } : x))
    toast.success('Foto diupdate'); return true
  }
  const deletePhoto = async (id: string) => {
    if (!confirm('Hapus foto?')) return
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('photos').delete().eq('id', id); if (error) { toast.error(error.message); return } }
    else setPhotos(cur => cur.filter(x => x.id !== id))
    toast.success('Foto dihapus')
  }
  // ----- Songs
  const addSong = async (s: Omit<Song, 'id'>) => {
    const nextPos = songs.length
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('songs').insert({ title: s.title, artist: s.artist ?? '', url: s.url, type: s.type, position: nextPos }); if (error) { toast.error(error.message); return false } }
    else setSongs(cur => [...cur, { ...s, id: Math.random().toString(36).slice(2), position: nextPos }])
    toast.success('Lagu ditambahkan 🎵'); return true
  }
  const updateSong = async (id: string, patch: Partial<Song>) => {
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('songs').update(patch).eq('id', id); if (error) { toast.error(error.message); return false } }
    else setSongs(cur => cur.map(x => x.id === id ? { ...x, ...patch } : x))
    toast.success('Track diupdate'); return true
  }
  const deleteSong = async (id: string) => {
    if (!confirm('Hapus lagu?')) return
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('songs').delete().eq('id', id); if (error) { toast.error(error.message); return } }
    else setSongs(cur => cur.filter(x => x.id !== id))
    toast.success('Lagu dihapus')
  }
  // ----- Events (timeline)
  const addEvent = async (e: Omit<EventItem, 'id'>) => {
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('events').insert({ ...e, position: events.length }); if (error) { toast.error(error.message); return } }
    else setEvents(cur => [...cur, { ...e, id: Math.random().toString(36).slice(2) }])
    toast.success('Event ditambahkan 🗓️')
  }
  const updateEvent = async (id: string, patch: Partial<EventItem>) => {
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('events').update(patch).eq('id', id); if (error) { toast.error(error.message); return false } }
    else setEvents(cur => cur.map(x => x.id === id ? { ...x, ...patch } : x))
    toast.success('Event diupdate'); return true
  }
  const deleteEvent = async (id: string) => {
    if (!confirm('Hapus event?')) return
    if (isSupabaseLive && supabase) { const { error } = await supabase.from('events').delete().eq('id', id); if (error) { toast.error(error.message); return } }
    else setEvents(cur => cur.filter(x => x.id !== id))
    toast.success('Event dihapus')
  }
  // ----- Settings
  const updateSettings = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('settings').update(patch).eq('id', 1)
      if (error) { toast.error(error.message); return false }
    }
    toast.success('Pengaturan tersimpan 💗'); return true
  }

  // ======== Music Player State ========
  const allSongs = useMemo(() => {
    const list = [...songs]
    if (settings.background_music_url && !list.find(s => s.url === settings.background_music_url)) {
      list.unshift({
        id: 'bg-music',
        title: settings.background_music_title || 'Background Music',
        artist: settings.background_music_artist || 'Andre & Lulu',
        url: settings.background_music_url,
        type: (settings.background_music_type as any) || 'mp3',
        position: -1,
      })
    }
    return list
  }, [songs, settings])

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [volume, setVolume] = useState(0.74)
  const [shuffle, setShuffle] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentTrack = allSongs[currentTrackIndex] ?? allSongs[0]

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    if (playing) audioRef.current.play().catch(() => { })
    else audioRef.current.pause()
  }, [playing, currentTrackIndex, volume, allSongs])

  // If settings updates the bg music and nothing playing, auto-jump
  useEffect(() => {
    if (currentTrackIndex === 0 && currentTrack) {
      // stay in sync
    }
  }, [settings.background_music_url])

  useEffect(() => {
    if (!booting) {
      setPlaying(true)
      const to = setTimeout(() => toast('🎵 Our love song is playing', { duration: 2200 }), 600)
      return () => clearTimeout(to)
    }
  }, [booting])

  const nextTrack = useCallback(() => {
    if (shuffle) setCurrentTrackIndex(Math.floor(Math.random() * allSongs.length))
    else setCurrentTrackIndex(i => (i + 1) % allSongs.length)
  }, [shuffle, allSongs.length])
  const prevTrack = () => setCurrentTrackIndex(i => (i - 1 + allSongs.length) % allSongs.length)

  // Click hearts
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('button,a,input,textarea,[role="button"],label')) return
      const cx = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX || Math.random() * window.innerWidth
      const cy = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY || Math.random() * window.innerHeight
      spawnHeart(cx, cy)
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  const anniversary = useMemo(() => {
    const start = new Date(settings.start_date); const now = new Date()
    return { totalDays: daysBetween(start, now) }
  }, [settings.start_date])

  // Map data to UI-friendly shape
  const posts = words.map((w): any => ({
    id: w.id, author: w.author, body: w.text, mood: w.mood, image_url: w.image_url, created_at: w.created_at
  }))
  const gallery = photos.map((p): any => ({ id: p.id, url: p.image_url, caption: p.caption, description: p.description, likes: 0, created_at: p.created_at }))

  return (
    <div>
      <div className="min-h-screen bg-[#fff7fb] text-zinc-800 relative overflow-x-clip" style={{ fontFamily: '"Nunito", Quicksand, system-ui, sans-serif' }}>
        <Toaster richColors position="top-center" />
        <GlobalBackgroundSparkles />
        <AnimatePresence>{booting && <BootScreen />}</AnimatePresence>

        {/* HEADER */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#fff7fb]/90 border-b border-pink-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff8ec5] to-[#ff5fa6] shadow-[0_8px_26px_rgba(255,82,157,.34)] flex items-center justify-center text-white font-extrabold">AL</div>
              <div className="leading-tight">
                <div className="text-[18px] font-extrabold tracking-tight text-pink-700">{settings.name_a} &amp; {settings.name_b} 💗</div>
                <div className="text-[11.5px] text-zinc-500 -mt-0.5 font-bold">Couple Memory Dashboard {realtimeConnected && <span className="ml-1 text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-bold">LIVE</span>}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setPlaying(p => !p)} title={playing ? "Matikan musik" : "Putar musik"}
                className={`rounded-full p-2.5 border transition ${playing ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-pink-200 text-zinc-600'} hover:scale-105`}>
                <Music2 size={18} />
              </button>
              <LoveButton isAdmin={isAdmin} onLogin={() => setIsAdmin(true)} onOpenDashboard={() => setShowAdmin(true)} />
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3">
            <nav className="flex gap-1.5 sm:gap-2 text-[13.5px] sm:text-[14px] font-semibold flex-wrap">
              {([
                { k: 'home', label: 'Home', icon: Heart },
                { k: 'journal', label: 'Journal', icon: BookHeart },
                { k: 'gallery', label: 'Gallery', icon: ImageIcon },
                { k: 'music', label: 'Music', icon: Music2 },
                { k: 'timeline', label: 'Timeline', icon: CalendarDays },
              ] as const).map(({ k, label, icon: Icon }) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full transition flex items-center gap-1.5 ${activeTab === k ? 'bg-[#ff5fa6] text-white shadow-lg shadow-pink-200' : 'bg-white text-zinc-700 hover:bg-pink-50 border border-pink-100'}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* MAIN */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-40">

          {/* HOME */}
          {activeTab === 'home' && (
            <div className="grid md:grid-cols-5 gap-6 pt-8">
              <div className="md:col-span-3">
                <div className="rounded-[28px] bg-white/85 border border-pink-200 shadow-[0_24px_70px_rgba(255,95,166,.13)] p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute -right-16 -top-10 w-64 h-64 rounded-full bg-gradient-to-br from-pink-200/60 to-fuchsia-200/66 blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="relative">
                      <div className="flex -space-x-6">
                        <img src={settings.photo_a} alt={settings.name_a} className="w-[132px] h-[132px] sm:w-[148px] sm:h-[148px] rounded-[30px] object-cover border-[6px] border-white shadow-xl shadow-pink-200/70 relative z-10" />
                        <img src={settings.photo_b} alt={settings.name_b} className="w-[132px] h-[132px] sm:w-[148px] sm:h-[148px] rounded-[30px] object-cover border-[6px] border-white shadow-xl shadow-pink-200/70 mt-6" />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#ff5fa6] text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow">Bucin Mode ON</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] text-zinc-500 mb-1 flex items-center gap-2"><MapPin size={14} /> {settings.city}</div>
                      <h1 style={{ fontFamily: '"Fraunces", "Nunito", serif' }} className="text-[36px] sm:text-[44px] leading-[0.98] font-[700] tracking-tight">
                        {settings.name_a}<br /><span className="text-[#ff478f]">&amp; {settings.name_b}</span>
                      </h1>
                      <p className="mt-3 text-[15px] text-zinc-600">{settings.hero_subtitle}</p>
                      <div className="mt-5 flex flex-wrap gap-2 text-[13px] font-bold">
                        <span className="px-3 py-1.5 rounded-full bg-[#ffe5f0] text-[#de2c78]">{anniversary.totalDays} hari bersama</span>
                        <span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white">Since {new Date(settings.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-7 text-center">
                    {[{ n: anniversary.totalDays, l: 'Hari Bersama' }, { n: posts.length, l: 'Love Notes' }].map(s => (
                      <div key={s.l} className="bg-[#fff3f8] rounded-[18px] py-3 border border-pink-100">
                        <div className="text-[22px] font-extrabold text-[#e43a7e]">{s.n}</div>
                        <div className="text-[12px] text-zinc-500">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {posts.slice(0, 2).map(p => (
                    <article key={p.id} className="rounded-[22px] bg-white border border-pink-100 p-4 shadow-sm relative">
                      {isAdmin && <div className="absolute top-3 right-3 flex gap-1.5">
                        <button onClick={() => setShowAdmin(true)} className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200"><Pencil size={13} /></button>
                      </div>}
                      <div className="text-[11.8px] text-zinc-500">{new Date(p.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                      <div className="mt-1 font-extrabold">{p.author} {p.mood || '💗'}</div>
                      <p className="text-[14.5px] text-zinc-700 mt-1 line-clamp-3">{p.body}</p>
                      {p.image_url && <img src={p.image_url} className="mt-3 rounded-[16px] w-full h-40 object-cover" alt="" />}
                    </article>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-5">
                <div className="rounded-[26px] bg-gradient-to-br from-[#ff72b6] to-[#ff4796] text-white p-5 shadow-xl shadow-pink-300/50">
                  <div className="text-[12px] uppercase tracking-widest opacity-90">relationship status</div>
                  <div className="text-[26px] font-extrabold mt-1">Taken, very taken 💍</div>
                  <p className="text-white/90 text-sm mt-2">Officially {settings.name_a} x {settings.name_b}. Bucin since 2023. Realtime across all devices.</p>
                  <div className="flex gap-2 mt-4 text-xs font-bold flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-white/20">💌 daily love notes</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/20">🎵 shared playlist</span>
                  </div>
                </div>
                <div className="rounded-[26px] border border-pink-200 bg-white p-5">
                  <div className="font-extrabold flex items-center gap-2 text-[15.5px]"><Sparkles size={18} className="text-[#ff539d]" /> Now Playing</div>
                  <div className="mt-3 flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-extrabold">♫</div>
                    <div><div className="font-bold">{currentTrack?.title}</div><div className="text-sm text-zinc-500">{currentTrack?.artist}</div></div>
                  </div>
                  <button onClick={() => { setActiveTab('music'); setPlaying(true) }} className="w-full mt-3 bg-[#ff4e97] hover:bg-[#ff2f82] text-white rounded-full py-2.5 font-bold transition">Open player</button>
                </div>
                <div className="rounded-[26px] border border-pink-200 bg-white p-5">
                  <div className="font-extrabold flex items-center gap-2 text-[15.5px]"><Cherry size={18} className="text-[#ff539d]" /> Love stats</div>
                  <ul className="mt-3 text-[14px] text-zinc-700 space-y-2">
                    <li>⭐ Anniversary: 16 Mei</li><li>📍 Based in {settings.city}</li><li>💬 Love language: Quality Time & Words</li>
                    <li>🍓 Lulu's fav: strawberry cheesecake</li><li>🎮 Andre's fav: nugas bareng Lulu</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* JOURNAL */}
          {activeTab === 'journal' && (
            <section className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[28px] font-extrabold tracking-tight">Love Journal</h2>
                {isAdmin && <NewPostButton onSubmit={addWord} />}
              </div>
              {!isAdmin && <div className="mb-4 text-[13.5px] bg-[#fff0f6] border border-pink-200 rounded-2xl px-4 py-3">Kamu lagi mode viewer 👀 — pencet tombol Love untuk masuk Love Mode.</div>}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(p => (
                  <motion.article layout key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[22px] bg-white border border-pink-100 p-4 shadow-sm relative">
                    {isAdmin && <div className="absolute top-3 right-3 flex gap-1">
                      <button title="Edit" onClick={() => setShowAdmin(true)} className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700"><Pencil size={14} /></button>
                      <button title="Hapus" onClick={() => deleteWord(p.id)} className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600"><Trash2 size={14} /></button>
                    </div>}
                    <div className="text-xs text-zinc-500 pr-16">{new Date(p.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    <div className="mt-1 font-extrabold text-[16.5px]">{p.author} <span className="ml-1">{p.mood}</span></div>
                    <p className="mt-1.5 text-[14.7px] leading-relaxed text-zinc-700">{p.body}</p>
                    {p.image_url && <img src={p.image_url} alt="" className="mt-3 w-full h-52 object-cover rounded-[14px]" />}
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {/* GALLERY */}
          {activeTab === 'gallery' && (
            <section className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[28px] font-extrabold tracking-tight">Love Gallery</h2>
                {isAdmin && <UploadGalleryButton onAdd={addPhoto} />}
              </div>
              <div className="columns-2 md:columns-3 gap-3 space-y-3">
                {gallery.map((g, idx) => (
                  <GalleryPhoto key={g.id} item={g} index={idx} isAdmin={isAdmin} onDelete={() => deletePhoto(g.id)} onEdit={() => setShowAdmin(true)} />
                ))}
              </div>
            </section>
          )}

          {/* MUSIC */}
          {activeTab === 'music' && (
            <section className="pt-8 grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <h2 className="text-[28px] font-extrabold tracking-tight mb-4">Our Playlist</h2>
                <div className="space-y-3">
                  {allSongs.map((t, idx) => (
                    <div key={t.id} className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition ${idx === currentTrackIndex ? 'bg-[#ffe7f1] border-pink-300' : 'bg-white border-pink-100 hover:bg-pink-50'}`}>
                      <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center cursor-pointer" onClick={() => { setCurrentTrackIndex(idx); setPlaying(true) }}><Music2 className="text-[#ff458f]" size={20} /></div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setCurrentTrackIndex(idx); setPlaying(true) }}>
                        <div className="font-bold truncate">{t.title}</div>
                        <div className="text-[13px] text-zinc-500 truncate">{t.artist} • {t.type}</div>
                      </div>
                      {isAdmin ? (
                        <div className="flex gap-1.5">
                          <button className="px-2.5 py-1.5 text-xs rounded-full bg-zinc-100 hover:bg-zinc-200" onClick={() => setShowAdmin(true)}>Edit</button>
                          {t.id !== 'bg-music' && <button className="px-2.5 py-1.5 text-xs rounded-full bg-red-50 text-red-600 hover:bg-red-100" onClick={() => deleteSong(t.id)}>Hapus</button>}
                        </div>
                      ) : (
                        <button className="px-3 py-1.5 text-sm rounded-full bg-zinc-900 text-white" onClick={() => { setCurrentTrackIndex(idx); setPlaying(true) }}>{idx === currentTrackIndex && playing ? 'Playing' : 'Play'}</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-[24px] bg-white border border-pink-200 p-5 shadow-sm sticky top-[118px]">
                  <div className="font-extrabold mb-2">Add song to playlist</div>
                  {!isAdmin && <div className="text-sm text-zinc-500 mb-3">Masuk Love Mode untuk menambah lagu.</div>}
                  <MusicAddForm isAdmin={isAdmin} onAdd={addSong} />
                  <div className="mt-6 text-[12.5px] text-zinc-500 leading-relaxed">
                    Supported: YouTube, MP3, Spotify, SoundCloud, Cloudinary audio URL.<br />
                    Player sticky & tetap nyala saat pindah tab.
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TIMELINE */}
          {activeTab === 'timeline' && (
            <section className="pt-8 max-w-3xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[28px] font-extrabold tracking-tight">Our Timeline</h2>
                {isAdmin && <AddEventButton onAdd={addEvent} />}
              </div>
              <ol className="relative border-s-2 border-pink-200 pl-6 space-y-7">
                {events.map(e => (
                  <li key={e.id} className="relative group">
                    <span className="absolute -left-[30px] top-1 w-3.5 h-3.5 bg-[#ff5b9b] rounded-full shadow-[0_0_0_4px_rgba(255,91,155,.20)]" />
                    {isAdmin && <div className="absolute right-0 top-0 hidden group-hover:flex gap-1.5">
                      <button onClick={() => setShowAdmin(true)} className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200"><Pencil size={12} /></button>
                      <button onClick={() => deleteEvent(e.id)} className="p-1.5 rounded-full bg-red-50 text-red-600"><Trash2 size={12} /></button>
                    </div>}
                    <div className="text-[12.5px] text-zinc-500">{e.date}</div>
                    <div className="font-extrabold text-[17px]">{e.emoji} {e.title}</div>
                    <div className="text-zinc-600">{e.description}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        {/* Floating Music Player (bottom-right pink glassmorphism) */}
        <AnimatePresence>
          {!minimized ? (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-20 right-4 sm:right-6 z-[55] w-[320px] max-w-[calc(100vw-2rem)] bg-white/80 backdrop-blur-xl border border-pink-200 rounded-3xl shadow-[0_20px_70px_rgba(255,70,140,.28)] p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff72b6] to-[#ff4796] flex items-center justify-center text-white shadow-md shadow-pink-300/60">
                  {playing ? <Music2 size={18} className="animate-pulse" /> : <Play size={18} className="ml-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-extrabold truncate">{currentTrack?.title}</div>
                  <div className="text-[11.5px] text-zinc-500 truncate">{currentTrack?.artist}</div>
                </div>
                <button onClick={() => setShuffle(s => !s)} className={`p-1.5 rounded-full ${shuffle ? 'bg-pink-100 text-pink-700' : 'text-zinc-400'}`} title="Shuffle"><Shuffle size={14} /></button>
                <button onClick={() => setMinimized(true)} className="p-1.5 text-zinc-400 hover:text-zinc-700" title="Minimize"><Minimize2 size={14} /></button>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={prevTrack} className="p-1.5 rounded-full hover:bg-pink-50"><SkipBack size={16} /></button>
                <button onClick={() => setPlaying(v => !v)} className="w-9 h-9 rounded-full bg-[#ff4b93] text-white flex items-center justify-center shadow shadow-pink-200">
                  {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
                <button onClick={nextTrack} className="p-1.5 rounded-full hover:bg-pink-50"><SkipForward size={16} /></button>
                <Volume2 size={14} className="text-zinc-400 ml-1" />
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="flex-1 accent-[#ff488f]" />
              </div>
            </motion.div>
          ) : (
            <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => setMinimized(false)}
              className={`fixed bottom-[92px] right-4 sm:right-6 z-[55] w-14 h-14 rounded-full bg-gradient-to-br from-[#ff71b9] to-[#ff3c8a] text-white shadow-[0_14px_34px_rgba(255,54,130,.45)] flex items-center justify-center active:scale-95`}
              title="Buka player">
              {playing ? <Music2 size={23} className="animate-pulse" /> : <Maximize2 size={20} />}
              {playing && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white" />}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Hidden audio + embed */}
        <div className="fixed -left-[9999px] -top-[9999px] w-[420px] h-[90px] opacity-0 pointer-events-none">
          {currentTrack?.type === 'mp3' && <audio ref={audioRef} src={currentTrack.url} autoPlay={playing} loop={false} onEnded={nextTrack} />}
          {currentTrack?.type === 'youtube' && (() => { const id = parseYouTubeId(currentTrack.url); return id ? <iframe width="420" height="90" src={`https://www.youtube.com/embed/${id}?autoplay=${playing ? 1 : 0}&controls=0`} allow="autoplay" /> : null })()}
          {currentTrack?.type === 'spotify' && <iframe src={getSpotifyEmbed(currentTrack.url)} width="420" height="90" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />}
          {currentTrack?.type === 'soundcloud' && <iframe width="420" height="90" scrolling="no" allow="autoplay" src={getSoundcloudEmbed(currentTrack.url)} />}
        </div>

        {/* ADMIN DASHBOARD */}
        <AdminDashboard
          open={showAdmin && isAdmin}
          onClose={() => setShowAdmin(false)}
          posts={posts} photos={photos} songs={songs} events={events} settings={settings}
          onUpdateWord={updateWord} onDeleteWord={deleteWord} onAddWord={addWord}
          onUpdatePhoto={updatePhoto} onDeletePhoto={deletePhoto} onAddPhoto={addPhoto}
          onUpdateSong={updateSong} onDeleteSong={deleteSong} onAddSong={addSong}
          onUpdateEvent={updateEvent} onDeleteEvent={deleteEvent} onAddEvent={addEvent}
          onUpdateSettings={updateSettings}
        onSignOut={() => { setIsAdmin(false); setShowAdmin(false); sessionStorage.removeItem('isAdmin'); toast('Keluar dari Love Mode 💤') }}
        />
        <div className="h-24" />
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap'); html,body{scroll-behavior:smooth;cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%23ff5b9b'><path d='M12 21s-6.5-4.35-9-9c-1.6-3 .3-7 3.7-7 1.9 0 3.4 1 4.3 2.5C11.9 6 13.4 5 15.3 5c3.4 0 5.3 4 3.7 7-2.5 4.65-7 9-9 9z'/></svg>") 14 14, auto;}`}</style>
    </div>
  )
}

// ========== UPLOAD TO CLOUDINARY (helper kept for potential future use) ==========
async function handleFileUpload(file: File, resourceType: 'image' | 'video' | 'auto' = 'image') {
  return uploadToCloudinary(file, resourceType)
}

// ========== FILE UPLOAD BUTTON ==========
function FileUploadBtn({ onUploaded, label = 'Upload', accept = 'image/*', resourceType = 'image' as 'image' | 'video' | 'auto' }: { onUploaded: (url: string) => void; label?: string; accept?: string; resourceType?: 'image' | 'video' | 'auto' }) {
  const [uploading, setUploading] = useState(false)
  return (
    <label className={`px-3 py-2 rounded-xl border border-pink-200 cursor-pointer text-sm flex items-center gap-1.5 hover:bg-pink-50 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
      <Upload size={15} /> {uploading ? 'Uploading...' : label}
      <input type="file" accept={accept} className="hidden" onChange={async e => {
        const f = e.target.files?.[0]; if (!f) return
        setUploading(true)
        try {
          const url = await handleFileUpload(f, resourceType)
          onUploaded(url)
          toast.success('File terupload ke Cloudinary ✨')
        } catch (err: any) { toast.error(err.message || 'Upload gagal') }
        finally { setUploading(false) }
      }} />
    </label>
  )
}

// ========== LOVE BUTTON LOGIN ==========
function LoveButton({ isAdmin, onLogin, onOpenDashboard }: { isAdmin: boolean; onLogin: () => void; onOpenDashboard: () => void }) {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const doSignIn = async () => {
    setLoading(true)
    try {
      if (pw === ADMIN_PASSWORD) {
        onLogin()
sessionStorage.setItem('isAdmin', 'true')
toast.success('Love Mode aktif! 💗')
        setOpen(false); setPw('')
      } else { toast.error('Password salah sayang 🥹') }
    } catch { toast.error('Ada kesalahan') }
    finally { setLoading(false) }
  }
  if (isAdmin) return (
    <button onClick={onOpenDashboard} className="text-[13px] px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-extrabold flex items-center gap-1.5 shadow shadow-pink-200 hover:bg-[#ff3382] transition">
      <Heart size={14} fill="white" /> Love Mode
    </button>
  )
  return (<>
    <button onClick={() => setOpen(true)} className="text-[13px] px-3.5 py-2 rounded-full bg-zinc-900 text-white font-bold flex items-center gap-1.5 hover:opacity-90 transition"><Heart size={14} /> Love</button>
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/45 z-[60] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[24px] border border-pink-200 p-6 shadow-2xl relative">
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-zinc-500"><X size={18} /></button>
            <div className="text-xl font-extrabold flex items-center gap-2"><Heart className="text-pink-500" size={20} fill="currentColor" /> Love Mode Login</div>
            <div className="text-sm text-zinc-500 mt-1">Masukkan password khusus couple.</div>
            <div className="mt-4 space-y-3">
              <input type="password" placeholder="Password" className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2.5 outline-none focus:ring-2 ring-pink-300 text-center text-lg tracking-widest font-mono" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doSignIn() }} />
              <button disabled={loading} onClick={doSignIn} className="w-full bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold disabled:opacity-60">{loading ? 'Membuka Gembok Cinta...' : 'Masuk Love Mode'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>)
}

// ========== GALLERY PHOTO (with lightbox) ==========
function GalleryPhoto({ item, isAdmin, onDelete, onEdit }: { item: { id: string; url: string; caption?: string; description?: string }; index: number; isAdmin: boolean; onDelete: () => void; onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  return (<>
    <div className="break-inside-avoid rounded-[20px] overflow-hidden bg-white border border-pink-100 shadow-sm relative group cursor-zoom-in" onClick={() => setOpen(true)}>
      <img src={item.url} alt="" className="w-full object-cover" loading="lazy" />
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/62 to-transparent text-white text-sm">
        <span className="text-[13.5px]">{item.caption}</span>
      </div>
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 rounded-full bg-white/90 text-zinc-800 hover:bg-white"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-full bg-white/90 text-red-600 hover:bg-white"><Trash2 size={13} /></button>
        </div>
      )}
    </div>
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] bg-black/85 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2" onClick={() => setOpen(false)}><X size={20} /></button>
          <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={item.url} className="max-w-full max-h-[90vh] object-contain rounded-2xl" alt="" />
          {item.caption && <div className="absolute bottom-8 left-0 right-0 text-center text-white text-lg font-bold">{item.caption}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  </>)
}

// ========== ADMIN DASHBOARD MODAL ==========
function AdminDashboard({ open, onClose, posts, photos, songs, events, settings,
  onUpdateWord, onDeleteWord, onAddWord,
  onUpdatePhoto, onDeletePhoto, onAddPhoto,
  onUpdateSong, onDeleteSong, onAddSong,
  onUpdateEvent, onDeleteEvent, onAddEvent,
  onUpdateSettings, onSignOut
}: {
  open: boolean; onClose: () => void
  posts: LoveWord[]; photos: Photo[]; songs: Song[]; events: EventItem[]; settings: Settings
  onUpdateWord: (id: string, p: Partial<LoveWord>) => Promise<boolean>; onDeleteWord: (id: string) => Promise<void>; onAddWord: (p: Omit<LoveWord, 'id' | 'created_at'>) => Promise<void>
  onUpdatePhoto: (id: string, p: Partial<Photo>) => Promise<boolean>; onDeletePhoto: (id: string) => Promise<void>; onAddPhoto: (url: string, caption: string, desc?: string) => Promise<void>
  onUpdateSong: (id: string, p: Partial<Song>) => Promise<boolean>; onDeleteSong: (id: string) => Promise<void>; onAddSong: (s: Omit<Song, 'id'>) => Promise<boolean>
  onUpdateEvent: (id: string, p: Partial<EventItem>) => Promise<boolean>; onDeleteEvent: (id: string) => Promise<void>; onAddEvent: (e: Omit<EventItem, 'id'>) => Promise<void>
  onUpdateSettings: (p: Partial<Settings>) => Promise<boolean>; onSignOut: () => void
}) {
  const [tab, setTab] = useState<'words' | 'photos' | 'songs' | 'events' | 'settings'>('words')
  const [editingWord, setEditingWord] = useState<LoveWord | null>(null)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [pf, setPf] = useState(settings)
  useEffect(() => setPf(settings), [settings, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-black/55 flex items-center justify-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
            className="w-full max-w-5xl max-h-[92vh] overflow-hidden bg-[#fff8fc] rounded-[28px] border border-pink-200 shadow-2xl flex flex-col">
            <div className="px-5 sm:px-7 py-4 border-b border-pink-200 flex items-center justify-between bg-white/80 backdrop-blur">
              <div className="font-extrabold text-[18px] flex items-center gap-2"><ShieldCheck className="text-pink-500" size={20} /> Love Dashboard</div>
              <div className="flex items-center gap-2">
                <button onClick={onSignOut} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center gap-1"><LogOut size={13} /> Keluar</button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100"><X size={18} /></button>
              </div>
            </div>
            <div className="px-5 sm:px-7 pt-4 flex gap-2 text-sm font-bold flex-wrap">
              {([
                { k: 'words', l: `Journal (${posts.length})` },
                { k: 'photos', l: `Gallery (${photos.length})` },
                { k: 'songs', l: `Music (${songs.length})` },
                { k: 'events', l: `Timeline (${events.length})` },
                { k: 'settings', l: 'Settings' },
              ] as const).map(t => (
                <button key={t.k} onClick={() => setTab(t.k)} className={`px-3.5 py-2 rounded-full border transition ${tab === t.k ? 'bg-[#ff4b93] text-white border-[#ff4b93]' : 'bg-white border-pink-200 hover:bg-pink-50'}`}>{t.l}</button>
              ))}
            </div>
            <div className="px-5 sm:px-7 py-5 overflow-auto" style={{ maxHeight: 'calc(92vh - 124px)' }}>

              {/* JOURNAL */}
              {tab === 'words' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="font-extrabold">Kelola Love Journal</div>
                    <NewPostButton onSubmit={onAddWord} label="Post baru" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {posts.map(p => (
                      <div key={p.id} className="bg-white border border-pink-100 rounded-2xl p-3 relative">
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />}
                        <div className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleString('id-ID')}</div>
                        <div className="font-bold">{p.author} {p.mood}</div>
                        <div className="text-sm text-zinc-600 line-clamp-2">{p.text}</div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => setEditingWord(p)} className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-bold flex items-center gap-1"><Pencil size={12} /> Edit</button>
                          <button onClick={() => onDeleteWord(p.id)} className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1"><Trash2 size={12} /> Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GALLERY */}
              {tab === 'photos' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="font-extrabold">Kelola Galeri</div>
                    <UploadGalleryButton onAdd={onAddPhoto} label="Upload foto" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map(g => (
                      <div key={g.id} className="bg-white border border-pink-100 rounded-2xl overflow-hidden">
                        <img src={g.image_url} className="w-full h-36 object-cover" />
                        <div className="p-2.5 text-xs">{g.caption || <span className="text-zinc-400">tanpa caption</span>}</div>
                        <div className="px-2.5 pb-2.5 flex gap-2">
                          <button onClick={() => setEditingPhoto(g)} className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center gap-1"><Pencil size={11} /> Edit</button>
                          <button onClick={() => onDeletePhoto(g.id)} className="text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"><Trash2 size={11} /> Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MUSIC */}
              {tab === 'songs' && (
                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 space-y-2">
                    <div className="font-extrabold mb-2">Kelola Playlist</div>
                    {songs.map((t, i) => (
                      <div key={t.id} className="bg-white border border-pink-100 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate text-sm">{t.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{t.artist} • {t.type}</div>
                        </div>
                        <button onClick={() => setEditingSong(t)} className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200">Edit</button>
                        <button onClick={() => onDeleteSong(t.id)} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100">Hapus</button>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-pink-100 rounded-2xl p-4">
                      <div className="font-extrabold mb-2">Tambah lagu</div>
                      <MusicAddForm isAdmin={true} onAdd={onAddSong} />
                    </div>
                  </div>
                </div>
              )}

              {/* TIMELINE */}
              {tab === 'events' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="font-extrabold">Kelola Timeline</div>
                    <AddEventButton onAdd={onAddEvent} label="Tambah event" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {events.map(e => (
                      <div key={e.id} className="bg-white border border-pink-100 rounded-2xl p-3">
                        <div className="text-xs text-zinc-500">{e.date}</div>
                        <div className="font-bold">{e.emoji} {e.title}</div>
                        <div className="text-sm text-zinc-600">{e.description}</div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => setEditingEvent(e)} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold flex items-center gap-1"><Pencil size={11} /> Edit</button>
                          <button onClick={() => onDeleteEvent(e.id)} className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 font-bold flex items-center gap-1"><Trash2 size={11} /> Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {tab === 'settings' && (
                <div className="max-w-2xl space-y-4">
                  <div className="font-extrabold">Pengaturan Couple</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <LabelField label="Nama A"><input value={pf.name_a} onChange={e => setPf({ ...pf, name_a: e.target.value })} className="inp" /></LabelField>
                    <LabelField label="Nama B"><input value={pf.name_b} onChange={e => setPf({ ...pf, name_b: e.target.value })} className="inp" /></LabelField>
                    <LabelField label="Foto A">
                      <div className="flex gap-2 items-start">
                        {pf.photo_a && <img src={pf.photo_a} className="w-16 h-16 rounded-xl object-cover border border-pink-200" />}
                        <div className="flex-1 space-y-1.5">
                          <input value={pf.photo_a} onChange={e => setPf({ ...pf, photo_a: e.target.value })} placeholder="URL foto" className="inp" />
                          <FileUploadBtn onUploaded={url => setPf({ ...pf, photo_a: url })} />
                        </div>
                      </div>
                    </LabelField>
                    <LabelField label="Foto B">
                      <div className="flex gap-2 items-start">
                        {pf.photo_b && <img src={pf.photo_b} className="w-16 h-16 rounded-xl object-cover border border-pink-200" />}
                        <div className="flex-1 space-y-1.5">
                          <input value={pf.photo_b} onChange={e => setPf({ ...pf, photo_b: e.target.value })} placeholder="URL foto" className="inp" />
                          <FileUploadBtn onUploaded={url => setPf({ ...pf, photo_b: url })} />
                        </div>
                      </div>
                    </LabelField>
                    <LabelField label="Start date"><input type="date" value={pf.start_date} onChange={e => setPf({ ...pf, start_date: e.target.value })} className="inp" /></LabelField>
                    <LabelField label="Kota"><input value={pf.city} onChange={e => setPf({ ...pf, city: e.target.value })} className="inp" /></LabelField>
                    <div className="sm:col-span-2"><LabelField label="Subtitle / Status"><input value={pf.hero_subtitle} onChange={e => setPf({ ...pf, hero_subtitle: e.target.value })} className="inp" /></LabelField></div>
                  </div>
                  <div className="pt-3 border-t border-pink-100">
                    <div className="font-bold mb-2 text-sm">🎵 Background Music Default (semua device)</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <LabelField label="Judul"><input value={pf.background_music_title || ''} onChange={e => setPf({ ...pf, background_music_title: e.target.value })} className="inp" /></LabelField>
                      <LabelField label="Artist"><input value={pf.background_music_artist || ''} onChange={e => setPf({ ...pf, background_music_artist: e.target.value })} className="inp" /></LabelField>
                      <div className="sm:col-span-2 space-y-1.5">
                        <LabelField label="URL Musik (mp3/youtube/spotify/soundcloud)">
                          <input value={pf.background_music_url || ''} onChange={e => setPf({ ...pf, background_music_url: e.target.value })} placeholder="https://..." className="inp" />
                        </LabelField>
                        <FileUploadBtn accept="audio/*" resourceType="auto" label="Upload MP3" onUploaded={url => setPf({ ...pf, background_music_url: url, background_music_type: 'mp3' })} />
                      </div>
                    </div>
                  </div>
                  <button onClick={async () => {
                    await onUpdateSettings({
                      name_a: pf.name_a, name_b: pf.name_b, photo_a: pf.photo_a, photo_b: pf.photo_b,
                      start_date: pf.start_date, city: pf.city, hero_subtitle: pf.hero_subtitle,
                      background_music_url: pf.background_music_url, background_music_title: pf.background_music_title,
                      background_music_artist: pf.background_music_artist, background_music_type: pf.background_music_type
                    })
                  }} className="px-4 py-2.5 rounded-xl bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Save size={16} /> Simpan Semua</button>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}

      {/* EDIT MODALS */}
      <AnimatePresence>
        {editingWord && <WordEditorModal word={editingWord} onClose={() => setEditingWord(null)}
          onSave={async patch => { const ok = await onUpdateWord(editingWord.id, patch); if (ok) setEditingWord(null) }}
          onDelete={async () => { await onDeleteWord(editingWord.id); setEditingWord(null) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {editingSong && <TrackEditorModal track={editingSong} onClose={() => setEditingSong(null)}
          onSave={async patch => { const ok = await onUpdateSong(editingSong.id, patch as any); if (ok) setEditingSong(null) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {editingPhoto && <PhotoEditorModal item={editingPhoto} onClose={() => setEditingPhoto(null)}
          onSave={async patch => { const ok = await onUpdatePhoto(editingPhoto.id, patch); if (ok) setEditingPhoto(null) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {editingEvent && <EventEditorModal item={editingEvent} onClose={() => setEditingEvent(null)}
          onSave={async patch => { const ok = await onUpdateEvent(editingEvent.id, patch); if (ok) setEditingEvent(null) }}
          onDelete={async () => { await onDeleteEvent(editingEvent.id); setEditingEvent(null) }} />}
      </AnimatePresence>
    </AnimatePresence>
  )
}

function LabelField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm">
    <div className="text-[12px] text-zinc-500 mb-1 font-semibold">{label}</div>
    {children}
    <style>{`.inp{width:100%;border-radius:12px;border:1px solid #f9c4d9;background:transparent;padding:10px 12px;outline:none}.inp:focus{box-shadow:0 0 0 3px rgba(255,88,149,.22)}`}</style>
  </label>
}

// ========== Editor modals (word/photo/song/event) ==========
function WordEditorModal({ word, onClose, onSave, onDelete }: { word: LoveWord; onClose: () => void; onSave: (p: Partial<LoveWord>) => void; onDelete: () => void }) {
  const [author, setAuthor] = useState(word.author)
  const [text, setText] = useState(word.text)
  const [mood, setMood] = useState(word.mood || '💗')
  const [image, setImage] = useState(word.image_url || '')
  return <Modal title="Edit love note" onClose={onClose}>
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        {(['Andre', 'Lulu'] as const).map(a => (
          <button key={a} className={`px-3 py-1.5 rounded-full border ${author === a ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-pink-200'}`} onClick={() => setAuthor(a)}>{a}</button>
        ))}
        <input value={mood} onChange={e => setMood(e.target.value)} className="ml-auto w-20 text-center rounded-full border border-pink-200 px-2 py-1.5 bg-transparent" />
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} className="w-full rounded-2xl border border-pink-200 bg-transparent px-3 py-2.5 h-32 outline-none" />
      {image && <img src={image} className="w-full h-36 rounded-xl object-cover" />}
      <div className="flex gap-2">
        <input value={image} onChange={e => setImage(e.target.value)} placeholder="Image URL" className="flex-1 rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none" />
        <FileUploadBtn onUploaded={url => setImage(url)} />
      </div>
      {image && <button onClick={() => setImage('')} className="text-xs text-red-600 hover:underline">Hapus foto</button>}
      <div className="flex gap-2">
        <button onClick={() => onSave({ author: author as any, text, mood, image_url: image || null })} className="flex-1 bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
        <button onClick={onDelete} className="px-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100">Hapus</button>
      </div>
    </div>
  </Modal>
}

function TrackEditorModal({ track, onClose, onSave }: { track: Song; onClose: () => void; onSave: (p: Partial<Song>) => void }) {
  const [title, setTitle] = useState(track.title); const [artist, setArtist] = useState(track.artist || '')
  const [type, setType] = useState<Song['type']>(track.type); const [url, setUrl] = useState(track.url)
  return <Modal title="Edit track" onClose={onClose}>
    <div className="space-y-2.5">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      <div className="flex gap-2 text-sm flex-wrap">
        {(['mp3', 'youtube', 'spotify', 'soundcloud'] as const).map(s => (
          <button key={s} onClick={() => setType(s)} className={`px-2.5 py-1.5 rounded-full border ${type === s ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-pink-200'}`}>{s}</button>
        ))}
      </div>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      {type === 'mp3' && <FileUploadBtn accept="audio/*" resourceType="auto" label="Upload MP3" onUploaded={u => setUrl(u)} />}
      <button onClick={() => onSave({ title, artist, type, url })} className="w-full bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
    </div>
  </Modal>
}

function PhotoEditorModal({ item, onClose, onSave }: { item: Photo; onClose: () => void; onSave: (p: Partial<Photo>) => void }) {
  const [url, setUrl] = useState(item.image_url); const [caption, setCaption] = useState(item.caption || ''); const [description, setDescription] = useState(item.description || '')
  return <Modal title="Edit foto" onClose={onClose}>
    <img src={url} className="w-full h-44 object-cover rounded-xl mb-3" alt="" />
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL foto" className="flex-1 rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
        <FileUploadBtn label="Ganti" onUploaded={u => setUrl(u)} />
      </div>
      <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi (opsional)" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      <button onClick={() => onSave({ image_url: url, caption, description })} className="w-full bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
    </div>
  </Modal>
}

function EventEditorModal({ item, onClose, onSave, onDelete }: { item: EventItem; onClose: () => void; onSave: (p: Partial<EventItem>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(item.title); const [date, setDate] = useState(item.date)
  const [description, setDescription] = useState(item.description || ''); const [emoji, setEmoji] = useState(item.emoji || '💗')
  return <Modal title="Edit event" onClose={onClose}>
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-16 text-center rounded-xl border border-pink-200 px-3 py-2.5" />
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul event" className="flex-1 rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      </div>
      <input value={date} onChange={e => setDate(e.target.value)} placeholder="Tanggal (contoh: 16 Mei 2025)" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 h-24 outline-none" />
      <div className="flex gap-2">
        <button onClick={() => onSave({ title, date, description, emoji })} className="flex-1 bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
        <button onClick={onDelete} className="px-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100">Hapus</button>
      </div>
    </div>
  </Modal>
}

// ========== CREATE BUTTONS ==========
function NewPostButton({ onSubmit, label = "Post baru" }: { onSubmit: (p: Omit<LoveWord, 'id' | 'created_at'>) => Promise<void>; label?: string }) {
  const [open, setOpen] = useState(false); const [author, setAuthor] = useState<'Andre' | 'Lulu'>('Lulu')
  const [text, setText] = useState(''); const [mood, setMood] = useState('💗'); const [image, setImage] = useState('')
  return (<>
    <button onClick={() => setOpen(true)} className="px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Plus size={16} /> {label}</button>
    <AnimatePresence>
      {open && <Modal title="Tulis love note" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <div className="flex gap-2 text-sm">
            {(['Andre', 'Lulu'] as const).map(a => (
              <button key={a} className={`px-3 py-1.5 rounded-full border ${author === a ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-pink-200'}`} onClick={() => setAuthor(a)}>{a}</button>
            ))}
            <input value={mood} onChange={e => setMood(e.target.value)} className="ml-auto w-20 text-center rounded-full border border-pink-200 px-2 py-1.5 bg-transparent" />
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Ceritain hari ini sama doi..." className="w-full rounded-2xl border border-pink-200 bg-transparent px-3 py-2.5 h-32 outline-none" />
          {image && <img src={image} className="w-full h-36 rounded-xl object-cover" />}
          <div className="flex gap-2">
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="Image URL (opsional)" className="flex-1 rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none" />
            <FileUploadBtn onUploaded={url => setImage(url)} />
          </div>
          {image && <button onClick={() => setImage('')} className="text-xs text-red-600 hover:underline">Hapus foto</button>}
          <button disabled={!text.trim()} onClick={async () => { await onSubmit({ author, text, mood, image_url: image || null }); setOpen(false); setText(''); setImage('') }}
            className="w-full bg-zinc-900 text-white rounded-xl py-2.5 font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Send size={16} /> Kirim note</button>
        </div>
      </Modal>}
    </AnimatePresence>
  </>)
}

function UploadGalleryButton({ onAdd, label = "Tambah foto" }: { onAdd: (url: string, caption: string, desc?: string) => Promise<void>; label?: string }) {
  const [open, setOpen] = useState(false); const [url, setUrl] = useState(''); const [caption, setCaption] = useState(''); const [desc, setDesc] = useState('')
  return (<>
    <button onClick={() => setOpen(true)} className="px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Plus size={16} /> {label}</button>
    <AnimatePresence>
      {open && <Modal title="Upload ke Galeri" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {url && <img src={url} className="w-full h-40 rounded-xl object-cover" />}
          <div className="flex gap-2">
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Tempel URL gambar" className="flex-1 rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none" />
            <FileUploadBtn label="Upload" onUploaded={u => setUrl(u)} />
          </div>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption manis..." className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi (opsional)" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none" />
          <button disabled={!url} onClick={async () => { await onAdd(url, caption, desc); setOpen(false); setUrl(''); setCaption(''); setDesc('') }}
            className="w-full bg-zinc-900 text-white rounded-xl py-2.5 font-bold disabled:opacity-50">Simpan ke Galeri</button>
        </div>
      </Modal>}
    </AnimatePresence>
  </>)
}

function MusicAddForm({ isAdmin, onAdd }: { isAdmin: boolean; onAdd: (t: Omit<Song, 'id'>) => Promise<boolean> }) {
  const [title, setTitle] = useState(''); const [artist, setArtist] = useState('Andre & Lulu')
  const [source, setSource] = useState<Song['type']>('mp3'); const [url, setUrl] = useState('')
  return (
    <div className="space-y-2.5">
      <input disabled={!isAdmin} value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul lagu" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none disabled:opacity-60" />
      <input disabled={!isAdmin} value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none disabled:opacity-60" />
      <div className="flex gap-2 text-sm flex-wrap">
        {(['mp3', 'youtube', 'spotify', 'soundcloud'] as const).map(s => (
          <button key={s} disabled={!isAdmin} onClick={() => setSource(s)} className={`px-2.5 py-1.5 rounded-full border ${source === s ? 'bg-pink-100 border-pink-300 text-pink-700' : 'border-pink-200'} disabled:opacity-60`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2 flex-col">
        <input disabled={!isAdmin} value={url} onChange={e => setUrl(e.target.value)} placeholder={source === 'youtube' ? 'https://youtube.com/watch?v=...' : source === 'spotify' ? 'https://open.spotify.com/track/...' : source === 'soundcloud' ? 'https://soundcloud.com/...' : 'https://... .mp3'}
          className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 outline-none disabled:opacity-60" />
        {source === 'mp3' && <FileUploadBtn accept="audio/*" resourceType="auto" label="Upload MP3 ke Cloudinary" onUploaded={u => setUrl(u)} />}
        <button disabled={!isAdmin || !title || !url} onClick={async () => { const ok = await onAdd({ title, artist, type: source, url }); if (ok !== false) { setTitle(''); setUrl('') } }}
          className="px-3 py-2 rounded-xl bg-[#ff4b93] text-white font-bold disabled:opacity-50 flex items-center gap-1 justify-center"><LinkIcon size={16} /> Add</button>
      </div>
    </div>
  )
}

function AddEventButton({ onAdd, label = "Tambah event" }: { onAdd: (e: Omit<EventItem, 'id'>) => Promise<void>; label?: string }) {
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(''); const [date, setDate] = useState(''); const [desc, setDesc] = useState(''); const [emoji, setEmoji] = useState('💗')
  return (<>
    <button onClick={() => setOpen(true)} className="px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Plus size={16} /> {label}</button>
    <AnimatePresence>
      {open && <Modal title="Tambah Timeline Event" onClose={() => setOpen(false)}>
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-16 text-center rounded-xl border border-pink-200 px-3 py-2.5" />
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul" className="flex-1 rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
          </div>
          <input value={date} onChange={e => setDate(e.target.value)} placeholder="Tanggal (contoh: 16 Mei 2025)" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi" className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2.5 h-24 outline-none" />
          <button disabled={!title || !date} onClick={async () => { await onAdd({ title, date, description: desc, emoji }); setOpen(false); setTitle(''); setDate(''); setDesc('') }}
            className="w-full bg-zinc-900 text-white rounded-xl py-2.5 font-bold disabled:opacity-50">Simpan</button>
        </div>
      </Modal>}
    </AnimatePresence>
  </>)
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-[26px] border border-pink-200 p-5 shadow-2xl max-h-[88vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-extrabold">{title}</div>
          <button onClick={onClose} className="text-zinc-500"><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function BootScreen() {
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#fff0f6]">
      <div className="text-center">
        <motion.div animate={{ scale: [1, 1.12, 1], rotate: [0, 2, -2, 0] }} transition={{ repeat: Infinity, duration: 1.25 }} className="text-6xl">💗</motion.div>
        <div className="mt-3 font-extrabold text-zinc-700 text-lg tracking-tight">Loading Love...</div>
        <div className="text-sm text-zinc-500 mt-1">Andre & Lulu</div>
      </div>
    </motion.div>
  )
}

function GlobalBackgroundSparkles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-16 w-[420px] h-[420px] rounded-full blur-[110px]" style={{ background: 'rgba(255,164,205,.55)' }} />
      <div className="absolute top-1/3 -right-24 w-[380px] h-[380px] rounded-full blur-[120px]" style={{ background: 'rgba(255,200,232,.68)' }} />
      {/* Floating hearts */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="absolute text-pink-400/60 select-none"
          style={{ left: `${(i * 73) % 100}%`, top: `${(i * 37) % 100}%`, fontSize: 14 + (i % 5) * 6, animation: `floaty ${8 + (i % 4)}s ease-in-out ${(i * 0.5).toFixed(1)}s infinite` }}>♥</span>
      ))}
      {/* Butterflies */}
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={'b' + i} className="absolute select-none text-pink-500/50"
          style={{ left: `${(i * 89 + 15) % 100}%`, top: `${(i * 61 + 20) % 100}%`, fontSize: 20 + (i % 3) * 6, animation: `floaty ${10 + (i % 5)}s ease-in-out ${(i * 0.7).toFixed(1)}s infinite` }}>🦋</span>
      ))}
      {/* Sparkles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={'s' + i} className="absolute select-none text-pink-300/70"
          style={{ left: `${(i * 53) % 100}%`, top: `${(i * 41 + 5) % 100}%`, fontSize: 10 + (i % 3) * 4, animation: `twinkle ${2.5 + (i % 4)}s ease-in-out ${(i * 0.3).toFixed(1)}s infinite` }}>✨</span>
      ))}
      <style>{`
        @keyframes floaty{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-24px) rotate(6deg)}}
        @keyframes twinkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
      `}</style>
    </div>
  )
}

function spawnHeart(x: number, y: number) {
  const el = document.createElement('span')
  el.textContent = ['💗', '💖', '💞', '💕', '✨', '🌸', '🦋'][Math.floor(Math.random() * 7)]
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;font-size:18px;z-index:9999;transform:translate(-50%,-50%);transition:transform .95s ease-out,opacity .95s ease-out`
  document.body.appendChild(el)
  requestAnimationFrame(() => { el.style.transform = `translate(-50%,-120px) rotate(${(Math.random() * 40 - 20).toFixed(0)}deg) scale(1.22)`; el.style.opacity = '0' })
  setTimeout(() => el.remove(), 980)
}
