/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string
  readonly VITE_ADMIN_PASSWORD?: string
  readonly NEXT_PUBLIC_SUPABASE_URL?: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  readonly NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?: string
  readonly NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
