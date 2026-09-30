// Firebase configuration
// 🔑 Replace these values with your actual Firebase project credentials
// from: https://console.firebase.google.com → Project Settings → Your apps → SDK setup

export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "",
};

// True only when all required env vars are present
export const isFirebaseConfigured =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !!import.meta.env.VITE_FIREBASE_APP_ID;
