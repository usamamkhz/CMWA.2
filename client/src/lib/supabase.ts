// Note: This file sets up the structure for Supabase integration
// The actual DATABASE_URL will be provided by the user from their Supabase project

import { createClient } from '@supabase/supabase-js';

// These would be set from environment variables in a real implementation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For now, we'll use our own backend API instead of direct Supabase calls
// This allows the app to work with the provided storage implementation
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    return response.json();
  },
  
  signUp: async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role: 'client' }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return response.json();
  },
  
  signOut: async () => {
    // Clear local storage
    localStorage.removeItem('user');
  }
};
