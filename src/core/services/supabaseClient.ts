/**
 * Cliente Supabase — singleton para toda la app.
 * Usa la anon key (publishable) para conexión directa.
 * Sesiones persistidas con AsyncStorage.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://eqwrizqsfkwmqefaaewz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxd3JpenFzZmt3bXFlZmFhZXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4MTMsImV4cCI6MjA5MjAxNjgxM30.SajrbUxWTeHm8aw0Qy7z79Mtg02c3urQyFfXWHgwWZs';

// Storage adapter seguro para web/SSR
const supabaseStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
