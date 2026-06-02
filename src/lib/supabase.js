import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL o VITE_SUPABASE_KEY no están definidas. ' +
      'Las donaciones no se van a guardar.'
  )
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        realtime: { params: { eventsPerSecond: 5 } },
      })
    : null

export const isSupabaseEnabled = !!supabase
