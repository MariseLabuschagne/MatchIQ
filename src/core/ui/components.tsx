import { useEffect, useState, type ReactNode } from "react";
import type { Insight } from "../types";
import { useAuth } from "../auth/AuthProvider";
import { navigate } from "../router";

export function useOnline(): boolean {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function Topbar({ right }: { right?: ReactNode }) {
  const { profile } = useAuth();
  const online = useOnline();
  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("/")}>
        <img src="./matchiq-logo.jpeg" alt="" />
        Home
      </button>
      {right ?? (
        <div className="who">
          <span className={`sync${online ? "" : " offline"}`}>{online ? "Online" : "Offline · saved on phone"}</span>
          {profile && <span>{profile.name}</span>}
        </div>
      )}
    </header>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        {children}
        <button className="link center" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export function Confirm({ title, body, confirmLabel, danger, onConfirm, onClose }: {
  title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <h2>{title}</h2>
      <p className="muted">{body}</p>
      <button className={`btn block ${danger ? "danger" : "primary"}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
    </Sheet>
  );
}

export function InsightList({ title, items, empty }: { title: string; items: Insight[]; empty?: string }) {
  if (!items.length && !empty) return null;
  return (
    <div className="insight-group">
      <h4>{title}</h4>
      <div className="insights">
        {items.length ? (
          items.map((i, n) => (
            <div key={n} className={`insight ${i.kind}`}>
              <div>
                <b>{i.title}</b>
                <span>{i.detail}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="muted small">{empty}</p>
        )}
      </div>
    </div>
  );
}

/** Ask the browser to keep the screen on during a live match. Silently ignored where unsupported. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState === "visible") navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

const MOVED_KEY = "matchiq.movedNoticeSeen";

/** Shown to people who arrive from the old GitHub Pages address (it redirects here with ?moved=1). */
export function MovedNotice() {
  const [show, setShow] = useState(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("moved") !== "1") return false;
      history.replaceState(null, "", location.pathname + location.hash);
      return !localStorage.getItem(MOVED_KEY);
    } catch {
      return false;
    }
  });
  if (!show) return null;
  const close = () => {
    try { localStorage.setItem(MOVED_KEY, "1"); } catch { /* private mode */ }
    setShow(false);
  };
  return (
    <div className="card moved-notice" role="status">
      <strong>MatchIQ has a new address</strong>
      <p>Sign in as usual and your matches come with you. If you added MatchIQ to your Home Screen, add this page again and remove the old icon.</p>
      <button className="btn small" onClick={close}>Got it</button>
    </div>
  );
}

/**
 * The maker's mark, as in CourtOrder: a light-grey "BUILT BY" beside the InAwe Solutions logo
 * in its own colours, with the version underneath. On the dark background the logo sits on a
 * small white tile so its navy lettering stays readable.
 */
export function BuiltBy({ onLight = false }: { onLight?: boolean }) {
  const built = new Date(__BUILD_DATE__).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className={`built-by${onLight ? " on-light" : ""}`}>
      <div className="built-by-row">
        <span>Built by</span>
        <img src="./inawe-logo.png" alt="InAwe Solutions" width="98" height="44" />
      </div>
      <p>MatchIQ v{__APP_VERSION__} · {built}</p>
    </div>
  );
}
