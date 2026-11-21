import Dexie, { type Table } from "dexie";
import type { Match, SportId } from "../types";

/** A match as kept on the phone. ownerUid ties it to the signed-in account. */
export interface StoredMatch extends Match {
  ownerUid: string | null;
  /** updatedAt of the last copy confirmed in Firestore, or null if never synced. */
  syncedAt: string | null;
}

class MatchDB extends Dexie {
  matches!: Table<StoredMatch, string>;
  constructor() {
    super("matchiq-v3");
    this.version(1).stores({ matches: "id, ownerUid, sport, status, updatedAt" });
  }
}

export const localDb = new MatchDB();

/** Lists on screen refresh when matches arrive in the background (cloud download, import of old matches). */
const CHANGED = "matchiq:local-changed";
const changed = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED)); };
export function onLocalChange(cb: () => void): () => void {
  window.addEventListener(CHANGED, cb);
  return () => window.removeEventListener(CHANGED, cb);
}

export async function saveLocal(match: Match, ownerUid: string | null, syncedAt?: string | null): Promise<void> {
  const existing = await localDb.matches.get(match.id);
  await localDb.matches.put({ ...match, ownerUid, syncedAt: syncedAt !== undefined ? syncedAt : existing?.syncedAt ?? null });
  changed();
}

export function getLocal(id: string): Promise<StoredMatch | undefined> {
  return localDb.matches.get(id);
}

export async function listLocal(ownerUid: string | null, sport?: SportId): Promise<StoredMatch[]> {
  const rows = await localDb.matches.filter((m) => (m.ownerUid ?? null) === ownerUid).toArray();
  return rows
    .filter((m) => !sport || m.sport === sport)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteLocal(id: string): Promise<void> {
  await localDb.matches.delete(id);
  changed();
}

export async function markSynced(id: string, updatedAt: string): Promise<void> {
  await localDb.matches.update(id, { syncedAt: updatedAt });
}

/** Removes a squad's matches from this phone (after leaving it or being removed). */
export async function dropSquadLocal(squadId: string, ownerUid: string): Promise<void> {
  await localDb.matches.filter((m) => m.squadId === squadId && m.ownerUid === ownerUid).delete();
  changed();
}
