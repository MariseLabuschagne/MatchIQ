import type { Match } from "../types";
import { deleteCloud, pullMatches, pushMatch } from "./cloud";
import { deleteLocal, getLocal, markSynced, saveLocal } from "./local";

/**
 * Every tap is saved on the phone first (IndexedDB), so nothing is lost without signal.
 * Cloud copies are pushed a few seconds later; Firestore's own offline cache queues
 * the write until the phone is online again.
 */

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const PUSH_DELAY_MS = 4000;

export async function saveMatch(match: Match, uid: string | null, immediate = false): Promise<void> {
  await saveLocal(match, uid);
  if (!uid) return;
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

/** Bring cloud matches onto this phone (e.g. after signing in on a new device). Newer copy wins. */
export async function pullAll(uid: string): Promise<number> {
  const remote = await pullMatches(uid);
  let changed = 0;
  for (const m of remote) {
    const local = await getLocal(m.id);
    if (!local || local.updatedAt < m.updatedAt) {
      await saveLocal(m, uid, m.updatedAt);
      changed++;
    } else if (local.syncedAt !== local.updatedAt && local.updatedAt > m.updatedAt) {
      // Local copy is newer and was never pushed: push it now.
      pushMatch(uid, local).then(() => markSynced(local.id, local.updatedAt)).catch(() => {});
    }
  }
  return changed;
}

export async function removeMatch(id: string, uid: string | null): Promise<void> {
  await deleteLocal(id);
  if (uid) await deleteCloud(uid, id).catch((err) => console.warn("Cloud delete will retry later", err));
}
