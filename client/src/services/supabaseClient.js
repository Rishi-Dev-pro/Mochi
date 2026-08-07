import { createClient } from '@supabase/supabase-js'

// Get from Vite environment variables or defaults
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Get or create user ID (stored in localStorage)
export function getUserId() {
  let userId = localStorage.getItem('mochi_user_id')
  
  if (!userId) {
    // Generate unique user ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('mochi_user_id', userId)
  }
  
  return userId
}

// Check if online
export function isOnline() {
  return navigator.onLine
}

// Subscribe to online/offline changes
export function onNetworkChange(callback) {
  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))
  
  return () => {
    window.removeEventListener('online', () => callback(true))
    window.removeEventListener('offline', () => callback(false))
  }
}

// Health check
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('emotions')
      .select('count', { count: 'exact', head: true })
    
    return !error
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}
