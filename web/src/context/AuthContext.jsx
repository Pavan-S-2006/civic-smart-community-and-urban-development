import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthState, getUserProfile } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // If Firebase is not configured, skip auth subscription and treat as logged out
    if (!isFirebaseConfigured) {
      setUser(null);
      return;
    }

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const prof = await getUserProfile(firebaseUser.uid);
        setProfile(prof);
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
