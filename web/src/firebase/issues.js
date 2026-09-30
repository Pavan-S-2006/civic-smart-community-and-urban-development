import {
  collection, addDoc, doc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './index';

const ISSUES_COL = 'issues';

/**
 * Real-time listener for all issues.
 * Calls callback with array of issue objects.
 * Returns unsubscribe function.
 */
export function subscribeToIssues(callback) {
  const q = query(collection(db, ISSUES_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const issues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(issues);
  });
}

/**
 * Upload a photo file and return its download URL.
 */
export async function uploadIssuePhoto(file, issueId) {
  const ext  = file.name.split('.').pop();
  const path = `issues/${issueId}/photo.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Save a new issue to Firestore (optionally with a photo).
 */
export async function saveIssue({ title, description, category, lat, lng, photoFile, user }) {
  // 1. Write doc first to get the ID
  const docRef = await addDoc(collection(db, ISSUES_COL), {
    title,
    description,
    category,
    lat,
    lng,
    status:          'Reported',
    upvotes:         0,
    upvotedBy:       [],
    photoURL:        null,
    reportedBy:      user.uid,
    reportedByName:  user.displayName || user.email,
    createdAt:       serverTimestamp(),
  });

  // 2. If there's a photo, upload it and patch the doc
  if (photoFile) {
    const url = await uploadIssuePhoto(photoFile, docRef.id);
    await updateDoc(docRef, { photoURL: url });
  }

  return docRef.id;
}

/**
 * Toggle upvote for an issue.
 */
export async function toggleUpvote(issueId, uid, hasUpvoted) {
  const ref = doc(db, ISSUES_COL, issueId);
  if (hasUpvoted) {
    await updateDoc(ref, { upvotes: increment(-1), upvotedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: increment(1),  upvotedBy: arrayUnion(uid)  });
  }
}

/**
 * Update issue status.
 */
export async function updateIssueStatus(issueId, status) {
  await updateDoc(doc(db, ISSUES_COL, issueId), { status });
}
