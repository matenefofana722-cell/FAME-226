// FAME-226 SUPABASE - NO CARD, LONDON
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE' // https://xxxxx.supabase.co
const SUPABASE_ANON = 'YOUR_ANON_KEY_HERE' // eyJ...

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export async function uploadFameVideo(file, caption){
  const fileName = Date.now() + '_' + file.name.replaceAll(' ','_')
  const { data, error } = await supabase.storage.from('videos').upload(fileName, file)
  if(error) throw error
  const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName)

  const { error: dbError } = await supabase.from('videos').insert({
    url: publicUrl,
    caption: caption,
    username: 'you',
    likes: Math.floor(Math.random()*50)+1
  })
  if(dbError) throw dbError
  return publicUrl
}

export async function getFameFeed(){
  const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
  return data || []
}
