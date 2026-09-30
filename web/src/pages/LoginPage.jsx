import { useState } from 'react';
import { signIn } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';
import FirebaseSetupBanner from '../components/FirebaseSetupBanner';

export default function LoginPage({ onSwitch }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Add your credentials to web/.env.local and restart the dev server.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      console.error('[CivicPulse] Auth error:', err.code, err.message);
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <FirebaseSetupBanner />
      <div className="flex flex-1">

      {/* ── Left panel (brand) ── */}
      <div className="hidden lg:flex w-1/2 bg-black flex-col justify-between p-12 relative overflow-hidden">
        {/* Red accent glow */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-600/30 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-brand-700/20 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl">⚡</span>
          <span className="text-2xl font-bold text-white tracking-tight">CivicPulse</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your city,<br />
            <span className="text-brand-500">your voice.</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Report civic issues, track resolutions, and collaborate with your community — powered by AI.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[
              { val: '12K+', label: 'Issues resolved' },
              { val: '94%',  label: 'Trust score'     },
              { val: '3.2K', label: 'Active citizens'  },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-brand-500">{s.val}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-ink-900">CivicPulse</span>
          </div>

          <h1 className="text-3xl font-extrabold text-ink-900 mb-1">Welcome back</h1>
          <p className="text-ink-400 text-sm mb-8">Sign in to continue to CivicPulse</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wide" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-ink-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder-ink-300 bg-white focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="citizen@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wide" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border-2 border-ink-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder-ink-300 bg-white focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-danger-100 border border-brand-200 rounded-xl px-4 py-3">
                <span className="text-brand-600 text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-all duration-200 hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.98] mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-xs text-ink-300">or</span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          <p className="text-center text-ink-400 text-sm">
            Don't have an account?{' '}
            <button
              id="go-to-signup"
              onClick={onSwitch}
              className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
            >
              Create one free
            </button>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

function getFriendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
    case 'auth/app-not-authorized':
      return 'Firebase is not configured correctly. Check your .env.local credentials.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in methods and enable it.';
    default:
      return `Sign-in failed (${code || 'unknown error'}). Check the browser console for details.`;
  }
}
