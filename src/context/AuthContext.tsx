import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type UserAttributes = {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarKey?: string;
  avatarUrl?: string;
  email?: string;
};

type User = {
  id?: string;
  attributes: UserAttributes;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/webster/v1/profiles/me');
      if (res.ok) {
        const data = await res.json();
        const profile = data.data;
        // Also fetch email from accounts endpoint
        let email: string | undefined;
        try {
          const accRes = await fetch('/webster/v1/accounts/me');
          if (accRes.ok) {
            const accData = await accRes.json();
            email = accData.data?.attributes?.email;
          }
        } catch { /* ignore */ }

        setUser({
          id: profile.id,
          attributes: {
            username: profile.attributes?.username,
            // server returns avatar_url (snake_case) — map to avatarUrl
            avatarUrl: profile.attributes?.avatar_url,
            avatarKey: profile.attributes?.avatar_key,
            email,
          },
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
