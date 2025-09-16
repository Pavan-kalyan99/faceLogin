import { createClient } from "@supabase/supabase-js";

 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//const supabaseUrl = 'https://zrwzlbtybrcoqoncsuaf.supabase.co';


//const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyd3psYnR5YnJjb3FvbmNzdWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTAwOTMsImV4cCI6MjA3MjcyNjA5M30.61H5zS7jNheBIfXkKX5I7N5CO1XA23x0qUP2QfQA5PY';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
