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
      <button className="brand" onClick={() => navigate("/")} aria-label="MatchIQ home">
        <img src="./matchiq-logo.jpeg" alt="" />
        MatchIQ
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
