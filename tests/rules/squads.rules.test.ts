// Sharing rules: teams (hockey) and players (tennis). Run with: npm run test:rules
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, setLogLevel, updateDoc, writeBatch } from "firebase/firestore";

let env: RulesTestEnvironment;
const user = (uid: string, verified = true) => env.authenticatedContext(uid, { email: `${uid}@test.local`, email_verified: verified }).firestore();
const coach = () => user("coach");
const parent = () => user("parent");
const stranger = () => user("stranger");

const SQ = "sq1";
const CODE = "ABC234";
const now = "2026-11-21T08:00:00.000Z";
const match = (by: string, id = "m1") => ({ id, sport: "hockey", squadId: SQ, createdBy: by, events: [], setup: { ourTeam: "U14A", opponent: "Rivals" } });

beforeAll(async () => {
  setLogLevel("error");
  env = await initializeTestEnvironment({
    projectId: "demo-matchiq-squads",
    firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") }
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `squads/${SQ}`), { sport: "hockey", name: "U14A", coachUid: "coach", joinCode: CODE, createdAt: now });
    await setDoc(doc(db, `squads/${SQ}/members/coach`), { uid: "coach", name: "Coach", role: "coach", admin: true, joinedAt: now });
    await setDoc(doc(db, `squads/${SQ}/members/parent`), { uid: "parent", name: "Parent", role: "parent", admin: false, joinedAt: now, code: CODE });
    await setDoc(doc(db, "users/boss"), { name: "Boss", role: "administrator" });
    await setDoc(doc(db, "users/stranger"), { name: "Stranger", role: "parent" });
    await setDoc(doc(db, `squads/${SQ}/matches/m1`), match("parent"));
    await setDoc(doc(db, `joinCodes/${CODE}`), { squadId: SQ, sport: "hockey", name: "U14A" });
  });
});

describe("creating a team or player", () => {
  it("anyone verified can create one, in any role, and becomes its administrator", async () => {
    const db = user("newcoach");
    const b = writeBatch(db);
    b.set(doc(db, "squads/sq2"), { sport: "tennis", name: "Mia", coachUid: "newcoach", joinCode: "XYZ789", createdAt: now });
    b.set(doc(db, "squads/sq2/members/newcoach"), { uid: "newcoach", name: "New", role: "parent", admin: true, joinedAt: now });
    b.set(doc(db, "joinCodes/XYZ789"), { squadId: "sq2", sport: "tennis", name: "Mia" });
    await assertSucceeds(b.commit());
  });
  it("nobody can create one for someone else, or without a verified email", async () => {
    await assertFails(setDoc(doc(stranger(), "squads/sq3"), { sport: "hockey", name: "X", coachUid: "coach", joinCode: "AAAAAA", createdAt: now }));
    await assertFails(setDoc(doc(user("unverified", false), "squads/sq3"), { sport: "hockey", name: "X", coachUid: "unverified", joinCode: "AAAAAA", createdAt: now }));
  });
  it("nobody can make themselves coach of an existing team", async () => {
    await assertFails(setDoc(doc(stranger(), `squads/${SQ}/members/stranger`), { uid: "stranger", name: "S", role: "coach", admin: true, joinedAt: now }));
    await assertFails(setDoc(doc(stranger(), `squads/${SQ}/members/stranger`), { uid: "stranger", name: "S", role: "coach", admin: false, joinedAt: now, code: CODE }));
    await assertFails(setDoc(doc(stranger(), `squads/${SQ}/members/stranger`), { uid: "stranger", name: "S", role: "parent", admin: true, joinedAt: now, code: CODE }));
  });
  it("nobody can point a join code at someone else's team", async () => {
    await assertFails(setDoc(doc(stranger(), "joinCodes/QQQQQQ"), { squadId: SQ, sport: "hockey", name: "U14A" }));
  });
});

describe("joining with a code", () => {
  it("a code can be looked up, but codes cannot be listed", async () => {
    await assertSucceeds(getDoc(doc(stranger(), `joinCodes/${CODE}`)));
    await assertFails(getDocs(collection(stranger(), "joinCodes")));
  });
  it("the right code lets someone join as a parent or player, or ask to be coach", async () => {
    await assertSucceeds(setDoc(doc(stranger(), `squads/${SQ}/members/stranger`), { uid: "stranger", name: "S", role: "parent", admin: false, joinedAt: now, code: CODE }));
    await assertSucceeds(setDoc(doc(user("p2"), `squads/${SQ}/members/p2`), { uid: "p2", name: "P", role: "player", admin: false, joinedAt: now, code: CODE }));
    await assertSucceeds(setDoc(doc(user("c2"), `squads/${SQ}/members/c2`), { uid: "c2", name: "C", role: "parent", admin: false, requested: "coach", joinedAt: now, code: CODE }));
  });
  it("a wrong or old code does not", async () => {
    await assertFails(setDoc(doc(stranger(), `squads/${SQ}/members/stranger`), { uid: "stranger", name: "S", role: "parent", admin: false, joinedAt: now, code: "WRONG1" }));
  });
  it("nobody can add someone else", async () => {
    await assertFails(setDoc(doc(stranger(), `squads/${SQ}/members/other`), { uid: "other", name: "O", role: "parent", admin: false, joinedAt: now, code: CODE }));
  });
});

describe("seeing and capturing matches", () => {
  it("members see the team and its matches; others see nothing", async () => {
    await assertSucceeds(getDoc(doc(parent(), `squads/${SQ}`)));
    await assertSucceeds(getDocs(collection(parent(), `squads/${SQ}/matches`)));
    await assertSucceeds(getDocs(collection(coach(), `squads/${SQ}/members`)));
    await assertFails(getDoc(doc(stranger(), `squads/${SQ}`)));
    await assertFails(getDocs(collection(stranger(), `squads/${SQ}/matches`)));
    await assertFails(getDocs(collection(stranger(), `squads/${SQ}/members`)));
  });
  it("coach and parents can capture matches, as themselves", async () => {
    await assertSucceeds(setDoc(doc(coach(), `squads/${SQ}/matches/m2`), match("coach", "m2")));
    await assertSucceeds(updateDoc(doc(coach(), `squads/${SQ}/matches/m1`), { events: [{ id: "e1" }] }));
    await assertFails(setDoc(doc(parent(), `squads/${SQ}/matches/m3`), match("coach", "m3")));
    await assertFails(setDoc(doc(stranger(), `squads/${SQ}/matches/m4`), match("stranger", "m4")));
  });
  it("a match cannot be moved to another team or re-attributed", async () => {
    await assertFails(updateDoc(doc(coach(), `squads/${SQ}/matches/m1`), { createdBy: "coach" }));
    await assertFails(updateDoc(doc(coach(), `squads/${SQ}/matches/m1`), { squadId: "other" }));
  });
  it("only whoever captured a match, a coach or an administrator can delete it", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, `squads/${SQ}/members/parent2`), { uid: "parent2", name: "P2", role: "parent", admin: false, joinedAt: now, code: CODE });
      await setDoc(doc(db, `squads/${SQ}/members/coach2`), { uid: "coach2", name: "C2", role: "coach", admin: false, joinedAt: now, code: CODE });
    });
    const reset = () => env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), `squads/${SQ}/matches/m1`), match("parent")));
    await assertFails(deleteDoc(doc(user("parent2"), `squads/${SQ}/matches/m1`)));
    await assertSucceeds(deleteDoc(doc(parent(), `squads/${SQ}/matches/m1`)));
    await reset();
    await assertSucceeds(deleteDoc(doc(user("coach2"), `squads/${SQ}/matches/m1`)));
    await reset();
    await assertSucceeds(deleteDoc(doc(coach(), `squads/${SQ}/matches/m1`)));
  });
});

describe("managing the team", () => {
  it("an administrator can remove a parent, who then loses access", async () => {
    await assertSucceeds(deleteDoc(doc(coach(), `squads/${SQ}/members/parent`)));
    await assertFails(getDocs(collection(parent(), `squads/${SQ}/matches`)));
  });
  it("parents cannot remove others, but can leave", async () => {
    await assertFails(deleteDoc(doc(parent(), `squads/${SQ}/members/coach`)));
    await assertSucceeds(deleteDoc(doc(parent(), `squads/${SQ}/members/parent`)));
  });
  it("only administrators can rename the team or change its code, and nobody can take it over", async () => {
    await assertSucceeds(updateDoc(doc(coach(), `squads/${SQ}`), { name: "U14 A" }));
    await assertFails(updateDoc(doc(parent(), `squads/${SQ}`), { name: "Mine" }));
    await assertFails(updateDoc(doc(coach(), `squads/${SQ}`), { coachUid: "parent" }));
  });
  it("an administrator can swap the join code", async () => {
    const db = coach();
    const b = writeBatch(db);
    b.update(doc(db, `squads/${SQ}`), { joinCode: "NEW234" });
    b.delete(doc(db, `joinCodes/${CODE}`));
    b.set(doc(db, "joinCodes/NEW234"), { squadId: SQ, sport: "hockey", name: "U14A" });
    await assertSucceeds(b.commit());
  });
  it("each person's list of teams is private", async () => {
    await assertSucceeds(setDoc(doc(parent(), `users/parent/squads/${SQ}`), { sport: "hockey", name: "U14A", role: "parent" }));
    await assertFails(getDocs(collection(stranger(), "users/parent/squads")));
  });
});

describe("roles and administrators", () => {
  const coachRequest = () => env.withSecurityRulesDisabled(async (ctx) =>
    setDoc(doc(ctx.firestore(), `squads/${SQ}/members/c2`), { uid: "c2", name: "C", role: "parent", admin: false, requested: "coach", joinedAt: now, code: CODE }));

  it("an administrator approves a coach request; the person cannot approve it themselves", async () => {
    await coachRequest();
    await assertFails(updateDoc(doc(user("c2"), `squads/${SQ}/members/c2`), { role: "coach", requested: null }));
    await assertFails(updateDoc(doc(parent(), `squads/${SQ}/members/c2`), { role: "coach", requested: null }));
    await assertSucceeds(updateDoc(doc(coach(), `squads/${SQ}/members/c2`), { role: "coach", requested: null }));
  });
  it("people can switch themselves between parent and player, or ask to be coach", async () => {
    await assertSucceeds(updateDoc(doc(parent(), `squads/${SQ}/members/parent`), { role: "player" }));
    await assertSucceeds(updateDoc(doc(parent(), `squads/${SQ}/members/parent`), { requested: "coach" }));
    await assertFails(updateDoc(doc(parent(), `squads/${SQ}/members/parent`), { role: "coach" }));
    await assertFails(updateDoc(doc(parent(), `squads/${SQ}/members/parent`), { admin: true }));
  });
  it("an administrator can make someone else an administrator", async () => {
    await assertSucceeds(updateDoc(doc(coach(), `squads/${SQ}/members/parent`), { admin: true }));
    // ...who can then manage the team too.
    await assertSucceeds(updateDoc(doc(parent(), `squads/${SQ}`), { name: "U14 A" }));
  });
  it("a parent who created the team is its administrator, and a coach joins later", async () => {
    const db = user("mum");
    const b = writeBatch(db);
    b.set(doc(db, "squads/sq9"), { sport: "hockey", name: "U12", coachUid: "mum", joinCode: "MUM234", createdAt: now });
    b.set(doc(db, "squads/sq9/members/mum"), { uid: "mum", name: "Mum", role: "parent", admin: true, joinedAt: now });
    b.set(doc(db, "joinCodes/MUM234"), { squadId: "sq9", sport: "hockey", name: "U12" });
    await assertSucceeds(b.commit());
    await assertSucceeds(setDoc(doc(user("realcoach"), "squads/sq9/members/realcoach"), { uid: "realcoach", name: "Coach", role: "parent", admin: false, requested: "coach", joinedAt: now, code: "MUM234" }));
    await assertSucceeds(updateDoc(doc(user("mum"), "squads/sq9/members/realcoach"), { role: "coach", requested: null }));
  });
  it("nobody can remove the creator, and the creator cannot leave", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), `squads/${SQ}/members/parent`), { uid: "parent", name: "Parent", role: "parent", admin: true, joinedAt: now }));
    await assertFails(deleteDoc(doc(parent(), `squads/${SQ}/members/coach`)));
    await assertFails(deleteDoc(doc(coach(), `squads/${SQ}/members/coach`)));
  });
  it("an app-wide administrator can see and manage every team; others cannot list teams", async () => {
    const boss = user("boss");
    await assertSucceeds(getDocs(collection(boss, "squads")));
    await assertSucceeds(getDocs(collection(boss, `squads/${SQ}/matches`)));
    await assertSucceeds(getDocs(collection(boss, `squads/${SQ}/members`)));
    await assertSucceeds(deleteDoc(doc(boss, `squads/${SQ}/members/parent`)));
    await assertFails(getDocs(collection(stranger(), "squads")));
    await assertFails(getDocs(collection(coach(), "squads")));
  });
  it("nobody can make themselves an app-wide administrator", async () => {
    await assertFails(updateDoc(doc(stranger(), "users/stranger"), { role: "administrator" }));
  });
});
