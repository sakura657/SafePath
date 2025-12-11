import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

import { logOut, register, signIn, subscribeToAuthChanges } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isLocked: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  unlockApp: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isLocked, setIsLocked] = useState(false); // Default to false, set to true if user exists on init

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If user is logged in, lock the app initially
        // We only want to do this on the initial load or re-auth
        if (initializing) {
          setIsLocked(true);
        }
      } else {
        setIsLocked(false);
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signIn(email.trim(), password);
    setIsLocked(false); // Unlock on manual sign in
  };

  const registerWithEmail = async (email: string, password: string) => {
    await register(email.trim(), password);
    setIsLocked(false); // Unlock on registration
  };

  const signOutUser = async () => {
    await logOut();
    setIsLocked(false);
  };

  const unlockApp = () => {
    setIsLocked(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isLocked,
      signInWithEmail,
      registerWithEmail,
      signOut: signOutUser,
      unlockApp
    }),
    [user, initializing, isLocked]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
