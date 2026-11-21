import { useEffect, useState, type ReactNode } from "react";
import type { Insight } from "../types";
import { useAuth } from "../auth/AuthProvider";
import { navigate } from "../router";
import { initials } from "../names";
import { myRoles, ROLE_LABEL } from "../squads";
import { isDataSaver, onDataSaverChange, sendWaiting, setDataSaver, waitingToSend } from "../storage/sync";

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

/**
 * Top bar: "Home" on the left (not on the home page itself), and on the right either the page's
 * own controls (e.g. Live / Points / Report) or the profile: initials in a circle, full name,
 * and whether matches are being sent. Tapping the profile opens the profile sheet.
 */
export function Topbar({ right, home = false }: { right?: ReactNode; home?: boolean }) {
  return (
    <header className={`topbar${home ? " at-home" : ""}`}>
      {!home && <button className="home-link" onClick={() => navigate("/")}><span aria-hidden="true">‹</span> Home</button>}
      <div className="topbar-right">
        {right}
        <ProfileButton compact={!!right} />
      </div>
    </header>
  );
}

function useDataSaver(): boolean {
  const [on, setOn] = useState(isDataSaver());
  useEffect(() => onDataSaverChange(() => setOn(isDataSaver())), []);
  return on;
}

/** "COACH · PARENT", "ADMINISTRATOR"; empty until known. Loaded once per sign-in. */
let rolesCache: { uid: string; label: string } | null = null;
function useRoleLabel(): string {
  const { user, profile } = useAuth();
  const [label, setLabel] = useState(rolesCache && rolesCache.uid === user?.uid ? rolesCache.label : "");
  useEffect(() => {
    if (!user) return;
    if (profile?.role === "administrator") { setLabel("Administrator"); return; }
    myRoles(user.uid)
      .then((roles) => {
        const l = roles.length ? roles.map((r) => ROLE_LABEL[r]).join(" · ") : "Parent";
        rolesCache = { uid: user.uid, label: l };
        setLabel(l);
      })
      .catch(() => {});
  }, [user, profile?.role]);
  return label;
}

function ProfileButton({ compact }: { compact: boolean }) {
  const { user, profile } = useAuth();
  const online = useOnline();
  const saver = useDataSaver();
  const role = useRoleLabel();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const name = profile?.name || user.displayName || user.email || "";
  const tag = !online ? "Offline" : saver ? "Data saver" : "";
  return (
    <>
      <button className={`profile-btn${compact ? " compact" : ""}`} onClick={() => setOpen(true)} aria-label={`Your profile: ${name}${role ? `, ${role}` : ""}${tag ? `. ${tag} on` : ""}`}>
        {tag && <span className="status-tag">{tag}</span>}
        <span className="avatar">{initials(name, user.email)}</span>
        {!compact && (
          <span className="profile-text">
            <span className="profile-name">{name}</span>
            {role && <span className="profile-role">{role}</span>}
          </span>
        )}
      </button>
      {open && <ProfileSheet name={name} onClose={() => setOpen(false)} />}
    </>
  );
}

function ProfileSheet({ name, onClose }: { name: string; onClose: () => void }) {
  const { user, profile, logout } = useAuth();
  const saver = useDataSaver();
  const online = useOnline();
  const [waiting, setWaiting] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = user?.uid ?? null;
  useEffect(() => {
    if (!uid) return;
    const load = () => waitingToSend(uid).then((l) => setWaiting(l.length)).catch(() => setWaiting(null));
    load();
    return onDataSaverChange(load);
  }, [uid]);
  return (
    <Sheet onClose={onClose}>
      <div className="profile-head">
        <span className="avatar large">{initials(name, user?.email)}</span>
        <span>
          <strong>{name}</strong>
          <span className="muted small" style={{ display: "block" }}>{user?.email}</span>
          {profile?.role === "administrator" && <span className="badge">App administrator</span>}
        </span>
      </div>
      <label className="check">
        <span>
          Data saver
          <span className="muted small" style={{ display: "block" }}>Send matches when they end, not during play.</span>
        </span>
        <input type="checkbox" checked={saver} onChange={(e) => setDataSaver(e.target.checked, uid)} />
      </label>
      {waiting !== null && waiting > 0 && (
        <div className="message">
          {waiting} {waiting === 1 ? "match has" : "matches have"} changes waiting to send.{" "}
          <button className="link" disabled={busy || !online} onClick={async () => { if (!uid) return; setBusy(true); try { await sendWaiting(uid); } finally { setBusy(false); } }}>
            {busy ? "Sending…" : online ? "Send now" : "Send when back online"}
          </button>
        </div>
      )}
      <button className="btn block" onClick={() => { onClose(); logout(); }}>Sign out</button>
    </Sheet>
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
 * in its own colours on a clear background, with the version underneath.
 */
export function BuiltBy({ onLight = false }: { onLight?: boolean }) {
  const built = new Date(__BUILD_DATE__).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className={`built-by${onLight ? " on-light" : ""}`}>
      <div className="built-by-row">
        <span>Built by</span>
        <img src="./inawe-logo.png" alt="InAwe Solutions" width="98" height="44" />
      </div>
      <p>v{__APP_VERSION__} · {built}</p>
    </div>
  );
}
