import { createClient } from '@supabase/supabase-js'

// Supabase URLとキーを環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://doeoivuhqbnxkzmwjosz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || ''

// Supabaseクライアントを初期化
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase 