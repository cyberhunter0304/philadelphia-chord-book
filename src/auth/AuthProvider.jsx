import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth, firebaseConfigured, googleProvider } from "@/lib/firebase";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const handle = async (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setRole("user");
        return;
      }
      try {
        // /me records last-seen and returns the effective role (incl. bootstrap).
        const me = await api.me();
        setRole(me.role || "user");
        if (me.role === "admin") await u.getIdToken(true);
      } catch {
        try {
          const tok = await u.getIdTokenResult();
          setRole(tok.claims.role || "user");
        } catch {
          setRole("user");
        }
      }
    };

    let unsubAuth = () => {};
    let unsubToken = () => {};
    try {
      unsubAuth = onAuthStateChanged(auth, handle, () => setLoading(false));
      unsubToken = onIdTokenChanged(auth, async (u) => {
        if (!u) return;
        const tok = await u.getIdTokenResult();
        if (tok.claims.role) setRole(tok.claims.role);
      });
    } catch {
      setLoading(false);
    }
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  const value = {
    user,
    role,
    loading,
    configured: firebaseConfigured,
    isAdmin: role === "admin",
    isEditor: role === "admin" || role === "user",
    signIn: () => signInWithPopup(auth, googleProvider),
    signOut: () => fbSignOut(auth),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
