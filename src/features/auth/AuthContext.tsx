import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { auth, firebaseEnabled } from '../../firebase/config';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: !firebaseEnabled,
      logout: async () => {
        if (auth) await signOut(auth);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
