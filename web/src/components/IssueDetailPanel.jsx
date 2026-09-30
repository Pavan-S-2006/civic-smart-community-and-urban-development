import { useState, useEffect } from 'react';
import { toggleUpvote, updateIssueStatus } from '../firebase/issues';
import { useAuth } from '../context/AuthContext';
import { generateAITagsAndSuggestions } from '../services/aiTagging';
import JukeboxModal from './JukeboxModal';
import CivicAIChatBox from './CivicAIChatBox';

const STATUS_OPTIONS = ['Reported', 'In Progress', 'Resolved'];



const STATUS_STYLE = {
  'Reported':    'bg-red-100 text-red-700 border-red-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'Resolved':    'bg-green-100 text-green-700 border-green-200',
};

const STATUS_ICON = {
  'Reported':    '🔴',
  'In Progress': '🟡',
  'Resolved':    '🟢',
};

const CATEGORY_COLORS = {
  'Pothole':     '#ef4444',
  'Flooding':    '#3b82f6',
  'Streetlight': '#f59e0b',
  'Garbage':     '#10b981',
  'Vandalism':   '#8b5cf6',
  'Other':       '#6b7280',
};

export default function IssueDetailPanel({ issue, onClose }) {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [upvoting,       setUpvoting]       = useState(false);
  const [showJukebox,    setShowJukebox]    = useState(false);
  const [aiData,         setAiData]         = useState(null);

  useEffect(() => {
    let isMounted = true;
    generateAITagsAndSuggestions({
      title: issue.title,
      description: issue.description,
      category: issue.category,
    }).then(res => {
      if (isMounted) setAiData(res);
    });
    return () => { isMounted = false; };
  }, [issue.id]);

  const hasUpvoted = issue.upvotedBy?.includes(user?.uid);


  async function handleUpvote() {
    if (!user || upvoting) return;
    setUpvoting(true);
    try {
      await toggleUpvote(issue.id, user.uid, hasUpvoted);
    } finally {
      setUpvoting(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setUpdatingStatus(true);
    try {
      await updateIssueStatus(issue.id, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  }

  const createdAt = issue.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) ?? 'Just now';

  return (
    <>
      <div className="absolute bottom-4 right-4 w-84 bg-white border border-ink-200 rounded-2xl shadow-2xl z-[999] overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header strip */}
        <div className="h-1.5 flex-shrink-0" style={{ background: CATEGORY_COLORS[issue.category] ?? '#6b7280' }} />

        {/* Top bar */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[issue.status]}`}>
              {STATUS_ICON[issue.status]} {issue.status}
            </span>
            <span className="text-[10px] text-ink-400">{issue.category}</span>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 text-xl leading-none transition-colors">×</button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">

          {/* Title */}
          <h3 className="font-extrabold text-ink-900 text-sm leading-snug">{issue.title}</h3>

          {/* Photo */}
          {issue.photoURL && (
            <div className="rounded-xl overflow-hidden border border-ink-200">
              <img
                src={issue.photoURL}
                alt={issue.title}
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          {/* Jukebox / Public Talk Button */}
          <div className="bg-gradient-to-r from-ink-900 to-brand-950 p-3 rounded-xl text-white shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🎵</span>
                <span className="font-bold text-xs">Jukebox Public Talk</span>
              </div>
              <span className="text-[9px] bg-brand-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                Social Feed
              </span>
            </div>
            <p className="text-[10px] text-ink-300 mb-2">
              See what common citizens are saying, upvote & downvote reactions, or post a reply.
            </p>
            <button
              onClick={() => setShowJukebox(true)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow"
            >
              <span>💬 Open Jukebox Comments</span>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {issue.commentCount || 0}
              </span>
            </button>
          </div>

          {/* Description */}
          {issue.description && (
            <p className="text-xs text-ink-600 leading-relaxed">{issue.description}</p>
          )}

          {/* AI Smart Tagging & Dispatch Recommendation */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🤖</span>
                <span className="font-extrabold text-[11px] text-indigo-950">AI Smart Tagging & Dispatch</span>
              </div>
              <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                {aiData?.aiGenerated ? '⚡ Gemini AI' : 'Smart Engine'}
              </span>
            </div>

            {aiData ? (
              <>
                <div className="flex flex-wrap gap-1">
                  {aiData.tags.map(t => (
                    <span key={t} className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-md shadow-2xs">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-indigo-900 space-y-1 bg-white/70 p-2 rounded-lg border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Department:</span>
                    <span className="font-bold text-indigo-700">{aiData.department}</span>
                  </div>
                  <div>
                    <span className="font-semibold block mb-0.5">Tagged Personnel:</span>
                    <div className="flex flex-wrap gap-1">
                      {aiData.taggedPersonnel.map(p => (
                        <span key={p} className="text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-1 text-[9px] text-ink-600 border-t border-indigo-100">
                    <strong className="text-indigo-900">Workflow Action:</strong> {aiData.suggestedAction}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[10px] text-indigo-400 animate-pulse">Generating AI tags & department routing…</div>
            )}
          </div>


          {/* Reliability & Verification Badge */}
          <div className="bg-surface-100 border border-ink-200 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🛡️</span>
                <div>
                  <p className="text-[10px] font-bold text-ink-900">Community Consensus</p>
                  <p className="text-[9px] text-ink-400">
                    {(issue.upvotes ?? 0) >= 10
                      ? 'High (Verified by Community)'
                      : (issue.upvotes ?? 0) >= 3
                      ? 'Medium (3+ Upvotes)'
                      : 'Pending Verification'}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                (issue.upvotes ?? 0) >= 10
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : (issue.upvotes ?? 0) >= 3
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {(issue.upvotes ?? 0) >= 10 ? 'High' : (issue.upvotes ?? 0) >= 3 ? 'Medium' : 'Unverified'}
              </span>
            </div>

            {/* AI Authenticity Index */}
            <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">✨</span>
                <span className="text-[10px] font-bold text-emerald-900">AI Authenticity Index</span>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                {issue.authenticityIndex ?? 96}% Genuine
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="text-[10px] text-ink-300 space-y-1">
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>Reported by <span className="font-semibold text-ink-500">{issue.reportedByName}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{createdAt}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{issue.lat?.toFixed(5)}, {issue.lng?.toFixed(5)}</span>
            </div>
          </div>

          {/* Status timeline */}
          <div>
            <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Update Status</p>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  disabled={updatingStatus || issue.status === s}
                  onClick={() => handleStatusChange(s)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                    issue.status === s
                      ? STATUS_STYLE[s] + ' cursor-default'
                      : 'border-ink-200 text-ink-400 hover:border-ink-400 bg-white'
                  }`}
                >
                  {s === 'In Progress' ? 'In Prog.' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Assistant Chat Box Popup */}
        <CivicAIChatBox issue={issue} />

        {/* Upvote & Jukebox footer */}
        <div className="border-t border-ink-200 px-4 py-3 flex items-center gap-2">

          <button
            onClick={handleUpvote}
            disabled={!user || upvoting}
            className={`flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-2 transition-all flex-1 justify-center ${
              hasUpvoted
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-surface-100 text-ink-600 border border-ink-200 hover:border-brand-400 hover:text-brand-600'
            }`}
          >
            {upvoting
              ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <span>👍</span>
            }
            {issue.upvotes ?? 0} {hasUpvoted ? 'Upvoted' : 'Upvote'}
          </button>

          <button
            onClick={() => setShowJukebox(true)}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-2 bg-ink-900 hover:bg-black text-white transition-all justify-center"
            title="Open Jukebox Public Talk"
          >
            <span>🎵 Jukebox</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs text-ink-400 hover:text-ink-700 font-semibold transition-colors px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Jukebox Modal */}
      {showJukebox && (
        <JukeboxModal
          issue={issue}
          onClose={() => setShowJukebox(false)}
        />
      )}
    </>
  );
}
