import { createClient } from '@supabase/supabase-js'

// Supabase URLを環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

// サーバーサイドかクライアントサイドかでキーを使い分ける
// サーバーサイド (API routes, server components) では service_role key を使用
// クライアントサイド (client components) では anon key を使用
const supabaseKey = typeof window === 'undefined' 
  ? process.env.SUPABASE_KEY 
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use ANON key for client-side

if (!supabaseKey) {
  if (typeof window === 'undefined') {
    throw new Error("Missing env.SUPABASE_KEY for server-side usage.");
  } else {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY for client-side usage.");
  }
}

// Supabaseクライアントを初期化
// Note: For server-side operations needing elevated privileges (like bypassing RLS),
// you might need a separate client instance initialized explicitly with the service_role key.
// This setup uses service_role on server, anon on client by default.
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
