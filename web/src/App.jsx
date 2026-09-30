import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';

function AppRoutes() {
  const { user } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'signup'

  // Still loading auth state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-pulse">⚡</span>
          <span className="text-2xl font-extrabold text-ink-900 tracking-tight">CivicPulse</span>
        </div>
        <div className="w-6 h-6 border-2 border-ink-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-ink-400 text-xs">Connecting…</p>
      </div>
    );
  }

  // Authenticated → show dashboard
  if (user) {
    return <DashboardPage />;
  }

  // Not authenticated → show auth pages
  return view === 'login'
    ? <LoginPage  onSwitch={() => setView('signup')} />
    : <SignupPage onSwitch={() => setView('login')}  />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
