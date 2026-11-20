import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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

/**
 * Local-only dev mode: `npm run dev:local` skips sign-in and keeps everything on this computer.
 * Never active in a production build.
 */
export const LOCAL_UID = "local-dev";
export const LOCAL_MODE = import.meta.env.DEV && import.meta.env.VITE_LOCAL_ONLY === "1";
const LOCAL_USER = { uid: LOCAL_UID, email: "", emailVerified: true, displayName: "Local test" } as unknown as User;

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
    () => {
      if (LOCAL_MODE) {
        setState({ ready: true, user: LOCAL_USER, profile: { uid: LOCAL_UID, email: "", name: "Local test", role: "parent" } });
        return;
      }
      return onAuthStateChanged(auth, async (user) => {
        if (!user) return setState({ ready: true, user: null, profile: null });
        setState({ ready: true, user, profile: await loadProfile(user) });
      });
    },
    []
  );

  const refresh = async () => {
    const u = auth.currentUser;
    if (!u) return;
    await u.reload();
    setState({ ready: true, user: auth.currentUser, profile: await loadProfile(u) });
  };

  return <Ctx.Provider value={{ ...state, refresh, logout: () => signOut(auth) }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
