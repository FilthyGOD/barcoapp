/**
 * Cliente Supabase — singleton para toda la app.
 * Usa la anon key (publishable) para conexión directa.
 * RLS está deshabilitado; auth local con DEMO_USERS.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://eqwrizqsfkwmqefaaewz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxd3JpenFzZmt3bXFlZmFhZXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4MTMsImV4cCI6MjA5MjAxNjgxM30.SajrbUxWTeHm8aw0Qy7z79Mtg02c3urQyFfXWHgwWZs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
