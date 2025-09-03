import { createClient } from "@supabase/supabase-js";

// 환경변수 또는 직접 입력 (아래 값은 실제 프로젝트에 맞게 수정하세요)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://YOUR_PROJECT_ID.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_PUBLIC_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);
