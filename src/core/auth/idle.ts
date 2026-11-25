/**
 * Log out after 12 hours without use (no taps, clicks or keys), so a borrowed or shared phone
 * doesn't stay signed in. Matches stay saved on the device; anything waiting to send goes up
 * after the next sign-in.
 */
export const IDLE_LIMIT_MS = 12 * 60 * 60 * 1000;
const KEY = "matchiq.lastActive";

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ }
};

/** True if this device was last used more than 12 hours ago. No record yet counts as just now. */
export function isIdleTooLong(now = Date.now()): boolean {
  const last = Number(read(KEY));
  return !!last && now - last > IDLE_LIMIT_MS;
}

let lastWrite = 0;
/** Note that someone used the app. Written at most once a minute. */
export function markActive(now = Date.now()) {
  if (now - lastWrite < 60_000 && read(KEY)) return;
  lastWrite = now;
  write(KEY, String(now));
}

/** Forget the activity record on sign-out, so the next sign-in starts fresh. */
export function clearActive() {
  lastWrite = 0;
  write(KEY, null);
  // Tidy up the notice older builds left behind.
  write("matchiq.idleLoggedOut", null);
}
