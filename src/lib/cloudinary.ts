import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './supabaseClient'

export async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    // Fallback: convert to base64 if Cloudinary not configured (useful for local dev)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })
  }
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME)
  console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET)
// fd.append('folder', 'andrelulu')
  const res = await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST', body: fd,
  })
const errorText = await res.text()

if (!res.ok) {
  console.error(errorText)
  throw new Error(errorText)
}
  const data = await res.json()
  return data.secure_url as string
}

export async function uploadUrlToCloudinary(url: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) return url
  const fd = new FormData()
  fd.append('file', url)
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  fd.append('folder', 'andrelulu')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: fd })
  if (!res.ok) return url // fallback keep original URL
  const data = await res.json()
  return data.secure_url
}
