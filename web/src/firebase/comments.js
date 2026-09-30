import {
  collection, addDoc, doc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { db } from './index';

/**
 * Real-time listener for comments on a specific issue.
 * Listens to issues/{issueId}/comments
 */
export function subscribeToComments(issueId, callback) {
  if (!issueId) return () => {};
  const commentsRef = collection(db, 'issues', issueId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, snap => {
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(comments);
  }, (err) => {
    console.warn('Comments subscription warning:', err);
    callback([]);
  });
}

/**
 * Add a comment or reply to an issue.
 */
export async function addComment({ issueId, text, parentId = null, user }) {
  if (!issueId || !text.trim() || !user) return;

  const commentsRef = collection(db, 'issues', issueId, 'comments');
  const commentDoc = await addDoc(commentsRef, {
    text: text.trim(),
    parentId: parentId || null,
    authorId: user.uid,
    authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous Citizen',
    upvotes: 0,
    downvotes: 0,
    upvotedBy: [],
    downvotedBy: [],
    createdAt: serverTimestamp(),
  });

  // Increment comment count on the issue document
  try {
    const issueRef = doc(db, 'issues', issueId);
    await updateDoc(issueRef, { commentCount: increment(1) });
  } catch (e) {
    console.warn('Could not update issue commentCount:', e);
  }

  return commentDoc.id;
}

/**
 * Vote on a comment (upvote or downvote).
 * Allows toggling or switching vote.
 */
export async function voteComment({ issueId, commentId, uid, voteType, currentUpvoted, currentDownvoted }) {
  if (!issueId || !commentId || !uid) return;

  const commentRef = doc(db, 'issues', issueId, 'comments', commentId);

  if (voteType === 'up') {
    if (currentUpvoted) {
      // Remove upvote
      await updateDoc(commentRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(uid),
      });
    } else {
      // Add upvote, remove downvote if present
      const updates = {
        upvotes: increment(1),
        upvotedBy: arrayUnion(uid),
      };
      if (currentDownvoted) {
        updates.downvotes = increment(-1);
        updates.downvotedBy = arrayRemove(uid);
      }
      await updateDoc(commentRef, updates);
    }
  } else if (voteType === 'down') {
    if (currentDownvoted) {
      // Remove downvote
      await updateDoc(commentRef, {
        downvotes: increment(-1),
        downvotedBy: arrayRemove(uid),
      });
    } else {
      // Add downvote, remove upvote if present
      const updates = {
        downvotes: increment(1),
        downvotedBy: arrayUnion(uid),
      };
      if (currentUpvoted) {
        updates.upvotes = increment(-1);
        updates.upvotedBy = arrayRemove(uid);
      }
      await updateDoc(commentRef, updates);
    }
  }
}
