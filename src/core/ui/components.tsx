import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Insight } from "../types";
import { useAuth } from "../auth/AuthProvider";
import { navigate } from "../router";
import { initials } from "../names";
import { BackIcon, ChevronDownIcon, DataSaverIcon, LogOutIcon, SendIcon, ShieldIcon, TeamsIcon } from "./icons-nav";
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
 * Page bar inside a page (the app shell holds the brand, navigation and profile).
 * Pages that pass `right` get a back link and their own controls, e.g. Live / Points / Report.
 * Older calls with no controls render nothing.
 */
export function Topbar({ right, back = "/matches", backLabel = "Match history" }: { right?: ReactNode; home?: boolean; back?: string; backLabel?: string }) {
  if (!right) return null;
  return (
    <div className="page-bar">
      <button className="back-link" onClick={() => navigate(back)}><BackIcon /> {backLabel}</button>
      <div className="page-bar-right">{right}</div>
    </div>
  );
}

/** Back link at the top of a page. */
export function BackLink({ to, label }: { to: string; label: string }) {
  return <button className="back-link" onClick={() => navigate(to)}><BackIcon /> {label}</button>;
}

/** Page title block, as in CourtOrder: big title, short subtitle, actions on the right. */
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function useDataSaver(): boolean {
  const [on, setOn] = useState(isDataSaver());
  useEffect(() => onDataSaverChange(() => setOn(isDataSaver())), []);
  return on;
}

/** "COACH · PARENT", "ADMINISTRATOR"; empty until known. Loaded once per sign-in. */
let rolesCache: { uid: string; label: string } | null = null;
export function useRoleLabel(): string {
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

/**
 * Profile button with a dropdown menu, as in CourtOrder: initials, name and role; the menu holds
 * who is signed in, teams, the data saver and log out.
 */
export function ProfileButton({ compact = false }: { compact?: boolean }) {
  const { user, profile, logout } = useAuth();
  const online = useOnline();
  const saver = useDataSaver();
  const role = useRoleLabel();
  const [open, setOpen] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!open || !uid) return;
    const load = () => waitingToSend(uid).then((l) => setWaiting(l.length)).catch(() => setWaiting(0));
    load();
    return onDataSaverChange(load);
  }, [open, uid]);

  useEffect(() => {
    if (!open) return;
    // A tap outside only closes the menu (as in CourtOrder); it doesn't also press what's underneath.
    const swallow = (e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); };
    const away = (e: PointerEvent) => {
      if (wrap.current?.contains(e.target as Node)) return;
      setOpen(false);
      document.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => document.removeEventListener("click", swallow, { capture: true }), 400);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const shut = () => setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    window.addEventListener("hashchange", shut);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); window.removeEventListener("hashchange", shut); };
  }, [open]);

  if (!user) return null;
  const name = profile?.name || user.displayName || user.email || "";
  const tag = !online ? "Offline" : saver ? "Data saver" : "";
  const go = (to: string) => { setOpen(false); navigate(to); };

  return (
    <div className="profile-wrap" ref={wrap}>
      <button className={`profile-btn${compact ? " compact" : ""}`} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        aria-label={`Your profile menu: ${name}${role ? `, ${role}` : ""}${tag ? `. ${tag} on` : ""}`}>
        {tag && <span className="status-tag">{tag}</span>}
        <span className="avatar">{initials(name, user.email)}</span>
        {!compact && (
          <span className="profile-text">
            <span className="profile-name">{name}</span>
            {role && <span className="profile-role">{role}</span>}
          </span>
        )}
        <span className="profile-chev"><ChevronDownIcon /></span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-label">
            <span className="menu-name">{name}</span>
            <span className="menu-email">{user.email}</span>
            {profile?.role === "administrator" && <span className="menu-admin"><ShieldIcon size={13} /> App administrator</span>}
          </div>
          <div className="menu-sep" />
          <button className="menu-item" role="menuitem" onClick={() => go("/teams")}><TeamsIcon /> Teams &amp; players</button>
          <label className="menu-item menu-switch" role="menuitemcheckbox" aria-checked={saver}>
            <DataSaverIcon />
            <span className="menu-grow">Data saver<span className="menu-hint">Send matches when they end, not during play.</span></span>
            <input type="checkbox" className="switch" checked={saver} onChange={(e) => setDataSaver(e.target.checked, uid)} />
          </label>
          {waiting > 0 && (
            <button className="menu-item" role="menuitem" disabled={busy || !online}
              onClick={async () => { if (!uid) return; setBusy(true); try { await sendWaiting(uid); } finally { setBusy(false); } }}>
              <SendIcon /> {busy ? "Sending…" : online ? `Send ${waiting} waiting ${waiting === 1 ? "match" : "matches"}` : `${waiting} waiting · send when online`}
            </button>
          )}
          <div className="menu-sep" />
          <button className="menu-item" role="menuitem" onClick={() => { setOpen(false); logout(); }}><LogOutIcon /> Log out</button>
        </div>
      )}
    </div>
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
