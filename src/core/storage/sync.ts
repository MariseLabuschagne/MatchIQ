import { isDenied, listMySquads } from "../squads";
import type { Match } from "../types";
import { deleteCloud, pullMatches, pullSquadMatches, pushMatch } from "./cloud";
import { deleteLocal, dropSquadLocal, getLocal, listLocal, markSynced, saveLocal } from "./local";

/**
 * Every tap is saved on the phone first (IndexedDB), so nothing is lost without signal.
 * Cloud copies are pushed a few seconds later; Firestore's own offline cache queues
 * the write until the phone is online again.
 */

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const PUSH_DELAY_MS = 4000;

/**
 * Data saver: while it is on, a match in progress stays on this phone only and is sent once,
 * when it ends (or when data saver is switched off, or "Send now" is tapped). Saves mobile data
 * and avoids constant retries on a weak signal. Per phone.
 */
const SAVER_KEY = "matchiq.dataSaver";
const saverListeners = new Set<() => void>();
export function isDataSaver(): boolean {
  try { return localStorage.getItem(SAVER_KEY) === "1"; } catch { return false; }
}
export function onDataSaverChange(cb: () => void): () => void {
  saverListeners.add(cb);
  return () => saverListeners.delete(cb);
}
export async function setDataSaver(on: boolean, uid: string | null): Promise<void> {
  try { localStorage.setItem(SAVER_KEY, on ? "1" : "0"); } catch { /* private mode */ }
  saverListeners.forEach((cb) => cb());
  if (!on && uid) await sendWaiting(uid);
}

/** Matches on this phone with changes the cloud hasn't got yet. */
export async function waitingToSend(uid: string): Promise<Match[]> {
  return (await listLocal(uid)).filter((m) => m.syncedAt !== m.updatedAt);
}

/** Send everything waiting, e.g. once back on wifi. */
export async function sendWaiting(uid: string): Promise<number> {
  const list = await waitingToSend(uid);
  await Promise.all(list.map((m) => pushMatch(uid, m).then(() => markSynced(m.id, m.updatedAt))));
  saverListeners.forEach((cb) => cb());
  return list.length;
}

const holdBack = (m: Match) => isDataSaver() && m.status !== "completed";

export async function saveMatch(match: Match, uid: string | null, immediate = false): Promise<void> {
  await saveLocal(match, uid);
  if (!uid || holdBack(match)) return;
  const prev = timers.get(match.id);
  if (prev) clearTimeout(prev);
  const run = () => {
    timers.delete(match.id);
    pushMatch(uid, match)
      .then(() => markSynced(match.id, match.updatedAt))
      .catch((err) => console.warn("Cloud save will retry later", err));
  };
  if (immediate) run();
  else timers.set(match.id, setTimeout(run, PUSH_DELAY_MS));
}

async function merge(uid: string, remote: Match[]): Promise<number> {
  let changed = 0;
  for (const m of remote) {
    const local = await getLocal(m.id);
    // A phone shared by two people in the same team holds one copy per match. A copy that is
    // safely in the cloud moves to whoever is signed in now; unsynced work is never overwritten.
    const otherOwnersSyncedCopy = local && local.ownerUid !== uid && local.syncedAt === local.updatedAt;
    if (!local || local.updatedAt < m.updatedAt || otherOwnersSyncedCopy) {
      await saveLocal(m, uid, m.updatedAt);
      changed++;
    } else if (local.syncedAt !== local.updatedAt && local.updatedAt > m.updatedAt && !holdBack(local)) {
      // Local copy is newer and was never pushed: push it now.
      pushMatch(uid, local).then(() => markSynced(local.id, local.updatedAt)).catch(() => {});
    }
  }
  return changed;
}

/**
 * Bring cloud matches onto this phone: this person's own, and those of every team or player
 * they are in. Newer copy wins. If they were removed from a squad, its matches leave this phone.
 */
export async function pullAll(uid: string): Promise<number> {
  let changed = await merge(uid, await pullMatches(uid));
  for (const s of await listMySquads(uid)) {
    try {
      changed += await merge(uid, await pullSquadMatches(s.id));
    } catch (err) {
      if (isDenied(err)) await dropSquadLocal(s.id, uid);
      else throw err;
    }
  }
  return changed;
}

export async function removeMatch(id: string, uid: string | null): Promise<void> {
  const m = await getLocal(id);
  await deleteLocal(id);
  if (uid && m) await deleteCloud(uid, m).catch((err) => console.warn("Cloud delete will retry later", err));
}
