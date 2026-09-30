import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './index';
import { isFirebaseConfigured } from './config';

function assertConfigured() {
  if (!isFirebaseConfigured) {
    throw Object.assign(new Error('Firebase not configured'), { code: 'auth/configuration-not-found' });
  }
}

/**
 * Sign up a new user and create their Firestore profile document.
 */
export async function signUp(email, password, displayName) {
  assertConfigured();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Set display name on the Auth profile
  await updateProfile(user, { displayName });

  // Create user profile document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email,
    points: 0,
    reportsCount: 0,
    upvotesCount: 0,
    commentsCount: 0,
    badges: [],
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  return user;
}

/**
 * Sign in an existing user.
 */
export async function signIn(email, password) {
  assertConfigured();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Sign out the current user.
 */
export async function logOut() {
  assertConfigured();
  await signOut(auth);
}

/**
 * Get the Firestore profile for a user.
 */
export async function getUserProfile(uid) {
  assertConfigured();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function subscribeToAuthState(callback) {
  if (!isFirebaseConfigured) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}
