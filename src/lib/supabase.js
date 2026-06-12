import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage helpers
export const MUSIC_BUCKET = 'music'
export const COVERS_BUCKET = 'covers'

export function getMusicUrl(path) {
  const { data } = supabase.storage.from(MUSIC_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function getCoverUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
