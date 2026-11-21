import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { SportId } from "./types";

/**
 * Sharing. A squad is a hockey team or a tennis player. Members see and capture its matches;
 * nobody else can (enforced in firestore.rules, not just here).
 *
 * Roles inside a squad (chosen when creating or joining):
 *   coach   can delete any match in the squad
 *   parent  can delete matches they captured
 *   player  same as parent (e.g. an older tennis player capturing their own matches)
 * Separately, some members are administrators: they manage the join code, people and roles.
 * Whoever creates the squad is its first administrator, whatever their role.
 * Joining as coach needs an administrator's approval: you join as a parent with requested: "coach".
 *
 * App-wide administrators (users/{uid}.role == "administrator", set in the Firebase console)
 * can see and manage every squad, for support.
 *
 *   squads/{id}                 name, sport, coachUid (the creator: always an administrator), joinCode
 *   squads/{id}/members/{uid}   role, admin, requested
 *   squads/{id}/matches/{id}    the shared matches
 *   joinCodes/{code}            lets a code be looked up without listing squads
 *   users/{uid}/squads/{id}     each person's own list of squads, so the app knows where to look
 */

export type SquadRole = "coach" | "parent" | "player";
export const ROLES: SquadRole[] = ["coach", "parent", "player"];
export const ROLE_LABEL: Record<SquadRole, string> = { coach: "Coach", parent: "Parent", player: "Player" };

export interface Squad {
  id: string;
  sport: SportId;
  name: string;
  /** Who created it. Named coachUid for older data; it means "creator", who is always an administrator. */
  coachUid: string;
  joinCode: string;
  createdAt: string;
}

export interface MySquad {
  id: string;
  sport: SportId;
  name: string;
  role: SquadRole;
  admin: boolean;
}

export interface Member {
  uid: string;
  name: string;
  role: SquadRole;
  admin?: boolean;
  /** Set when someone asked to be coach and an administrator hasn't answered yet. */
  requested?: "coach";
  joinedAt: string;
}

export interface CodeInfo {
  code: string;
  squadId: string;
  sport: SportId;
  name: string;
}

/** Administrators of a squad: anyone marked admin, plus its creator (squads made before roles existed). */
export const isSquadAdmin = (m: Pick<Member, "uid" | "admin"> | undefined, squad: Pick<Squad, "coachUid">) =>
  !!m && (m.admin === true || m.uid === squad.coachUid);

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

/** Create a team or player. The creator picks their own role and is its first administrator. */
export async function createSquad(sport: SportId, name: string, me: { uid: string; name: string }, role: SquadRole): Promise<MySquad> {
  const ref = doc(collection(db, "squads"));
  const now = new Date().toISOString();
  const code = newCode();
  const squad: Omit<Squad, "id"> = { sport, name, coachUid: me.uid, joinCode: code, createdAt: now };
  const b = writeBatch(db);
  b.set(ref, squad);
  b.set(memberRef(ref.id, me.uid), { uid: me.uid, name: me.name, role, admin: true, joinedAt: now });
  b.set(codeRef(code), { squadId: ref.id, sport, name });
  b.set(mineRef(me.uid, ref.id), { sport, name, role, admin: true });
  await b.commit();
  return { id: ref.id, sport, name, role, admin: true };
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

/**
 * Join with a code. Parents and players join as themselves. Choosing coach joins as a parent
 * with a request that an administrator approves.
 */
export async function joinSquad(info: CodeInfo, me: { uid: string; name: string }, choice: SquadRole): Promise<MySquad> {
  const role: SquadRole = choice === "coach" ? "parent" : choice;
  const member: Record<string, unknown> = { uid: me.uid, name: me.name, role, admin: false, joinedAt: new Date().toISOString(), code: info.code };
  if (choice === "coach") member.requested = "coach";
  const b = writeBatch(db);
  // The rules accept this only if `code` matches the squad's current join code.
  b.set(memberRef(info.squadId, me.uid), member);
  b.set(mineRef(me.uid, info.squadId), { sport: info.sport, name: info.name, role, admin: false });
  await b.commit();
  return { id: info.squadId, sport: info.sport, name: info.name, role, admin: false };
}

/**
 * The squads this person is in, with their current role (an administrator may have changed it).
 * Squads they have been removed from (or that were deleted) are dropped from their list here.
 */
export async function listMySquads(uid: string, sport?: SportId): Promise<MySquad[]> {
  const snap = await getDocs(collection(db, "users", uid, "squads"));
  const out: MySquad[] = [];
  for (const d of snap.docs) {
    const mine = { id: d.id, ...(d.data() as Omit<MySquad, "id">) };
    if (sport && mine.sport !== sport) continue;
    try {
      const [s, m] = await Promise.all([getDoc(squadRef(d.id)), getDoc(memberRef(d.id, uid))]);
      if (!s.exists() || !m.exists()) throw new Error("gone");
      const squad = s.data() as Squad, member = m.data() as Member;
      const fresh: MySquad = { id: d.id, sport: squad.sport, name: squad.name, role: member.role, admin: isSquadAdmin(member, squad) };
      if (fresh.name !== mine.name || fresh.role !== mine.role || fresh.admin !== mine.admin) {
        updateDoc(d.ref, { name: fresh.name, role: fresh.role, admin: fresh.admin }).catch(() => {});
      }
      out.push(fresh);
    } catch (err) {
      if (isDenied(err) || (err as Error).message === "gone") await deleteDoc(d.ref).catch(() => {});
      else out.push({ ...mine, admin: !!mine.admin, role: mine.role ?? "parent" }); // offline: keep showing what we knew
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** App-wide administrators only: every squad for a sport. */
export async function listAllSquads(sport: SportId): Promise<Squad[]> {
  const snap = await getDocs(query(collection(db, "squads"), where("sport", "==", sport)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Squad, "id">) })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSquad(id: string): Promise<Squad | null> {
  const s = await getDoc(squadRef(id));
  return s.exists() ? ({ id, ...(s.data() as Omit<Squad, "id">) }) : null;
}

const ORDER: Record<SquadRole, number> = { coach: 0, parent: 1, player: 2 };

export async function listMembers(id: string): Promise<Member[]> {
  const snap = await getDocs(collection(db, "squads", id, "members"));
  return snap.docs
    .map((d) => d.data() as Member)
    .sort((a, b) => (ORDER[a.role] ?? 3) - (ORDER[b.role] ?? 3) || a.name.localeCompare(b.name));
}

/** Administrators: change someone's role or administrator status. Answers a coach request either way. */
export async function updateMember(id: string, uid: string, patch: { role?: SquadRole; admin?: boolean; clearRequest?: boolean }): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.role) data.role = patch.role;
  if (patch.admin !== undefined) data.admin = patch.admin;
  if (patch.clearRequest || patch.role) data.requested = null;
  await updateDoc(memberRef(id, uid), data);
}

/**
 * Your own role. Anyone can switch between parent and player. Choosing coach asks an administrator,
 * unless you are one already.
 */
export async function setMyRole(id: string, uid: string, role: SquadRole, admin: boolean): Promise<void> {
  if (role === "coach" && !admin) await updateDoc(memberRef(id, uid), { requested: "coach" });
  else await updateDoc(memberRef(id, uid), { role, requested: null });
}

/** Administrators: take someone out of the squad. They lose access straight away. */
export async function removeMember(id: string, uid: string): Promise<void> {
  await deleteDoc(memberRef(id, uid));
}

export async function leaveSquad(id: string, uid: string): Promise<void> {
  await deleteDoc(memberRef(id, uid));
  await deleteDoc(mineRef(uid, id)).catch(() => {});
}

/** Administrators: replace the join code, e.g. after it was shared too widely. Existing members stay. */
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
