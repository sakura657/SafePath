import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

import { logOut, register, signIn, subscribeToAuthChanges } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signIn(email.trim(), password);
  };

  const registerWithEmail = async (email: string, password: string) => {
    await register(email.trim(), password);
  };

  const signOutUser = async () => {
    await logOut();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, signInWithEmail, registerWithEmail, signOut: signOutUser }),
    [user, initializing]
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
