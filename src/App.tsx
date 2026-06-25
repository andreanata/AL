import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Music2, Image as ImageIcon, BookHeart, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, LogOut, Plus, Send, X, Camera, Link as LinkIcon, CalendarDays, MapPin, Cherry, Pencil, Trash2, Save, ShieldCheck } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { supabase, isSupabaseLive } from './lib/supabaseClient'

// ---- Types
type Post = { id: string; author: 'Andre' | 'Lulu' | string; body: string; image_url?: string | null; mood?: string; created_at: string; }
type GalleryItem = { id: string; url: string; caption?: string; likes: number; created_at: string; }
type Track = { id: string; title: string; artist: string; source: 'youtube' | 'mp3' | 'spotify' | 'soundcloud'; url: string; position?: number }
type ProfileData = { name_a: string; name_b: string; photo_a: string; photo_b: string; start_date: string; status: string; city?: string }

// ---- Demo content
const DEMO_PROFILE: ProfileData = {
  name_a: 'Andre',
  name_b: 'Lulu',
  photo_a: 'https://images.pexels.com/photos/6789624/pexels-photo-6789624.jpeg?auto=compress&cs=tinysrgb&w=520&h=520&fit=crop',
  photo_b: 'https://images.pexels.com/photos/33046894/pexels-photo-33046894.jpeg?auto=compress&cs=tinysrgb&w=520&h=520&fit=crop',
  start_date: '2023-05-16',
  status: 'In a loving relationship 💞',
  city: 'Jakarta, ID'
}

const DEMO_TRACKS: Track[] = [
  { id:'t1', title:'Blue — Yung Kai', artist:'Andre & Lulu', source:'mp3', url:'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3' },
  { id:'t2', title:'first love (lofi edit)', artist:'Andre <3 Lulu', source:'mp3', url:'https://cdn.pixabay.com/audio/2022/05/09/audio_7d0e0c1d6a.mp3' },
  { id:'t3', title:'Sunday Morning Slow', artist:'Our song', source:'mp3', url:'https://cdn.pixabay.com/audio/2022/10/30/audio_c3c28d0e7f.mp3' },
]

const DEMO_POSTS: Post[] = [
  { id:'p3', author:'Lulu', body:'Hari ini makan seblak bareng, ketawa sampe sakit perut hihi 🥹❤️ kamu selalu bikin hariku manis.', mood:'🥹', image_url:'https://images.pexels.com/photos/33046894/pexels-photo-33046894.jpeg?auto=compress&cs=tinysrgb&w=900', created_at: new Date(Date.now()-1000*60*60*8).toISOString() },
  { id:'p2', author:'Andre', body:'Nemenin Lulu ngerjain tugas sampai malem, lucu banget pas ngantuk-ngantuk gitu 😭💤 love u more.', mood:'😴', image_url:null, created_at: new Date(Date.now()-1000*60*60*30).toISOString() },
  { id:'p1', author:'Lulu', body:'First date anniversary core memory ✨ nonton + es krim strawberry. Kamu genggam tanganku terus 🍓', mood:'🍓', image_url: 'https://images.pexels.com/photos/31530483/pexels-photo-31530483.jpeg?auto=compress&cs=tinysrgb&w=900', created_at: new Date(Date.now()-1000*60*60*72).toISOString() },
]

const DEMO_GALLERY: GalleryItem[] = [
  { id:'g1', url:'https://images.pexels.com/photos/31530483/pexels-photo-31530483.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'Sunset kita berdua 🌅', likes: 87, created_at: new Date().toISOString() },
  { id:'g2', url:'https://images.pexels.com/photos/33046894/pexels-photo-33046894.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'Cafe date pinky pinky', likes: 124, created_at: new Date().toISOString() },
  { id:'g3', url:'https://images.pexels.com/photos/6789624/pexels-photo-6789624.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'hidung ketemu hidung hehe', likes: 203, created_at: new Date().toISOString() },
  { id:'g4', url:'https://images.pexels.com/photos/8450328/pexels-photo-8450328.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'bunga buat kamu 🌷', likes: 66, created_at: new Date().toISOString() },
  { id:'g5', url:'https://images.pexels.com/photos/9619136/pexels-photo-9619136.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'jalan sore di pantai', likes: 92, created_at: new Date().toISOString() },
  { id:'g6', url:'https://images.pexels.com/photos/14839227/pexels-photo-14839227.jpeg?auto=compress&cs=tinysrgb&w=900', caption:'pelukan yang paling nyaman', likes: 141, created_at: new Date().toISOString() },
]

// ---- Local Realtime fallback (BroadcastChannel)
function useLocalRealtime<T>(key: string, initial: T) {
  const [data, setData] = useState<T>(() => {
    try { const raw = localStorage.getItem('andrelulu_'+key); return raw ? JSON.parse(raw) : initial } catch { return initial }
  })
  const bcRef = useRef<BroadcastChannel|null>(null)
  useEffect(() => {
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('andrelulu_'+key) : null
    bcRef.current = bc
    if (bc) bc.onmessage = (e) => setData(e.data)
    return () => bc?.close()
  }, [key])
  const commit = useCallback((next: T | ((prev:T)=>T)) => {
    setData(prev => {
      const resolved = typeof next === 'function' ? (next as any)(prev) : next
      try { localStorage.setItem('andrelulu_'+key, JSON.stringify(resolved)) } catch {}
      bcRef.current?.postMessage(resolved)
      return resolved
    })
  }, [key])
  return [data, commit] as const
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000)
}

// ---- Music helpers
function parseYouTubeId(url: string) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    if (u.hostname.includes('youtube')) return u.searchParams.get('v')
  } catch {}
  return null
}
function getSpotifyEmbed(url:string) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/)
  return match ? `https://open.spotify.com/embed/track/${match[1]}` : url
}
function getSoundcloudEmbed(url:string) {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff6aa9&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`
}

// ---- Main App
export default function App() {
  const [booting, setBooting] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'journal' | 'gallery' | 'music' | 'timeline'>('home')
  useEffect(() => { const t=setTimeout(()=>setBooting(false), 1450); return ()=>clearTimeout(t) }, [])

  const [profile, setProfile] = useLocalRealtime<ProfileData>('profile', DEMO_PROFILE)
  const [postsLocal, setPostsLocal] = useLocalRealtime<Post[]>('posts', DEMO_POSTS)
  const [galleryLocal, setGalleryLocal] = useLocalRealtime<GalleryItem[]>('gallery', DEMO_GALLERY)
  const [musicLocal, setMusicLocal] = useLocalRealtime<Track[]>('music', DEMO_TRACKS)

  // Supabase live sync (if configured)
  const [posts, setPosts] = useState<Post[]>(postsLocal)
  const [gallery, setGallery] = useState<GalleryItem[]>(galleryLocal)
  const [tracks, setTracks] = useState<Track[]>(musicLocal)
  const [sbSession, setSbSession] = useState<any>(null)

  useEffect(() => { setPosts(postsLocal) }, [postsLocal])
  useEffect(() => { setGallery(galleryLocal) }, [galleryLocal])
  useEffect(() => { setTracks(musicLocal) }, [musicLocal])

  // supabase auth
  useEffect(() => {
    if (!isSupabaseLive || !supabase) return
    supabase.auth.getSession().then(({data})=> setSbSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=> setSbSession(s))
    return ()=> sub.subscription.unsubscribe()
  }, [])

  // Supabase data + realtime
  useEffect(() => {
    if (!isSupabaseLive || !supabase) return
    const sb = supabase
    const load = async () => {
      const [{data: p}, {data: g}, {data: m}] = await Promise.all([
        sb.from('posts').select('*').order('created_at', { ascending:false }),
        sb.from('gallery').select('*').order('created_at', { ascending:false }),
        sb.from('music').select('*').order('position', { ascending:true }),
      ])
      if (p) setPosts(p as any)
      if (g) setGallery(g as any)
      if (m && (m as any).length) setTracks(m as any)
    }
    load()
    const ch = sb.channel('andrelulu-live')
      .on('postgres_changes', { event:'*', schema:'public', table:'posts' }, (payload) => {
        setPosts(cur => {
          if (payload.eventType === 'INSERT') return [payload.new as Post, ...cur]
          if (payload.eventType === 'UPDATE') return cur.map(x => x.id === (payload.new as any).id ? payload.new as Post : x)
          if (payload.eventType === 'DELETE') return cur.filter(x => x.id !== (payload.old as any).id)
          return cur
        })
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'gallery' }, (payload) => {
        setGallery(cur => {
          if (payload.eventType === 'INSERT') return [payload.new as GalleryItem, ...cur]
          if (payload.eventType === 'UPDATE') return cur.map(x => x.id === (payload.new as any).id ? payload.new as GalleryItem : x)
          if (payload.eventType === 'DELETE') return cur.filter(x => x.id !== (payload.old as any).id)
          return cur
        })
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'music' }, async () => {
        const { data } = await sb.from('music').select('*').order('position', {ascending:true})
        if (data) setTracks(data as any)
      })
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  const isAdmin = !!sbSession || (typeof window !== 'undefined' && localStorage.getItem('andrelulu_love_admin') === '1')
  const [showAdmin, setShowAdmin] = useState(false)

  // ---- Music player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(true) // autoplay
  const [volume, setVolume] = useState(0.74)
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const ytRef = useRef<HTMLIFrameElement|null>(null)

  const currentTrack = tracks[currentTrackIndex] ?? tracks[0]

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    if (playing) { audioRef.current.play().catch(()=>{}) }
    else audioRef.current.pause()
  }, [playing, currentTrackIndex, volume, tracks])

  // Autoplay attempt after boot
  useEffect(() => {
    if (!booting) {
      setPlaying(true)
      const to = setTimeout(()=> {
        toast('🎵 Our love song is playing', { duration: 2200 })
      }, 600)
      return ()=>clearTimeout(to)
    }
  }, [booting])

  // floating hearts
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('button,a,input,textarea,[role="button"]')) return
      const cx = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX || Math.random()*window.innerWidth
      const cy = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY || Math.random()*window.innerHeight
      spawnHeart(cx, cy)
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  const anniversary = useMemo(() => {
    const start = new Date(profile.start_date)
    const now = new Date()
    const totalDays = daysBetween(start, now)
    const years = now.getFullYear() - start.getFullYear()
    return { totalDays, years: Math.max(0, years) }
  }, [profile.start_date])

  // ---- CRUD Handlers
  const addPost = async (post: Omit<Post,'id'|'created_at'>) => {
    const newPost: Post = { ...post, id: Math.random().toString(36).slice(2), created_at: new Date().toISOString() }
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('posts').insert({ author: post.author, body: post.body, image_url: post.image_url ?? null, mood: post.mood ?? null })
      if (error) { toast.error('Gagal simpan • '+error.message); return }
      toast.success('Post terkirim! Live sync aktif 💗')
    } else {
      setPostsLocal(p => [newPost, ...p])
      toast.success('Post terkirim! 💌')
    }
  }
  const updatePost = async (id:string, patch:Partial<Post>) => {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('posts').update(patch).eq('id', id)
      if (error) { toast.error(error.message); return false }
      toast.success('Post diupdate ✨')
      return true
    } else {
      setPostsLocal(list => list.map(x => x.id===id ? { ...x, ...patch } : x))
      toast.success('Post diupdate ✨')
      return true
    }
  }
  const deletePost = async (id:string) => {
    if (!confirm('Hapus love note ini?')) return
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) { toast.error(error.message); return }
    } else {
      setPostsLocal(list => list.filter(x=>x.id!==id))
    }
    toast.success('Terhapus')
  }

  const addGallery = async (url: string, caption: string) => {
    const item: GalleryItem = { id: Math.random().toString(36).slice(2), url, caption, likes: Math.floor(Math.random()*30)+12, created_at: new Date().toISOString() }
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('gallery').insert({ url, caption, likes: item.likes })
      if (error) { toast.error(error.message); return }
    } else {
      setGalleryLocal(g => [item, ...g])
    }
    toast.success('Foto ditambahkan ke galeri ✨')
  }
  const updateGallery = async (id:string, patch:Partial<GalleryItem>) => {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('gallery').update(patch).eq('id', id)
      if (error) { toast.error(error.message); return false }
    } else {
      setGalleryLocal(list => list.map(x => x.id===id ? { ...x, ...patch } : x))
    }
    toast.success('Foto diupdate')
    return true
  }
  const deleteGallery = async (id:string) => {
    if (!confirm('Hapus foto ini dari galeri?')) return
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('gallery').delete().eq('id', id)
      if (error) { toast.error(error.message); return }
    } else {
      setGalleryLocal(list => list.filter(x=>x.id!==id))
    }
    toast.success('Foto dihapus')
  }
  // toggleLike function deleted to keep code clean and warning-free

  const addTrack = async (track: Omit<Track,'id'>) => {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('music').insert({ title: track.title, artist: track.artist, source: track.source, url: track.url, position: tracks.length })
      if (error) { toast.error(error.message); return false }
    } else {
      setMusicLocal(m => [...m, { ...track, id: Math.random().toString(36).slice(2) }])
    }
    toast.success('Lagu ditambahkan ke playlist 🎵')
    return true
  }
  const updateTrack = async (id:string, patch: Partial<Track>) => {
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('music').update(patch).eq('id', id)
      if (error) { toast.error(error.message); return false }
    } else {
      setMusicLocal(list => list.map(x => x.id===id ? { ...x, ...patch } : x))
    }
    toast.success('Track diupdate')
    return true
  }
  const deleteTrack = async (id:string) => {
    if (!confirm('Hapus lagu dari playlist?')) return
    if (isSupabaseLive && supabase) {
      const { error } = await supabase.from('music').delete().eq('id', id)
      if (error) { toast.error(error.message); return }
    } else {
      setMusicLocal(list => list.filter(x=>x.id!==id))
    }
    toast.success('Lagu dihapus')
  }

  const updateProfile = async (patch: Partial<ProfileData>) => {
    const next = { ...profile, ...patch }
    setProfile(next)
    toast.success('Profil couple diperbarui 💗')
    return true
  }

  const doSignOut = async () => {
    if (isSupabaseLive && supabase) await supabase.auth.signOut()
    localStorage.removeItem('andrelulu_love_admin')
    setShowAdmin(false)
    toast('Love Mode dimatikan', { icon: '💤' })
    setTimeout(()=> location.reload(), 350)
  }

  return (
    <div>
      <div className="min-h-screen bg-[#fff7fb] text-zinc-800 relative overflow-x-clip"
        style={{ fontFamily: '"Nunito", Quicksand, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}
      >
        <Toaster richColors position="top-center" />
        <GlobalBackgroundSparkles />
        <AnimatePresence>
          {booting && <BootScreen />}
        </AnimatePresence>

        {/* Top Nav / Header */}
        {/* Top Nav / Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#fff7fb]/90 border-b border-pink-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff8ec5] to-[#ff5fa6] shadow-[0_8px_26px_rgba(255,82,157,.34)] flex items-center justify-center text-white font-extrabold tracking-tight">AL</div>
              <div className="leading-tight">
                <div className="text-[18px] font-extrabold tracking-tight text-pink-700">Andre &amp; Lulu 💗</div>
                <div className="text-[11.5px] text-zinc-500 -mt-0.5 font-bold">Couple Memory Dashboard</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={()=>setPlaying(p=>!p)} title={playing ? "Matikan musik" : "Putar musik"}
                className={`rounded-full p-2.5 border transition ${playing ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-pink-200 text-zinc-600'} hover:scale-105`}>
                <Music2 size={18} />
              </button>
              <LoveButton isAdmin={isAdmin} onOpenDashboard={()=> setShowAdmin(true)} />
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3">
            <nav className="flex gap-1.5 sm:gap-2 text-[13.5px] sm:text-[14px] font-semibold flex-wrap">
              {[
                {k:'home', label:'Home', icon:Heart},
                {k:'journal', label:'Journal', icon:BookHeart},
                {k:'gallery', label:'Gallery', icon:ImageIcon},
                {k:'music', label:'Music', icon:Music2},
                {k:'timeline', label:'Timeline', icon:CalendarDays},
              ].map(({k, label, icon:Icon})=> (
                <button key={k} onClick={()=>setActiveTab(k as any)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full transition flex items-center gap-1.5 ${activeTab===k ? 'bg-[#ff5fa6] text-white shadow-lg shadow-pink-200' : 'bg-white text-zinc-700 hover:bg-pink-50 border border-pink-100'}`}
                >
                  <Icon size={16}/> {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-40">
          {activeTab === 'home' && (
            <div className="grid md:grid-cols-5 gap-6 pt-8">
              {/* Left big hero / couple card */}
              <div className="md:col-span-3">
                <div className="rounded-[28px] bg-white/85 border border-pink-200 shadow-[0_24px_70px_rgba(255,95,166,.13)] p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute -right-16 -top-10 w-64 h-64 rounded-full bg-gradient-to-br from-pink-200/60 to-fuchsia-200/66 blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="relative">
                      <div className="flex -space-x-6">
                        <img src={profile.photo_a} alt="Andre" className="w-[132px] h-[132px] sm:w-[148px] sm:h-[148px] rounded-[30px] object-cover border-[6px] border-white shadow-xl shadow-pink-200/70 relative z-10"/>
                        <img src={profile.photo_b} alt="Lulu" className="w-[132px] h-[132px] sm:w-[148px] sm:h-[148px] rounded-[30px] object-cover border-[6px] border-white shadow-xl shadow-pink-200/70 mt-6"/>
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#ff5fa6] text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow">Bucin Mode ON</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] text-zinc-500 mb-1 flex items-center gap-2"><MapPin size={14}/> {profile.city}</div>
                      <h1 style={{fontFamily:'"Fraunces", "Nunito", serif'}} className="text-[36px] sm:text-[44px] leading-[0.98] font-[700] tracking-tight">
                        {profile.name_a}<br/>
                        <span className="text-[#ff478f]">&amp; {profile.name_b}</span>
                      </h1>
                      <p className="mt-3 text-[15px] text-zinc-600">{profile.status}</p>
                      <div className="mt-5 flex flex-wrap gap-2 text-[13px] font-bold">
                        <span className="px-3 py-1.5 rounded-full bg-[#ffe5f0] text-[#de2c78]">{anniversary.totalDays} hari bersama</span>
                        <span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white">Since {new Date(profile.start_date).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric'})}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-7 text-center">
                    {[
                      { n: anniversary.totalDays, l: 'Hari Bersama' },
                      { n: posts.length, l: 'Love Notes' },
                    ].map(s=>(
                      <div key={s.l} className="bg-[#fff3f8] rounded-[18px] py-3 border border-pink-100">
                        <div className="text-[22px] font-extrabold text-[#e43a7e]">{s.n}</div>
                        <div className="text-[12px] text-zinc-500">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* recent posts preview */}
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {posts.slice(0,2).map(p=>(
                    <article key={p.id} className="rounded-[22px] bg-white border border-pink-100 p-4 shadow-sm relative">
                      {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <button onClick={()=>toast('Edit di Love Dashboard 💗')} className="p-1.5 rounded-full bg-zinc-100"><Pencil size={13}/></button>
                        </div>
                      )}
                      <div className="text-[11.8px] text-zinc-500">{new Date(p.created_at).toLocaleString('id-ID',{ dateStyle:'medium', timeStyle:'short'})}</div>
                      <div className="mt-1 font-extrabold">{p.author} {p.mood || '💗'}</div>
                      <p className="text-[14.5px] text-zinc-700 mt-1 line-clamp-3">{p.body}</p>
                      {p.image_url && <img src={p.image_url} className="mt-3 rounded-[16px] w-full h-40 object-cover" alt="" />}
                    </article>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="md:col-span-2 space-y-5">
                <div className="rounded-[26px] bg-gradient-to-br from-[#ff72b6] to-[#ff4796] text-white p-5 shadow-xl shadow-pink-300/50">
                  <div className="text-[12px] uppercase tracking-widest opacity-90">relationship status</div>
                  <div className="text-[26px] font-extrabold mt-1">Taken, very taken 💍</div>
                  <p className="text-white/90 text-sm mt-2">Officially {profile.name_a} x {profile.name_b}. Bucin since 2023. Private couple diary, live sync.</p>
                  <div className="flex gap-2 mt-4 text-xs font-bold flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-white/18">💌 daily love notes</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/18">🎵 shared playlist</span>
                  </div>
                </div>

                <div className="rounded-[26px] border border-pink-200 bg-white p-5">
                  <div className="font-extrabold flex items-center gap-2 text-[15.5px]"><Sparkles size={18} className="text-[#ff539d]" /> Now Playing</div>
                  <div className="mt-3 flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-extrabold">♫</div>
                    <div>
                      <div className="font-bold">{currentTrack?.title}</div>
                      <div className="text-sm text-zinc-500">{currentTrack?.artist}</div>
                    </div>
                  </div>
                  <button onClick={()=>{ setActiveTab('music'); setPlaying(true)}}
                    className="w-full mt-3 bg-[#ff4e97] hover:bg-[#ff2f82] text-white rounded-full py-2.5 font-bold transition">Open player</button>
                </div>

                <div className="rounded-[26px] border border-pink-200 bg-white p-5">
                  <div className="font-extrabold flex items-center gap-2 text-[15.5px]"><Cherry size={18} className="text-[#ff539d]" /> Love stats</div>
                  <ul className="mt-3 text-[14px] text-zinc-700 space-y-2">
                    <li>⭐ Anniversary: 16 Mei</li>
                    <li>📍 Based in Jakarta</li>
                    <li>💬 Love language: Quality Time & Words</li>
                    <li>🍓 Lulu’s fav: strawberry cheesecake</li>
                    <li>🎮 Andre’s fav: nugas bareng Lulu</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'journal' && (
            <section className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[28px] font-extrabold tracking-tight">Love Journal</h2>
                {isAdmin && <NewPostButton onSubmit={addPost} />}
              </div>
              {!isAdmin && <div className="mb-4 text-[13.5px] bg-[#fff0f6] border border-pink-200 rounded-2xl px-4 py-3">Kamu lagi mode viewer 👀 — pencet tombol Love di atas untuk masuk Love Mode.</div>}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(p=>(
                  <motion.article layout key={p.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-[22px] bg-white dark:bg-zinc-950 border border-pink-100 dark:border-zinc-800 p-4 shadow-sm relative">
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1">
                        <IconBtn title="Edit" onClick={() => setShowAdmin(true)}><Pencil size={14} /></IconBtn>
                        <IconBtn title="Hapus" tone="danger" onClick={() => deletePost(p.id)}><Trash2 size={14}/></IconBtn>
                      </div>
                    )}
                    <div className="text-xs text-zinc-500 pr-16">{new Date(p.created_at).toLocaleString('id-ID',{ dateStyle:'medium', timeStyle:'short'})}</div>
                    <div className="mt-1 font-extrabold text-[16.5px]">{p.author} <span className="ml-1">{p.mood}</span></div>
                    <p className="mt-1.5 text-[14.7px] leading-relaxed text-zinc-700 dark:text-zinc-300">{p.body}</p>
                    {p.image_url && <img src={p.image_url} alt="" className="mt-3 w-full h-52 object-cover rounded-[14px]" />}
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'gallery' && (
            <section className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[28px] font-extrabold tracking-tight">Love Gallery</h2>
                {isAdmin && <UploadGalleryButton onAdd={addGallery} />}
              </div>
              <div className="columns-2 md:columns-3 gap-3 space-y-3">
                {gallery.map(g=>(
                  <div key={g.id} className="break-inside-avoid rounded-[20px] overflow-hidden bg-white dark:bg-zinc-950 border border-pink-100 dark:border-zinc-800 shadow-sm relative group">
                    <img src={g.url} alt="" className="w-full object-cover" loading="lazy"/>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/62 to-transparent text-white text-sm flex items-end justify-between gap-3">
                      <span className="text-[13.5px]">{g.caption}</span>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={()=>updateGallery(g.id, { caption: prompt('Edit caption:', g.caption || '') || g.caption })} className="p-1.5 rounded-full bg-white/90 text-zinc-800"><Pencil size={13}/></button>
                        <button onClick={()=>deleteGallery(g.id)} className="p-1.5 rounded-full bg-white/90 text-red-600"><Trash2 size={13}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'music' && (
            <section className="pt-8 grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <h2 className="text-[28px] font-extrabold tracking-tight mb-4">Our Playlist</h2>
                <div className="space-y-3">
                  {tracks.map((t, idx)=>(
                    <div key={t.id} className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition ${idx===currentTrackIndex ? 'bg-[#ffe7f1] dark:bg-pink-950/40 border-pink-300 dark:border-pink-900' : 'bg-white dark:bg-zinc-950 border-pink-100 dark:border-zinc-800 hover:bg-pink-50 dark:hover:bg-zinc-900'}`}>
                      <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center cursor-pointer" onClick={()=>{ setCurrentTrackIndex(idx); setPlaying(true)}}><Music2 className="text-[#ff458f]" size={20} /></div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>{ setCurrentTrackIndex(idx); setPlaying(true)}}>
                        <div className="font-bold truncate">{t.title}</div>
                        <div className="text-[13px] text-zinc-500 truncate">{t.artist} • {t.source}</div>
                      </div>
                      {isAdmin ? (
                        <div className="flex gap-1.5">
                          <button className="px-2.5 py-1.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800" onClick={async ()=>{
                            const title = prompt('Judul:', t.title); if(title===null) return
                            const artist = prompt('Artist:', t.artist) || t.artist
                            await updateTrack(t.id, { title, artist })
                          }}>Edit</button>
                          <button className="px-2.5 py-1.5 text-xs rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300" onClick={()=>deleteTrack(t.id)}>Hapus</button>
                        </div>
                      ) : (
                        <button className="px-3 py-1.5 text-sm rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" onClick={()=>{ setCurrentTrackIndex(idx); setPlaying(true)}}>{idx===currentTrackIndex && playing ? 'Playing' : 'Play'}</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-[24px] bg-white dark:bg-zinc-950 border border-pink-200 dark:border-zinc-800 p-5 shadow-sm sticky top-[118px]">
                  <div className="font-extrabold mb-2">Add song to playlist</div>
                  {!isAdmin && <div className="text-sm text-zinc-500 mb-3">Masuk Love Mode untuk menambah lagu.</div>}
                  <MusicAddForm isAdmin={isAdmin} onAdd={addTrack}/>
                  <div className="mt-6 text-[12.5px] text-zinc-500 leading-relaxed">
                    Supported: YouTube links, MP3 direct URL, Spotify track links, SoundCloud.<br/>
                    Player sticky & tetap nyala saat pindah tab.
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'timeline' && (
            <section className="pt-8 max-w-3xl">
              <h2 className="text-[28px] font-extrabold tracking-tight mb-5">Our Timeline</h2>
              <ol className="relative border-s-2 border-pink-200 dark:border-zinc-800 pl-6 space-y-7">
                {[
                  { d:'16 Mei 2023', t:'First date', c:'Mulai jadi official 💗' },
                  { d:'12 Agu 2023', t:'Trip puncak', c:'Foto di kebun teh, dingin tapi hangat' },
                  { d:'16 Nov 2023', t:'6 month', c:'Surprise dinner small smallan' },
                  { d:'16 Mei 2024', t:'1st Anniversary', c:'Nonton bioskop + es krim strawberry' },
                  { d:'24 Des 2024', t:'Christmas cozy', c:'Movie marathon & hot choco' },
                  { d:'14 Feb 2025', t:'Valentine', c:'Buket bunga & surat tulis tangan' },
                  { d:'Hari ini', t:'Masih bucin', c:'Love dashboard live ✨' },
                ].map(e=>(
                  <li key={e.d} className="relative">
                    <span className="absolute -left-[30px] top-1 w-3.5 h-3.5 bg-[#ff5b9b] rounded-full shadow-[0_0_0_4px_rgba(255,91,155,.20)]" />
                    <div className="text-[12.5px] text-zinc-500">{e.d}</div>
                    <div className="font-extrabold text-[17px]">{e.t}</div>
                    <div className="text-zinc-600 dark:text-zinc-300">{e.c}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        {/* Floating Music logo toggle */}
        <button
          onClick={()=>setPlaying(p=>!p)}
          className={`fixed bottom-[92px] right-4 sm:right-6 z-[55] w-14 h-14 rounded-full bg-gradient-to-br from-[#ff71b9] to-[#ff3c8a] text-white shadow-[0_14px_34px_rgba(255,54,130,.45)] flex items-center justify-center transition-transform active:scale-95 ${playing ? '' : 'opacity-85'}`}
          aria-label="Toggle music"
          title={playing ? "Matikan musik" : "Putar musik"}
        >
          <Music2 size={23} className={playing ? 'animate-pulse' : ''} />
          {playing && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-zinc-950" />}
        </button>

        {/* Sticky Music Player */}
        <footer className="fixed bottom-0 inset-x-0 z-50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-3">
            <div className="rounded-[22px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-pink-200 dark:border-zinc-800 shadow-[0_20px_70px_rgba(255,70,140,.22)] px-3 sm:px-5 py-3 flex items-center gap-3 sm:gap-5">
              <button onClick={()=> setCurrentTrackIndex(i=> (i-1+tracks.length)%tracks.length)} className="p-2 rounded-full hover:bg-pink-50 dark:hover:bg-zinc-900"><SkipBack size={20}/></button>
              <button onClick={()=> setPlaying(v=>!v)} className="w-11 h-11 rounded-full bg-[#ff4b93] text-white flex items-center justify-center shadow-md shadow-pink-300/60">
                {playing ? <Pause size={20}/> : <Play size={20}/>}
              </button>
              <button onClick={()=> setCurrentTrackIndex(i=> (i+1)%tracks.length)} className="p-2 rounded-full hover:bg-pink-50 dark:hover:bg-zinc-900"><SkipForward size={20}/></button>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] sm:text-[15px] font-extrabold truncate">{currentTrack?.title}</div>
                <div className="text-[12.5px] text-zinc-500 truncate">{currentTrack?.artist}</div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <Volume2 size={18}/>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} className="w-28 accent-[#ff488f]" />
              </div>
              <div className="text-[11px] px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-200 font-bold">{currentTrack?.source}</div>
            </div>
          </div>
        </footer>

        {/* Invisible music renderers */}
        <div className="fixed -left-[9999px] -top-[9999px] w-[420px] h-[90px] opacity-0 pointer-events-none">
          {currentTrack?.source === 'mp3' && (
            <audio ref={audioRef} src={currentTrack.url} controls autoPlay={playing} loop={false} onEnded={()=> setCurrentTrackIndex(i=> (i+1)%tracks.length)} />
          )}
          {currentTrack?.source === 'youtube' && (() => {
            const id = parseYouTubeId(currentTrack.url)
            return id ? <iframe ref={ytRef} width="420" height="90" src={`https://www.youtube.com/embed/${id}?autoplay=${playing ? 1 : 0}&controls=0`} allow="autoplay" /> : null
          })()}
          {currentTrack?.source === 'spotify' && (
            <iframe src={getSpotifyEmbed(currentTrack.url)} width="420" height="90" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
          )}
          {currentTrack?.source === 'soundcloud' && (
            <iframe width="420" height="90" scrolling="no" allow="autoplay" src={getSoundcloudEmbed(currentTrack.url)}></iframe>
          )}
        </div>

        {/* Admin / Love Dashboard */}
        <AdminDashboard
          open={showAdmin && isAdmin}
          onClose={()=>setShowAdmin(false)}
          posts={posts}
          gallery={gallery}
          tracks={tracks}
          profile={profile}
          onUpdatePost={updatePost}
          onDeletePost={deletePost}
          onAddPost={addPost}
          onUpdateGallery={updateGallery}
          onDeleteGallery={deleteGallery}
          onAddGallery={addGallery}
          onUpdateTrack={updateTrack}
          onDeleteTrack={deleteTrack}
          onAddTrack={addTrack}
          onUpdateProfile={updateProfile}
          onSignOut={doSignOut}
        />

        <div className="h-24" />
      </div>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
      html, body { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}

// ---- UI bits

function IconBtn({ children, onClick, title, tone="default"}: { children: React.ReactNode; onClick?: ()=>void; title?:string; tone?: "default"|"danger"}) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-full transition ${tone==='danger' ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200'}`}>
      {children}
    </button>
  )
}

function LoveButton({isAdmin, onOpenDashboard}:{isAdmin:boolean; onOpenDashboard:()=>void}){
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)

  const doSignIn = async () => {
    setLoading(true)
    try {
      if (pw === 'AndreLulu#2022*') {
        localStorage.setItem('andrelulu_love_admin','1')
        toast.success('Love Mode aktif! Selamat datang Andre / Lulu 💗')
        setOpen(false)
        setTimeout(()=>location.reload(), 450)
      } else {
        toast.error('Password salah sayang 🥹 Coba lagi ya!')
      }
    } catch(e:any){ toast.error('Ada kesalahan') }
    finally { setLoading(false) }
  }

  if (isAdmin) return (
    <button onClick={onOpenDashboard}
      className="text-[13px] px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-extrabold flex items-center gap-1.5 shadow shadow-pink-200 hover:bg-[#ff3382] transition">
      <Heart size={14} fill="white"/> Love Mode
    </button>
  )

  return (
    <>
      <button onClick={()=>setOpen(true)} className="text-[13px] px-3.5 py-2 rounded-full bg-zinc-900 text-white font-bold flex items-center gap-1.5 hover:opacity-90 transition">
        <Heart size={14}/> Love
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 bg-black/45 z-[60] flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div initial={{y:16, opacity:0}} animate={{y:0, opacity:1}} exit={{y:10, opacity:0}} className="w-full max-w-sm bg-white rounded-[24px] border border-pink-200 p-6 shadow-2xl relative">
              <button onClick={()=>setOpen(false)} className="absolute top-3 right-3 text-zinc-500"><X size={18}/></button>
              <div className="text-xl font-extrabold flex items-center gap-2"><Heart className="text-pink-500" size={20} fill="currentColor"/> Love Mode Login</div>
              <div className="text-sm text-zinc-500 mt-1">
                Masukkan password khusus couple untuk masuk ke mode admin.
              </div>
              <div className="mt-4 space-y-3">
                <input type="password" placeholder="Password khusus couple" className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2.5 outline-none focus:ring-2 ring-pink-300 text-center text-lg tracking-widest font-mono" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e => {if(e.key === 'Enter') doSignIn()}} />
                <button disabled={loading} onClick={doSignIn} className="w-full bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold disabled:opacity-60">
                  {loading ? 'Membuka Gembok Cinta...' : 'Masuk Love Mode'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Admin / Love Dashboard
function AdminDashboard({ open, onClose, posts, gallery, tracks, profile,
  onUpdatePost, onDeletePost, onAddPost,
  onUpdateGallery, onDeleteGallery, onAddGallery,
  onUpdateTrack, onDeleteTrack, onAddTrack,
  onUpdateProfile, onSignOut
}: {
  open:boolean, onClose:()=>void,
  posts:Post[], gallery:GalleryItem[], tracks:Track[], profile:ProfileData,
  onUpdatePost:(id:string, patch:Partial<Post>)=>Promise<boolean>,
  onDeletePost:(id:string)=>Promise<void>,
  onAddPost:(p:Omit<Post,'id'|'created_at'>)=>Promise<void>,
  onUpdateGallery:(id:string, patch:Partial<GalleryItem>)=>Promise<boolean>,
  onDeleteGallery:(id:string)=>Promise<void>,
  onAddGallery:(url:string, caption:string)=>Promise<void>,
  onUpdateTrack:(id:string, patch:Partial<Track>)=>Promise<boolean>,
  onDeleteTrack:(id:string)=>Promise<void>,
  onAddTrack:(t:Omit<Track,'id'>)=>Promise<boolean>,
  onUpdateProfile:(patch:Partial<ProfileData>)=>Promise<boolean>,
  onSignOut:()=>void
}) {
  const [tab, setTab] = useState<'posts'|'gallery'|'music'|'profile'>('posts')
  const [editingPost, setEditingPost] = useState<Post|null>(null)
  const [editingTrack, setEditingTrack] = useState<Track|null>(null)
  const [editingGallery, setEditingGallery] = useState<GalleryItem|null>(null)

  // profile form state
  const [pf, setPf] = useState(profile)
  useEffect(()=>setPf(profile), [profile, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-black/55 flex items-center justify-center p-3 sm:p-6" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div initial={{y:18, opacity:0}} animate={{y:0, opacity:1}} exit={{y:10, opacity:0}}
            className="w-full max-w-5xl max-h-[92vh] overflow-hidden bg-[#fff8fc] dark:bg-zinc-950 rounded-[28px] border border-pink-200 dark:border-zinc-800 shadow-2xl flex flex-col">
            <div className="px-5 sm:px-7 py-4 border-b border-pink-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
              <div className="font-extrabold text-[18px] flex items-center gap-2"><ShieldCheck className="text-pink-500" size={20}/> Love Dashboard</div>
              <div className="flex items-center gap-2">
                <button onClick={onSignOut} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center gap-1"><LogOut size={13}/> Keluar</button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={18}/></button>
              </div>
            </div>

            <div className="px-5 sm:px-7 pt-4 flex gap-2 text-sm font-bold flex-wrap">
              {[
                {k:'posts', l:`Journal (${posts.length})`},
                {k:'gallery', l:`Gallery (${gallery.length})`},
                {k:'music', l:`Music (${tracks.length})`},
                {k:'profile', l:`Profile`},
              ].map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k as any)}
                  className={`px-3.5 py-2 rounded-full border transition ${tab===t.k ? 'bg-[#ff4b93] text-white border-[#ff4b93]' : 'bg-white dark:bg-zinc-900 border-pink-200 dark:border-zinc-800 hover:bg-pink-50 dark:hover:bg-zinc-800'}`}>
                  {t.l}
                </button>
              ))}
            </div>

            <div className="px-5 sm:px-7 py-5 overflow-auto" style={{maxHeight: 'calc(92vh - 124px)'}}>
              {tab==='posts' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="font-extrabold">Kelola Love Journal</div>
                    <NewPostButton onSubmit={onAddPost} label="Post baru" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {posts.map(p=>(
                      <div key={p.id} className="bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-2xl p-3">
                        <div className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleString('id-ID')}</div>
                        <div className="font-bold">{p.author} {p.mood}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">{p.body}</div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={()=>setEditingPost(p)} className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold flex items-center gap-1"><Pencil size={12}/> Edit</button>
                          <button onClick={()=>onDeletePost(p.id)} className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-xs font-bold flex items-center gap-1"><Trash2 size={12}/> Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==='gallery' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="font-extrabold">Kelola Galeri</div>
                    <UploadGalleryButton onAdd={onAddGallery} label="Upload foto" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {gallery.map(g=>(
                      <div key={g.id} className="bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        <img src={g.url} className="w-full h-36 object-cover"/>
                        <div className="p-2.5 text-xs">{g.caption || <span className="text-zinc-400">tanpa caption</span>}</div>
                        <div className="px-2.5 pb-2.5 flex gap-2">
                          <button onClick={()=>setEditingGallery(g)} className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">Edit</button>
                          <button onClick={()=>onDeleteGallery(g.id)} className="text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==='music' && (
                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 space-y-2">
                    <div className="font-extrabold mb-2">Kelola Playlist</div>
                    {tracks.map((t,i)=>(
                      <div key={t.id} className="bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-5">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate text-sm">{t.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{t.artist} • {t.source}</div>
                        </div>
                        <button onClick={()=>setEditingTrack(t)} className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">Edit</button>
                        <button onClick={()=>onDeleteTrack(t.id)} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">Hapus</button>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-2xl p-4">
                      <div className="font-extrabold mb-2">Tambah lagu</div>
                      <MusicAddForm isAdmin={true} onAdd={onAddTrack}/>
                    </div>
                  </div>
                </div>
              )}

              {tab==='profile' && (
                <div className="max-w-2xl">
                  <div className="font-extrabold mb-3">Edit Couple Profile</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <L label="Nama A"><input value={pf.name_a} onChange={e=>setPf({...pf, name_a:e.target.value})} className="inp"/></L>
                    <L label="Nama B"><input value={pf.name_b} onChange={e=>setPf({...pf, name_b:e.target.value})} className="inp"/></L>
                    <L label="Foto A URL"><input value={pf.photo_a} onChange={e=>setPf({...pf, photo_a:e.target.value})} className="inp"/></L>
                    <L label="Foto B URL"><input value={pf.photo_b} onChange={e=>setPf({...pf, photo_b:e.target.value})} className="inp"/></L>
                    <L label="Start date"><input type="date" value={pf.start_date} onChange={e=>setPf({...pf, start_date:e.target.value})} className="inp"/></L>
                    <L label="Kota"><input value={pf.city||''} onChange={e=>setPf({...pf, city:e.target.value})} className="inp"/></L>
                    <div className="sm:col-span-2">
                      <L label="Status hubungan"><input value={pf.status} onChange={e=>setPf({...pf, status:e.target.value})} className="inp"/></L>
                    </div>
                  </div>
                  <button onClick={async()=>{ await onUpdateProfile(pf); toast.success('Tersimpan!')}} className="mt-4 px-4 py-2.5 rounded-xl bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Save size={16}/> Simpan Profile</button>
                  <p className="text-xs text-zinc-500 mt-3">Foto bisa pakai URL langsung, atau upload dulu di tab Gallery lalu copy URL-nya.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Post editor modal */}
      <AnimatePresence>
        {editingPost && (
          <PostEditorModal
            post={editingPost}
            onClose={()=>setEditingPost(null)}
            onSave={async (patch)=>{ const ok = await onUpdatePost(editingPost.id, patch); if(ok) setEditingPost(null) }}
            onDelete={async ()=>{ await onDeletePost(editingPost.id); setEditingPost(null)}}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingTrack && (
          <TrackEditorModal track={editingTrack} onClose={()=>setEditingTrack(null)} onSave={async (patch)=>{ const ok = await onUpdateTrack(editingTrack.id, patch); if(ok) setEditingTrack(null)}} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingGallery && (
          <GalleryEditorModal item={editingGallery} onClose={()=>setEditingGallery(null)} onSave={async (patch)=>{ const ok = await onUpdateGallery(editingGallery.id, patch); if(ok) setEditingGallery(null)}} />
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}

function L({label, children}:{label:string, children:React.ReactNode}) {
  return <label className="block text-sm">
    <div className="text-[12px] text-zinc-500 mb-1 font-semibold">{label}</div>
    {children}
    <style>{`.inp{width:100%;border-radius:12px;border:1px solid #f9c4d9;background:transparent;padding:10px 12px;outline:none} .dark .inp{border-color:#3f3f46} .inp:focus{box-shadow:0 0 0 3px rgba(255,88,149,.22)}`}</style>
  </label>
}

// ------- Editors
function PostEditorModal({ post, onClose, onSave, onDelete }:{ post:Post; onClose:()=>void; onSave:(patch:Partial<Post>)=>void; onDelete:()=>void }) {
  const [author, setAuthor] = useState(post.author)
  const [body, setBody] = useState(post.body)
  const [mood, setMood] = useState(post.mood || '💗')
  const [image, setImage] = useState(post.image_url || '')
  return <Modal title="Edit love note" onClose={onClose}>
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        {(['Andre','Lulu'] as const).map(a=>(
          <button key={a} className={`px-3 py-1.5 rounded-full border ${author===a ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-900':'border-pink-200 dark:border-zinc-800'}`} onClick={()=>setAuthor(a)}>{a}</button>
        ))}
        <input value={mood} onChange={e=>setMood(e.target.value)} className="ml-auto w-20 text-center rounded-full border border-pink-200 dark:border-zinc-800 px-2 py-1.5 bg-transparent" />
      </div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} className="w-full rounded-2xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 h-32 outline-none" />
      <input value={image} onChange={e=>setImage(e.target.value)} placeholder="Image URL" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none"/>
      <div className="flex gap-2">
        <button onClick={()=>onSave({ author, body, mood, image_url: image || null })} className="flex-1 bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
        <button onClick={onDelete} className="px-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300 font-bold">Hapus</button>
      </div>
    </div>
  </Modal>
}
function TrackEditorModal({track, onClose, onSave}:{track:Track; onClose:()=>void; onSave:(patch:Partial<Track>)=>void}) {
  const [title,setTitle]=useState(track.title)
  const [artist,setArtist]=useState(track.artist)
  const [source,setSource]=useState<Track['source']>(track.source)
  const [url,setUrl]=useState(track.url)
  return <Modal title="Edit track" onClose={onClose}>
    <div className="space-y-2.5">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Judul" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5"/>
      <input value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Artist" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5"/>
      <div className="flex gap-2 text-sm flex-wrap">
        {(['mp3','youtube','spotify','soundcloud'] as const).map(s=>(
          <button key={s} onClick={()=>setSource(s)} className={`px-2.5 py-1.5 rounded-full border ${source===s ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-900' : 'border-pink-200 dark:border-zinc-800'}`}>{s}</button>
        ))}
      </div>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5"/>
      <button onClick={()=>onSave({title,artist,source,url})} className="w-full bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
    </div>
  </Modal>
}
function GalleryEditorModal({item, onClose, onSave}:{item:GalleryItem; onClose:()=>void; onSave:(patch:Partial<GalleryItem>)=>void}) {
  const [url,setUrl]=useState(item.url)
  const [caption,setCaption]=useState(item.caption||'')
  return <Modal title="Edit foto" onClose={onClose}>
    <img src={item.url} className="w-full h-44 object-cover rounded-xl mb-3" alt=""/>
    <div className="space-y-2.5">
      <input value={url} onChange={e=>setUrl(e.target.value)} className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5"/>
      <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5"/>
      <button onClick={()=>onSave({url, caption})} className="w-full bg-[#ff4b93] text-white rounded-xl py-2.5 font-bold">Simpan</button>
    </div>
  </Modal>
}

// ----- Create / upload UI reused
function NewPostButton({ onSubmit, label = "Post baru" }:{ onSubmit:(p:Omit<Post,'id'|'created_at'>)=>void, label?:string }){
  const [open,setOpen] = useState(false)
  const [author,setAuthor] = useState<'Andre'|'Lulu'>('Lulu')
  const [body,setBody] = useState('')
  const [mood,setMood] = useState('💗')
  const [image,setImage] = useState('')
  return (
    <>
      <button onClick={()=>setOpen(true)} className="px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Plus size={16}/> {label}</button>
      <AnimatePresence>
        {open && <Modal title="Tulis love note" onClose={()=>setOpen(false)}>
          <div className="space-y-3">
            <div className="flex gap-2 text-sm">
              {(['Andre','Lulu'] as const).map(a=>(
                <button key={a} className={`px-3 py-1.5 rounded-full border ${author===a ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-900':'border-pink-200 dark:border-zinc-800'}`} onClick={()=>setAuthor(a)}>{a}</button>
              ))}
              <input value={mood} onChange={e=>setMood(e.target.value)} className="ml-auto w-20 text-center rounded-full border border-pink-200 dark:border-zinc-800 px-2 py-1.5 bg-transparent" />
            </div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Ceritain hari ini sama doi..." className="w-full rounded-2xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 h-32 outline-none" />
            <div className="flex gap-2">
              <input value={image} onChange={e=>setImage(e.target.value)} placeholder="Image URL (opsional)" className="flex-1 rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none"/>
              <label className="px-3 py-2 rounded-xl border border-pink-200 dark:border-zinc-800 cursor-pointer text-sm flex items-center gap-1.5">
                <Camera size={16}/> Upload
                <input type="file" accept="image/*" className="hidden" onChange={async e=>{
                  const f = e.target.files?.[0]; if(!f) return;
                  if (isSupabaseLive && supabase) {
                    const filename = `journal/${Date.now()}-${f.name}`
                    const { error } = await supabase.storage.from('love-images').upload(filename, f, { upsert: false })
                    if (error) { toast.error('Upload gagal: '+error.message); return }
                    const { data } = supabase.storage.from('love-images').getPublicUrl(filename)
                    setImage(data.publicUrl)
                    toast.success('Foto diupload ✨')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = ()=> setImage(String(reader.result))
                  reader.readAsDataURL(f)
                }}/>
              </label>
            </div>
            <button
              disabled={!body.trim()}
              onClick={()=>{ onSubmit({ author, body, mood, image_url: image || null }); setOpen(false); setBody(''); setImage('')}}
              className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl py-2.5 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            ><Send size={16}/> Kirim note</button>
          </div>
        </Modal>}
      </AnimatePresence>
    </>
  )
}

function UploadGalleryButton({onAdd, label="Tambah foto"}:{onAdd:(url:string,caption:string)=>void, label?:string}){
  const [open,setOpen]=useState(false)
  const [url,setUrl]=useState('')
  const [caption,setCaption]=useState('')
  return <>
    <button onClick={()=>setOpen(true)} className="px-3.5 py-2 rounded-full bg-[#ff4b93] text-white font-bold flex items-center gap-2"><Plus size={16}/> {label}</button>
    <AnimatePresence>
      {open && <Modal title="Upload ke Galeri" onClose={()=>setOpen(false)}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://image-url / tempel link" className="flex-1 rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none" />
            <label className="px-3 py-2 rounded-xl border border-pink-200 dark:border-zinc-800 cursor-pointer text-sm flex items-center gap-1">
              <Camera size={16}/> File
              <input type="file" accept="image/*" className="hidden" onChange={async e=>{
                const f=e.target.files?.[0]; if(!f) return;
                if (isSupabaseLive && supabase) {
                  const filename = `gallery/${Date.now()}-${f.name}`
                  const { error } = await supabase.storage.from('love-images').upload(filename,f)
                  if (error){ toast.error(error.message); return }
                  const { data } = supabase.storage.from('love-images').getPublicUrl(filename)
                  setUrl(data.publicUrl); toast.success('Uploaded ✨'); return
                }
                const r=new FileReader(); r.onload=()=>setUrl(String(r.result)); r.readAsDataURL(f)
              }}/>
            </label>
          </div>
          <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption manis..." className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none" />
          <button disabled={!url} onClick={()=>{ onAdd(url, caption); setOpen(false); setUrl(''); setCaption('') }} className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl py-2.5 font-bold disabled:opacity-50">Simpan</button>
          <p className="text-[12px] text-zinc-500">Tip: aktifkan Supabase Storage bucket <code>love-images</code> (public) untuk upload file permanen & realtime.</p>
        </div>
      </Modal>}
    </AnimatePresence>
  </>
}

function MusicAddForm({isAdmin, onAdd}:{isAdmin:boolean; onAdd:(t:Omit<Track,'id'>)=>Promise<boolean> | void}){
  const [title,setTitle] = useState('')
  const [artist,setArtist] = useState('Andre & Lulu')
  const [source,setSource] = useState<Track['source']>('mp3')
  const [url,setUrl] = useState('')
  return (
    <div className="space-y-2.5">
      <input disabled={!isAdmin} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Judul lagu" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none disabled:opacity-60"/>
      <input disabled={!isAdmin} value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Artist" className="w-full rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none disabled:opacity-60"/>
      <div className="flex gap-2 text-sm flex-wrap">
        {(['mp3','youtube','spotify','soundcloud'] as const).map(s=>(
          <button key={s} disabled={!isAdmin} onClick={()=>setSource(s)} className={`px-2.5 py-1.5 rounded-full border ${source===s ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-900' : 'border-pink-200 dark:border-zinc-800'} disabled:opacity-60`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input disabled={!isAdmin} value={url} onChange={e=>setUrl(e.target.value)} placeholder={
          source==='youtube' ? 'https://youtube.com/watch?v=...' :
          source==='spotify' ? 'https://open.spotify.com/track/...' :
          source === 'soundcloud' ? 'https://soundcloud.com/...' : 'https://... .mp3'
        } className="flex-1 rounded-xl border border-pink-200 dark:border-zinc-800 bg-transparent px-3 py-2.5 outline-none disabled:opacity-60"/>
        <button disabled={!isAdmin || !title || !url} onClick={async()=>{ const ok = await onAdd({ title, artist, source, url }); if(ok!==false){ setTitle(''); setUrl('') } }} className="px-3 py-2 rounded-xl bg-[#ff4b93] text-white font-bold disabled:opacity-50 flex items-center gap-1"><LinkIcon size={16}/> Add</button>
      </div>
    </div>
  )
}

function Modal({title, children, onClose}:{title:string; children:React.ReactNode; onClose:()=>void}){
  return (
    <motion.div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div initial={{y:16, opacity:0}} animate={{y:0, opacity:1}} exit={{y:10, opacity:0}} onClick={e=>e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-[26px] border border-pink-200 dark:border-zinc-800 p-5 shadow-2xl max-h-[88vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-extrabold">{title}</div>
          <button onClick={onClose} className="text-zinc-500"><X size={18}/></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function BootScreen(){
  return (
    <motion.div initial={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#fff0f6] dark:bg-[#140b15]">
      <div className="text-center">
        <motion.div animate={{ scale:[1,1.12,1], rotate:[0,2,-2,0] }} transition={{ repeat: Infinity, duration:1.25 }} className="text-6xl">💗</motion.div>
        <div className="mt-3 font-extrabold text-zinc-700 dark:text-zinc-200 text-lg tracking-tight">Loading Love...</div>
        <div className="text-sm text-zinc-500 mt-1">Andre & Lulu</div>
      </div>
    </motion.div>
  )
}

function GlobalBackgroundSparkles(){
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-16 w-[420px] h-[420px] rounded-full blur-[110px]" style={{ background: 'rgba(255,164,205,.55)' }}/>
      <div className="absolute top-1/3 -right-24 w-[380px] h-[380px] rounded-full blur-[120px]" style={{ background: 'rgba(255,200,232,.68)' }}/>
      {Array.from({length:14}).map((_,i)=>(
        <span key={i}
          className="absolute text-pink-400/60 select-none"
          style={{
            left: `${(i*73)%100}%`,
            top: `${(i*37)%100}%`,
            fontSize: 14 + (i%5)*6,
            animation: `floaty ${8 + (i%4)}s ease-in-out ${(i*0.5).toFixed(1)}s infinite`
          }}>♥</span>
      ))}
      <style>{`@keyframes floaty { 0%,100%{ transform:translateY(0)} 50%{ transform:translateY(-18px)} }`}</style>
    </div>
  )
}

let heartId = 0
function spawnHeart(x:number,y:number){
  const el = document.createElement('span')
  heartId++
  el.textContent = ['💗','💖','💞','💕','✨','🌸'][Math.floor(Math.random()*6)]
  el.style.position='fixed'
  el.style.left = x+'px'
  el.style.top = y+'px'
  el.style.pointerEvents='none'
  el.style.fontSize = '18px'
  el.style.zIndex = '9999'
  el.style.transform = 'translate(-50%,-50%)'
  el.style.transition='transform .95s ease-out, opacity .95s ease-out'
  document.body.appendChild(el)
  requestAnimationFrame(()=>{
    el.style.transform = `translate(-50%,-120px) rotate(${(Math.random()*40-20).toFixed(0)}deg) scale(1.22)`
    el.style.opacity='0'
  })
  setTimeout(()=> el.remove(), 980)
}