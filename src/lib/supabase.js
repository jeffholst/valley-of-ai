import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://svgompwhjikfihuxtjaj.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_VfkdGRo0ovxZkngmed7R8Q_jANyzcKk' // TODO: Replace with your anon key from Settings → API

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
