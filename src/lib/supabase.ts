import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
  )
}

// OJO: esta es la anon key, segura para el navegador.
// La service_role key NUNCA debe importarse aquí — solo vive en /api (Vercel).
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
