import { collection, deleteDoc, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { SportId } from "./types";

/**
 * Sharing. A squad is a hockey team or a tennis player. Whoever creates it is its coach and
 * gets a join code; anyone who enters the code joins as a parent. Members see and capture the
 * squad's matches; nobody else can (enforced in firestore.rules, not just here).
 *
 *   squads/{id}                 name, sport, coachUid, joinCode
 *   squads/{id}/members/{uid}   who is in it (coach or parent)
 *   squads/{id}/matches/{id}    the shared matches
 *   joinCodes/{code}            lets a code be looked up without listing squads
 *   users/{uid}/squads/{id}     each person's own list of squads, so the app knows where to look
 */

export type SquadRole = "coach" | "parent";

export interface Squad {
  id: string;
  sport: SportId;
  name: string;
  coachUid: string;
  joinCode: string;
  createdAt: string;
}

export interface MySquad {
  id: string;
  sport: SportId;
  name: string;
  role: SquadRole;
}

export interface Member {
  uid: string;
  name: string;
  role: SquadRole;
  joinedAt: string;
}

export interface CodeInfo {
  code: string;
  squadId: string;
  sport: SportId;
  name: string;
}

/** No 0/O, 1/I/L, so codes read cleanly off a screen or a WhatsApp message. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const normaliseCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

const squadRef = (id: string) => doc(db, "squads", id);
const memberRef = (id: string, uid: string) => doc(db, "squads", id, "members", uid);
const mineRef = (uid: string, id: string) => doc(db, "users", uid, "squads", id);
const codeRef = (code: string) => doc(db, "joinCodes", code);

export async function createSquad(sport: SportId, name: string, me: { uid: string; name: string }): Promise<MySquad> {
  const ref = doc(collection(db, "squads"));
  const now = new Date().toISOString();
  const code = newCode();
  const squad: Omit<Squad, "id"> = { sport, name, coachUid: me.uid, joinCode: code, createdAt: now };
  const b = writeBatch(db);
  b.set(ref, squad);
  b.set(memberRef(ref.id, me.uid), { uid: me.uid, name: me.name, role: "coach", joinedAt: now });
  b.set(codeRef(code), { squadId: ref.id, sport, name });
  b.set(mineRef(me.uid, ref.id), { sport, name, role: "coach" });
  await b.commit();
  return { id: ref.id, sport, name, role: "coach" };
}

/** Look up a code before joining, so the person can see which team or player it is. */
export async function lookUpCode(raw: string): Promise<CodeInfo | null> {
  const code = normaliseCode(raw);
  if (code.length !== 6) return null;
  const snap = await getDoc(codeRef(code));
  if (!snap.exists()) return null;
  const d = snap.data() as Omit<CodeInfo, "code">;
  return { code, ...d };
}

export async function joinSquad(info: CodeInfo, me: { uid: string; name: string }): Promise<MySquad> {
  const b = writeBatch(db);
  // The rules accept this only if `code` matches the squad's current join code.
  b.set(memberRef(info.squadId, me.uid), { uid: me.uid, name: me.name, role: "parent", joinedAt: new Date().toISOString(), code: info.code });
  b.set(mineRef(me.uid, info.squadId), { sport: info.sport, name: info.name, role: "parent" });
  await b.commit();
  return { id: info.squadId, sport: info.sport, name: info.name, role: "parent" };
}

/**
 * The squads this person is in. Squads they have been removed from (or that were deleted)
 * no longer open, so they are dropped from their list here.
 */
export async function listMySquads(uid: string, sport?: SportId): Promise<MySquad[]> {
  const snap = await getDocs(collection(db, "users", uid, "squads"));
  const out: MySquad[] = [];
  for (const d of snap.docs) {
    const mine = { id: d.id, ...(d.data() as Omit<MySquad, "id">) };
    if (sport && mine.sport !== sport) continue;
    try {
      const s = await getDoc(squadRef(d.id));
      if (!s.exists()) throw new Error("gone");
      out.push({ ...mine, name: (s.data() as Squad).name });
    } catch (err) {
      if (isDenied(err) || (err as Error).message === "gone") await deleteDoc(d.ref).catch(() => {});
      else out.push(mine); // offline: keep showing what we knew
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSquad(id: string): Promise<Squad | null> {
  const s = await getDoc(squadRef(id));
  return s.exists() ? ({ id, ...(s.data() as Omit<Squad, "id">) }) : null;
}

export async function listMembers(id: string): Promise<Member[]> {
  const snap = await getDocs(collection(db, "squads", id, "members"));
  return snap.docs
    .map((d) => d.data() as Member)
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "coach" ? -1 : 1));
}

/** Coach only: take someone out of the squad. They lose access straight away. */
export async function removeMember(id: string, uid: string): Promise<void> {
  await deleteDoc(memberRef(id, uid));
}

export async function leaveSquad(id: string, uid: string): Promise<void> {
  await deleteDoc(memberRef(id, uid));
  await deleteDoc(mineRef(uid, id)).catch(() => {});
}

/** Coach only: replace the join code, e.g. after it was shared too widely. Existing members stay. */
export async function changeCode(squad: Squad): Promise<string> {
  const code = newCode();
  const b = writeBatch(db);
  b.update(squadRef(squad.id), { joinCode: code });
  b.delete(codeRef(squad.joinCode));
  b.set(codeRef(code), { squadId: squad.id, sport: squad.sport, name: squad.name });
  await b.commit();
  return code;
}

export function isDenied(err: unknown): boolean {
  return (err as { code?: string })?.code === "permission-denied";
}
