import { useState } from 'react';
import { signUp } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';
import FirebaseSetupBanner from '../components/FirebaseSetupBanner';

export default function SignupPage({ onSwitch }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Create web/.env.local with your credentials and restart the dev server.');
      return;
    }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signUp(email, password, name.trim());
    } catch (err) {
      console.error('[CivicPulse] Signup error:', err.code, err.message);
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border-2 border-ink-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder-ink-300 bg-white focus:outline-none focus:border-brand-500 transition-colors';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <FirebaseSetupBanner />
      <div className="flex flex-1">

      {/* ── Left panel (brand) ── */}
      <div className="hidden lg:flex w-1/2 bg-brand-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-20 -left-16 w-56 h-56 rounded-full bg-black/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl">⚡</span>
          <span className="text-2xl font-bold text-white tracking-tight">CivicPulse</span>
        </div>

        {/* Steps */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-8">
            Make your city<br />better, today.
          </h2>

          <div className="space-y-5">
            {[
              { n: '01', title: 'Report issues',     desc: 'Pin civic problems directly on the map.' },
              { n: '02', title: 'AI verification',   desc: 'Smart tagging and claim checking on every report.' },
              { n: '03', title: 'Track resolutions', desc: 'Follow progress from Reported to Resolved.' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-4">
                <span className="text-xs font-black text-white/40 mt-0.5 w-6 flex-shrink-0">{s.n}</span>
                <div>
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="text-xs text-red-200 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-ink-900">CivicPulse</span>
          </div>

          <h1 className="text-3xl font-extrabold text-ink-900 mb-1">Create account</h1>
          <p className="text-ink-400 text-sm mb-8">Join your city's civic network — it's free</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wide" htmlFor="signup-name">
                Display name
              </label>
              <input id="signup-name" type="text" required value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass} placeholder="Jane Doe" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wide" htmlFor="signup-email">
                Email address
              </label>
              <input id="signup-email" type="email" autoComplete="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass} placeholder="citizen@example.com" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wide" htmlFor="signup-password">
                Password
              </label>
              <input id="signup-password" type="password" autoComplete="new-password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass} placeholder="At least 6 characters" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wide" htmlFor="signup-confirm">
                Confirm password
              </label>
              <input id="signup-confirm" type="password" autoComplete="new-password" required value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={inputClass} placeholder="••••••••" />
            </div>

            {error && (
              <div className="bg-danger-100 border border-brand-200 rounded-xl px-4 py-3">
                <span className="text-brand-600 text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="signup-submit"
              className="w-full bg-ink-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98] mt-1"
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>

            <p className="text-xs text-ink-300 text-center">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-xs text-ink-300">or</span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          <p className="text-center text-ink-400 text-sm">
            Already have an account?{' '}
            <button
              id="go-to-login"
              onClick={onSwitch}
              className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
            >
              Sign in
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
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
    case 'auth/app-not-authorized':
      return 'Firebase is not configured correctly. Check your .env.local credentials.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in methods and enable it.';
    default:
      return `Sign-up failed (${code || 'unknown error'}). Check the browser console for details.`;
  }
}
