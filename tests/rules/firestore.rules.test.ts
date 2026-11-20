// Security rules tests. Run with:  npm run test:rules   (needs Java for the emulator)
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, setLogLevel, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;

const as = {
  mia: () => env.authenticatedContext("mia", { email: "mia@parent.test", email_verified: true }).firestore(),
  sam: () => env.authenticatedContext("sam", { email: "sam@parent.test", email_verified: true }).firestore(),
  anon: () => env.unauthenticatedContext().firestore()
};

/** Exactly what the v2 app writes when someone registers (legacy/js/auth.js). */
const v2Profile = { name: "Mia", email: "mia@parent.test", role: "parent", createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
const match = { id: "m1", sport: "hockey", events: [], setup: { ourTeam: "U14A", opponent: "Rivals" } };

beforeAll(async () => {
  setLogLevel("error");
  env = await initializeTestEnvironment({
    projectId: "demo-matchiq",
    firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") }
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users/mia"), { name: "Mia", email: "mia@parent.test", role: "parent" });
    await setDoc(doc(ctx.firestore(), "users/mia/matches/old1"), { ...match, id: "old1" });
    await setDoc(doc(ctx.firestore(), "users/mia/matchesV3/m1"), match);
  });
});

describe("profiles", () => {
  it("a new user can create their own profile as a parent (v2 and v3 sign-up)", async () => {
    await assertSucceeds(setDoc(doc(as.sam(), "users/sam"), { ...v2Profile, name: "Sam", email: "sam@parent.test" }));
  });
  it("nobody can sign themselves up as administrator or coach", async () => {
    await assertFails(setDoc(doc(as.sam(), "users/sam"), { ...v2Profile, role: "administrator" }));
    await assertFails(setDoc(doc(as.sam(), "users/sam"), { ...v2Profile, role: "coach" }));
  });
  it("a user can update their name but not their role", async () => {
    await assertSucceeds(updateDoc(doc(as.mia(), "users/mia"), { name: "Mia B" }));
    await assertFails(updateDoc(doc(as.mia(), "users/mia"), { role: "administrator" }));
  });
  it("profiles are private", async () => {
    await assertSucceeds(getDoc(doc(as.mia(), "users/mia")));
    await assertFails(getDoc(doc(as.sam(), "users/mia")));
    await assertFails(getDoc(doc(as.anon(), "users/mia")));
  });
  it("nobody can create a profile for someone else", async () => {
    await assertFails(setDoc(doc(as.sam(), "users/other"), v2Profile));
  });
});

describe("matches", () => {
  for (const col of ["matches", "matchesV3"]) {
    it(`${col}: the owner can read, write and delete`, async () => {
      await assertSucceeds(getDocs(collection(as.mia(), `users/mia/${col}`)));
      await assertSucceeds(setDoc(doc(as.mia(), `users/mia/${col}/m2`), { ...match, id: "m2" }));
      await assertSucceeds(deleteDoc(doc(as.mia(), `users/mia/${col}/m2`)));
    });
    it(`${col}: other users and signed-out visitors get nothing`, async () => {
      await assertFails(getDocs(collection(as.sam(), `users/mia/${col}`)));
      await assertFails(setDoc(doc(as.sam(), `users/mia/${col}/x`), match));
      await assertFails(getDocs(collection(as.anon(), `users/mia/${col}`)));
    });
  }
  it("anything outside a user's own area is closed", async () => {
    await assertFails(setDoc(doc(as.mia(), "matches/x"), match));
    await assertFails(getDocs(collection(as.mia(), "users")));
  });
});
