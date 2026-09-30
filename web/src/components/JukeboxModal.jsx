import { useState, useEffect } from 'react';
import { subscribeToComments, addComment, voteComment } from '../firebase/comments';
import { useAuth } from '../context/AuthContext';

export default function JukeboxModal({ issue, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [votingId, setVotingId] = useState(null);

  // Default seed comments to display if Firestore is empty or loading initial data
  const seedComments = [
    {
      id: 'seed-1',
      authorName: 'Ramesh Kumar',
      text: 'This is a recurring issue in our area! The municipality needs to look into this urgently before the monsoon starts.',
      createdAt: { toDate: () => new Date(Date.now() - 3600000 * 5) },
      upvotes: 12,
      downvotes: 1,
      upvotedBy: [],
      downvotedBy: [],
      parentId: null,
    },
    {
      id: 'seed-2',
      authorName: 'Ananya Sharma',
      text: 'I passed by this spot yesterday evening. It poses a real hazard for two-wheelers at night.',
      createdAt: { toDate: () => new Date(Date.now() - 3600000 * 2) },
      upvotes: 8,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: [],
      parentId: null,
    },
    {
      id: 'seed-3',
      authorName: 'Vikram Singh',
      text: 'Agreed! I already reported this to local ward councillor last week.',
      createdAt: { toDate: () => new Date(Date.now() - 3600000 * 1) },
      upvotes: 5,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: [],
      parentId: 'seed-1',
    }
  ];

  useEffect(() => {
    if (!issue?.id) return;
    const unsub = subscribeToComments(issue.id, (data) => {
      setComments(data);
      setLoading(false);
    });
    return unsub;
  }, [issue?.id]);

  // Combine live comments from Firestore with seed fallback if Firestore list is empty
  const displayComments = (comments && comments.length > 0) ? comments : (loading ? [] : seedComments);

  const topLevelComments = displayComments.filter(c => !c.parentId);
  const getReplies = (parentId) => displayComments.filter(c => c.parentId === parentId);

  async function handlePostComment(e, parentId = null) {
    e.preventDefault();
    const textToPost = parentId ? replyText : newText;
    if (!textToPost.trim()) return;

    setSubmitting(true);
    try {
      if (user) {
        await addComment({
          issueId: issue.id,
          text: textToPost,
          parentId: parentId,
          user: user,
        });
      } else {
        // Local state fallback if user not logged in
        const newObj = {
          id: 'local-' + Date.now(),
          authorName: user?.displayName || 'Citizen Reaction',
          text: textToPost.trim(),
          createdAt: { toDate: () => new Date() },
          upvotes: 1,
          downvotes: 0,
          upvotedBy: [user?.uid || 'guest'],
          downvotedBy: [],
          parentId: parentId,
        };
        setComments(prev => [...prev, newObj]);
      }

      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewText('');
      }
    } catch (err) {
      console.error('Failed to post reaction:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(commentItem, type) {
    if (!user) return;
    setVotingId(commentItem.id);

    const isUpvoted = commentItem.upvotedBy?.includes(user.uid);
    const isDownvoted = commentItem.downvotedBy?.includes(user.uid);

    try {
      if (commentItem.id.startsWith('seed-') || commentItem.id.startsWith('local-')) {
        // Local toggle for seed/local comments
        setComments(prev => {
          const list = prev.length > 0 ? [...prev] : [...seedComments];
          return list.map(c => {
            if (c.id !== commentItem.id) return c;
            let up = c.upvotes || 0;
            let down = c.downvotes || 0;
            let upArr = [...(c.upvotedBy || [])];
            let downArr = [...(c.downvotedBy || [])];

            if (type === 'up') {
              if (isUpvoted) {
                up--;
                upArr = upArr.filter(id => id !== user.uid);
              } else {
                up++;
                upArr.push(user.uid);
                if (isDownvoted) {
                  down--;
                  downArr = downArr.filter(id => id !== user.uid);
                }
              }
            } else {
              if (isDownvoted) {
                down--;
                downArr = downArr.filter(id => id !== user.uid);
              } else {
                down++;
                downArr.push(user.uid);
                if (isUpvoted) {
                  up--;
                  upArr = upArr.filter(id => id !== user.uid);
                }
              }
            }
            return { ...c, upvotes: Math.max(0, up), downvotes: Math.max(0, down), upvotedBy: upArr, downvotedBy: downArr };
          });
        });
      } else {
        await voteComment({
          issueId: issue.id,
          commentId: commentItem.id,
          uid: user.uid,
          voteType: type,
          currentUpvoted: isUpvoted,
          currentDownvoted: isDownvoted,
        });
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setVotingId(null);
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  const renderCommentCard = (comment, isReply = false) => {
    const isUpvoted = comment.upvotedBy?.includes(user?.uid);
    const isDownvoted = comment.downvotedBy?.includes(user?.uid);
    const replies = getReplies(comment.id);
    const netVotes = (comment.upvotes || 0) - (comment.downvotes || 0);

    return (
      <div key={comment.id} className={`group ${isReply ? 'mt-3 pl-4 border-l-2 border-brand-200' : 'mb-4 pb-4 border-b border-ink-100'}`}>
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-red-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
            {(comment.authorName || 'C')[0].toUpperCase()}
          </div>

          {/* Comment Body */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xs text-ink-900">{comment.authorName}</span>
              <span className="text-[10px] text-ink-400">• {formatTime(comment.createdAt)}</span>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed bg-surface-50 p-2.5 rounded-xl border border-ink-100/80">
              {comment.text}
            </p>

            {/* Reaction Controls (Upvote / Downvote / Reply) */}
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
              <div className="flex items-center bg-surface-100 rounded-lg p-0.5 border border-ink-200/60">
                <button
                  onClick={() => handleVote(comment, 'up')}
                  disabled={votingId === comment.id || !user}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                    isUpvoted
                      ? 'bg-brand-600 text-white shadow-sm font-bold'
                      : 'text-ink-600 hover:text-brand-600 hover:bg-white'
                  }`}
                  title="Upvote comment"
                >
                  <span>▲</span>
                  <span>{comment.upvotes || 0}</span>
                </button>

                <div className="w-[1px] h-3 bg-ink-200 my-auto" />

                <button
                  onClick={() => handleVote(comment, 'down')}
                  disabled={votingId === comment.id || !user}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                    isDownvoted
                      ? 'bg-ink-800 text-white shadow-sm font-bold'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-white'
                  }`}
                  title="Downvote comment"
                >
                  <span>▼</span>
                  <span>{comment.downvotes || 0}</span>
                </button>
              </div>

              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${netVotes >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                Score: {netVotes > 0 ? `+${netVotes}` : netVotes}
              </span>

              {!isReply && (
                <button
                  onClick={() => {
                    if (replyingToId === comment.id) {
                      setReplyingToId(null);
                    } else {
                      setReplyingToId(comment.id);
                      setReplyText('');
                    }
                  }}
                  className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 text-[11px] ml-auto transition-colors"
                >
                  💬 {replyingToId === comment.id ? 'Cancel Reply' : 'Reply'}
                </button>
              )}
            </div>

            {/* Reply Input Box */}
            {replyingToId === comment.id && (
              <form onSubmit={(e) => handlePostComment(e, comment.id)} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder={`Replying to ${comment.authorName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 text-xs border border-ink-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500 bg-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                >
                  Reply
                </button>
              </form>
            )}

            {/* Nested Replies */}
            {replies.length > 0 && (
              <div className="space-y-2 mt-1">
                {replies.map(reply => renderCommentCard(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-ink-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Jukebox Banner / Header */}
        <div className="bg-gradient-to-r from-ink-950 via-ink-900 to-brand-950 text-white p-4 relative flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl bg-brand-600/30 p-1.5 rounded-xl border border-brand-500/40">🎵</span>
              <div>
                <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                  JUKEBOX
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-600 text-white px-2 py-0.5 rounded-full">
                    Public Talk
                  </span>
                </h3>
                <p className="text-xs text-ink-300 line-clamp-1">{issue?.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-ink-300">
            <span>🗣️ Citizen Comments & Reactions</span>
            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
              {displayComments.length} Reactions
            </span>
          </div>
        </div>

        {/* Comment Creation Box */}
        <div className="p-4 border-b border-ink-100 bg-surface-50 flex-shrink-0">
          <form onSubmit={(e) => handlePostComment(e, null)} className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <textarea
                rows={2}
                placeholder="Share your thought or reaction to this problem..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="flex-1 text-xs border border-ink-200 rounded-xl p-2.5 focus:outline-none focus:border-brand-500 bg-white resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newText.trim()}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>🎵 Post Reaction</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="py-8 text-center text-xs text-ink-400 space-y-2">
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading Public Talk reactions...</p>
            </div>
          )}

          {!loading && topLevelComments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="font-bold text-sm text-ink-800">No public reactions yet</p>
              <p className="text-xs text-ink-400 mt-1">Be the first common citizen to post a comment in Jukebox!</p>
            </div>
          )}

          {!loading && topLevelComments.map(comment => renderCommentCard(comment))}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-surface-100 border-t border-ink-200 flex items-center justify-between text-[11px] text-ink-400 flex-shrink-0">
          <span> Upvote 👍 or downvote 👎 reactions to highlight priority civic issues.</span>
          <button
            onClick={onClose}
            className="font-bold text-ink-700 hover:text-ink-900 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
