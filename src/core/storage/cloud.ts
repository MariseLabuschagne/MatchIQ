import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

/** New matches live in users/{uid}/matchesV3 so the v2 app's users/{uid}/matches stays untouched. */
const V3 = "matchesV3";
const LEGACY = "matches";

/** Firestore rejects undefined values; a JSON round trip drops them. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function pushMatch(uid: string, match: Match): Promise<void> {
  await setDoc(doc(db, "users", uid, V3, match.id), clean(match));
}

export async function pullMatches(uid: string): Promise<Match[]> {
  const snap = await getDocs(collection(db, "users", uid, V3));
  return snap.docs.map((d) => d.data() as Match);
}

export async function deleteCloud(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, V3, id));
}

/** Read v2 matches for conversion. Returns raw documents; see sports/hockey/legacy.ts. */
export async function pullLegacyMatches(uid: string): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(collection(db, "users", uid, LEGACY));
  return snap.docs.map((d) => d.data());
}
