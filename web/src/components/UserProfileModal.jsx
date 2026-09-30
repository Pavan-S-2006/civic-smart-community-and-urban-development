import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  'Reported':    'bg-red-100 text-red-700 border-red-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'Resolved':    'bg-green-100 text-green-700 border-green-200',
};

const CATEGORY_ICONS = {
  Pothole: '🕳️', Flooding: '🌊', Streetlight: '💡',
  Garbage: '🗑️', Vandalism: '🎨', Other: '📌',
};

export default function UserProfileModal({ isOpen, onClose, onOpenPitch, issues = [] }) {

  const { user, profile } = useAuth();
  const [filterStatus, setFilterStatus] = useState('All');

  if (!isOpen) return null;

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Citizen Watchdog';

  // Filter user's complaints (match user.uid or show all if demo mode)
  const myIssues = issues.filter(i => i.reportedBy === user?.uid || !i.reportedBy);

  // Compute StarPoints ⭐
  const totalReportsCount = myIssues.length;
  const totalUpvotesEarned = myIssues.reduce((acc, i) => acc + (i.upvotes || 0), 0);
  const resolvedCount = myIssues.filter(i => i.status === 'Resolved').length;
  const inProgressCount = myIssues.filter(i => i.status === 'In Progress').length;
  
  // StarPoints Formula: (50 per report) + (10 per upvote) + (100 per resolution) + (25 per in-progress)
  const starPoints = (totalReportsCount * 50) + (totalUpvotesEarned * 10) + (resolvedCount * 100) + (inProgressCount * 25);

  // Citizen Rank Title based on StarPoints
  const getCitizenRank = (pts) => {
    if (pts >= 1000) return { title: '🏆 Legend Civic Guardian', color: 'from-amber-500 to-yellow-600', badge: 'Tier 4' };
    if (pts >= 500)  return { title: '⭐ Master Civic Champion', color: 'from-purple-600 to-indigo-600', badge: 'Tier 3' };
    if (pts >= 200)  return { title: '🌟 Senior Citizen Watchdog', color: 'from-blue-600 to-indigo-600', badge: 'Tier 2' };
    return { title: '🌱 Active Citizen Contributor', color: 'from-emerald-600 to-teal-600', badge: 'Tier 1' };
  };

  const rank = getCitizenRank(starPoints);

  // Filtered issues list
  const filteredMyIssues = filterStatus === 'All'
    ? myIssues
    : myIssues.filter(i => i.status === filterStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-ink-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header Banner */}
        <div className={`bg-gradient-to-r ${rank.color} text-white p-6 relative overflow-hidden`}>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                {displayName[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl tracking-tight">{displayName}</h3>
                  <span className="text-[10px] font-extrabold bg-white/20 border border-white/40 px-2 py-0.5 rounded-full uppercase">
                    {rank.badge}
                  </span>
                </div>
                <p className="text-xs text-white/90 font-medium mt-0.5">{rank.title}</p>
                <p className="text-[11px] text-white/70">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* StarPoints Metrics Row */}
        <div className="bg-surface-100 border-b border-ink-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">StarPoints ⭐</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{starPoints}</p>
            <p className="text-[9px] text-amber-800 font-semibold mt-0.5">Civic Score Balance</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-ink-200 shadow-2xs">
            <p className="text-[10px] font-extrabold text-ink-400 uppercase tracking-wider">Complaints Filed</p>
            <p className="text-2xl font-black text-ink-900 mt-0.5">{totalReportsCount}</p>
            <p className="text-[9px] text-ink-400 font-semibold mt-0.5">+50 pts each</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-ink-200 shadow-2xs">
            <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider">Upvotes Earned</p>
            <p className="text-2xl font-black text-brand-600 mt-0.5">{totalUpvotesEarned}</p>
            <p className="text-[9px] text-brand-700 font-semibold mt-0.5">+10 pts each</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-green-200 shadow-2xs">
            <p className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider">Issues Resolved</p>
            <p className="text-2xl font-black text-green-600 mt-0.5">{resolvedCount}</p>
            <p className="text-[9px] text-green-800 font-semibold mt-0.5">+100 pts each</p>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-surface-50">

          {/* StarPoints Earning Guide */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <p className="font-bold">How to earn StarPoints ⭐:</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Report verified issues (+50 pts) • Gain community upvotes (+10 pts) • Escalate in Jukebox (+25 pts) • Achieve Resolution (+100 pts)
                </p>
              </div>
            </div>
          </div>

          {/* Complaints History Header & Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-ink-900 text-sm flex items-center gap-1.5">
                <span>📋</span> Complaints Filed History ({myIssues.length})
              </h4>
              
              <div className="flex gap-1">
                {['All', 'Reported', 'In Progress', 'Resolved'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                      filterStatus === s
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-500 border-ink-200 hover:border-ink-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Complaints Cards List */}
            {filteredMyIssues.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-ink-200 text-center">
                <p className="text-3xl mb-1">🏙️</p>
                <p className="text-xs font-bold text-ink-700">No complaints filed in this view</p>
                <p className="text-[10px] text-ink-400 mt-0.5">Click anywhere on the map to file your first civic report!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMyIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="bg-white border border-ink-200 hover:border-brand-400 p-3.5 rounded-xl shadow-2xs transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl p-2 bg-surface-100 rounded-xl border border-ink-100">
                        {CATEGORY_ICONS[issue.category] || '📌'}
                      </span>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-ink-900 text-xs leading-snug line-clamp-1">
                            {issue.title}
                          </h5>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[issue.status]}`}>
                            {issue.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-ink-500 line-clamp-2">{issue.description}</p>

                        <div className="flex items-center gap-3 pt-1 text-[10px] text-ink-400">
                          <span>📍 {issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}</span>
                          <span>👍 {issue.upvotes || 0} Upvotes</span>
                          <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            +50 StarPoints Earned
                          </span>
                        </div>
                      </div>
                    </div>

                    {issue.photoURL && (
                      <img src={issue.photoURL} alt="" className="w-14 h-14 rounded-lg object-cover border border-ink-200 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-ink-200 p-4 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenPitch?.();
            }}
            className="bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>🚀</span> Phase 6 Future Pitch
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-ink-500 hidden sm:inline">
              Total: <strong className="text-amber-600">{starPoints} StarPoints ⭐</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-ink-900 hover:bg-black text-white transition-all shadow-sm"
            >
              Close Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
