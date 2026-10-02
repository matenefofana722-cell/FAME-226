// FAME-226 - LONDON - REAL KEYS - READY TO BE FAMOUS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://oxrwfvccrvbnpernnowr.supabase.co'
const SUPABASE_ANON = 'sb_publishable_t6xdTa2WF8LBXq1hCllOIA_1bPjCJYU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export async function uploadFameVideo(file, caption){
  const fileName = Date.now() + '_' + file.name.replaceAll(' ','_')
  const { error } = await supabase.storage.from('videos').upload(fileName, file)
  if(error) throw error
  const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName)
  const { error: dbError } = await supabase.from('videos').insert({
    url: publicUrl,
    caption: caption,
    username: localStorage.getItem('fame_username') || 'london_boy',
    likes: 0
  })
  if(dbError) throw dbError
  return publicUrl
}

export async function getFameFeed(){
  const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function likeFameVideo(id, currentLikes){
  const { error } = await supabase.from('videos').update({ likes: currentLikes + 1 }).eq('id', id)
  if(error) throw error
}
