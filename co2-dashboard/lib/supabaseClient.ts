import { createClient } from '@supabase/supabase-js';

// ดึงค่า URL และ Key จาก Environment Variables ที่เราตั้งไว้
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// สร้างและ export ตัว client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);