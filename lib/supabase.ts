import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mrkxgihqmibiboepgowm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ya3hnaWhxbWliaWJvZXBnb3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzcwNjUsImV4cCI6MjA4ODcxMzA2NX0.GNf7tmokmzHaAJSZnRFg_j3EwsE6w1bUVNUdxVhMtns';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
