// Authentication API that works with the Express backend
// This provides the same interface but uses our REST API instead of Supabase

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
