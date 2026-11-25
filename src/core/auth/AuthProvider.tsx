import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { clearActive, IDLE_LIMIT_MS, isIdleTooLong, markActive } from "./idle";

export type Role = "administrator" | "coach" | "parent" | "scorer";

export interface Profile {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthState {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState>({ ready: false, user: null, profile: null, refresh: async () => {}, logout: async () => {} });

async function loadProfile(user: User): Promise<Profile> {
  const fallback: Profile = { uid: user.uid, email: user.email ?? "", name: user.displayName ?? user.email ?? "", role: "parent" };
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return fallback;
    const d = snap.data() as Partial<Profile>;
    return { ...fallback, name: d.name ?? fallback.name, role: (d.role as Role) ?? "parent" };
  } catch {
    // Offline and not cached yet: carry on with what Firebase Auth knows.
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refresh" | "logout">>({ ready: false, user: null, profile: null });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) return setState({ ready: true, user: null, profile: null });
        // Opened after 12 hours without use: sign out before showing anything.
        if (isIdleTooLong()) { clearActive(); await signOut(auth); return; }
        markActive();
        setState({ ready: true, user, profile: await loadProfile(user) });
      }),
    []
  );

  // Track use while signed in, and log out if the app sat open but untouched for 12 hours.
  const signedIn = !!state.user;
  useEffect(() => {
    if (!signedIn) return;
    const active = () => markActive();
    const check = () => { if (isIdleTooLong()) { clearActive(); signOut(auth); } };
    const onShow = () => { if (document.visibilityState === "visible") check(); };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, active, { passive: true }));
    document.addEventListener("visibilitychange", onShow);
    const timer = window.setInterval(check, Math.min(5 * 60 * 1000, IDLE_LIMIT_MS));
    return () => {
      events.forEach((e) => window.removeEventListener(e, active));
      document.removeEventListener("visibilitychange", onShow);
      window.clearInterval(timer);
    };
  }, [signedIn]);

  const logout = async () => { clearActive(); await signOut(auth); };

  const refresh = async () => {
    const u = auth.currentUser;
    if (!u) return;
    await u.reload();
    setState({ ready: true, user: auth.currentUser, profile: await loadProfile(u) });
  };

  return <Ctx.Provider value={{ ...state, refresh, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
