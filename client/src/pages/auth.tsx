import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  if (mode === 'login') {
    return <LoginForm onSwitchToSignup={() => setMode('signup')} />;
  }

  return <SignupForm onSwitchToLogin={() => setMode('login')} />;
}
