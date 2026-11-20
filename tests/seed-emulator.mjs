// Seeds the LOCAL emulators with a test parent and two old (v2) hockey matches. Never touches the real project.
// Run `npm run emulators` first, then this once, then `npm run dev:emulators`.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const AUTH = "http://127.0.0.1:9099";
const PROJECT = "matchiq-9f263";

const signUp = async (email, name) => {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "testpass123", displayName: name, returnSecureToken: true })
  });
  const { localId, error } = await res.json();
  if (error) throw new Error(`${email}: ${error.message} (already seeded? restart the emulators to start fresh)`);
  // MatchIQ asks people to confirm their email; mark the test account as confirmed.
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ localId, emailVerified: true })
  });
  return localId;
};

const uid = await signUp("parent@test.local", "Test Parent");

const env = await initializeTestEnvironment({
  projectId: PROJECT,
  firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") }
});

const ev = (n, eventType, period, matchSecond) => ({ id: `e${n}`, eventType, period, matchSecond, timestamp: new Date().toISOString() });

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, `users/${uid}`), { name: "Test Parent", email: "parent@test.local", role: "parent" });
  // Two matches in the v2 shape, to try the automatic import of old matches.
  await setDoc(doc(db, `users/${uid}/matches/v2-a`), {
    id: "v2-a", sport: "hockey", createdAt: "2026-08-02T09:00:00.000Z", completedAt: "2026-08-02T10:10:00.000Z",
    competition: "League", ourTeam: "U14A", opponent: "Northside", venue: "Home", format: "4", periodLength: "15",
    events: [
      ev(1, "entryTopD", "Q1", 120), ev(2, "shotOnTarget", "Q1", 130), ev(3, "goalScored", "Q1", 135),
      ev(4, "entryLeft", "Q2", 300), ev(5, "entryPenaltyCorner", "Q2", 310), ev(6, "pcSaved", "Q2", 330),
      ev(7, "defenceEntryRight", "Q3", 200), ev(8, "goalConceded", "Q3", 210),
      ev(9, "entryRight", "Q4", 400), ev(10, "shotOnTarget", "Q4", 410), ev(11, "goalScored", "Q4", 415)
    ]
  });
  await setDoc(doc(db, `users/${uid}/matches/v2-b`), {
    id: "v2-b", sport: "softball", createdAt: "2026-08-09T09:00:00.000Z", ourTeam: "U15", opponent: "Eastside", events: []
  });
});
await env.cleanup();
console.log("Seeded. Sign in at http://localhost:5176 as parent@test.local / testpass123 (local emulator only).");
