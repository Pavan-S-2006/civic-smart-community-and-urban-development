import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig, isFirebaseConfigured } from './config';

// Only initialize Firebase when credentials are present.
// If we call initializeApp() with empty strings Firebase throws auth/invalid-api-key
// at module load time — before React mounts — and the whole app crashes.

let app, auth, db, storage;

if (isFirebaseConfigured) {
  app     = initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;
