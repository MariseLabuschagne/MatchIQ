import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

/**
 * Where a match lives in the cloud:
 *   shared with a team or player  → squads/{squadId}/matches/{id}  (every member can see it)
 *   only mine                     → users/{uid}/matchesV3/{id}
 * The v2 app's users/{uid}/matches is never written.
 */
const V3 = "matchesV3";
const LEGACY = "matches";

/** Firestore rejects undefined values; a JSON round trip drops them. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const matchRef = (uid: string, match: Pick<Match, "id" | "squadId">) =>
  match.squadId ? doc(db, "squads", match.squadId, "matches", match.id) : doc(db, "users", uid, V3, match.id);

export async function pushMatch(uid: string, match: Match): Promise<void> {
  await setDoc(matchRef(uid, match), clean(match));
}

export async function pullMatches(uid: string): Promise<Match[]> {
  const snap = await getDocs(collection(db, "users", uid, V3));
  return snap.docs.map((d) => d.data() as Match);
}

export async function pullSquadMatches(squadId: string): Promise<Match[]> {
  const snap = await getDocs(collection(db, "squads", squadId, "matches"));
  return snap.docs.map((d) => d.data() as Match);
}

export async function deleteCloud(uid: string, match: Pick<Match, "id" | "squadId">): Promise<void> {
  await deleteDoc(matchRef(uid, match));
}

/** Read v2 matches for conversion. Returns raw documents; see sports/hockey/legacy.ts. */
export async function pullLegacyMatches(uid: string): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(collection(db, "users", uid, LEGACY));
  return snap.docs.map((d) => d.data());
}
