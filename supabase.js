import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://oxrwfvccrvbnpernnowr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t6xdTa2WF8LBXq1hCllOIA_1bPjCJYU';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
