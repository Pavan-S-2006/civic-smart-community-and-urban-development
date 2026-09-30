import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../firebase/auth';
import MapPage from './MapPage';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [triggerProfile, setTriggerProfile] = useState(false);
  const [triggerCommunity, setTriggerCommunity] = useState(false);

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Citizen';

  return (
    <div className="h-screen flex flex-col">

      {/* ── Nav ── */}
      <header className="bg-black flex-shrink-0 h-14 flex items-center justify-between px-5 z-10 border-b border-zinc-800">

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="font-bold text-white tracking-tight text-sm">CivicPulse</span>
          </div>

          {/* Civic Community Button beside CivicPulse heading */}
          <button
            onClick={() => setTriggerCommunity(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600/30 to-indigo-600/30 hover:from-brand-600/50 hover:to-indigo-600/50 border border-brand-500/40 text-brand-200 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
            title="Open Civic Community - Regional Problems Feed & Global Reports Search"
          >
            <span>👥</span>
            <span>Civic Community</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTriggerProfile(true)}
            className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full py-1 px-3 transition-all cursor-pointer"
            title="Click to view My Profile & StarPoints"
          >
            <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {displayName[0].toUpperCase()}
            </div>
            <span className="text-xs text-zinc-200 font-semibold hidden sm:block">{displayName}</span>
            <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full px-2 py-0.5">
              ⭐ StarPoints
            </span>
          </button>

          <button
            id="sign-out-btn"
            onClick={logOut}
            className="text-xs font-semibold text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-400 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Map fills the rest ── */}
      <main className="flex-1 overflow-hidden">
        <MapPage
          externalShowProfile={triggerProfile}
          onResetProfileTrigger={() => setTriggerProfile(false)}
          externalShowCommunity={triggerCommunity}
          onResetCommunityTrigger={() => setTriggerCommunity(false)}
        />
      </main>
    </div>
  );
}
