import { createContext, useContext, useEffect, useState } from 'react';
import { listenAuth, signOut } from '../services/authService';
import { listenProfile } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase Auth user
  const [profile, setProfile] = useState(null); // users/{uid}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopProfile = null;
    const stopAuth = listenAuth((firebaseUser) => {
      if (stopProfile) stopProfile();
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      stopProfile = listenProfile(
        firebaseUser.uid,
        (data) => { setProfile(data); setLoading(false); },
        () => { setProfile(null); setLoading(false); }
      );
    });
    return () => {
      stopAuth();
      if (stopProfile) stopProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
