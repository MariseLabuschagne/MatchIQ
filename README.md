# MatchIQ v3

Tap-based match capture with coach insights for school sport. This version covers **field hockey** and **tennis**. Softball is being redesigned; until then, the old app is published alongside at `/legacy/`.

## Run it

Same set-up as Court Order: React + Vite + Firebase (Auth, Firestore, Hosting), deployed from this computer.

```bash
npm install
npm run dev          # http://localhost:5173, uses the real Firebase project
npm test             # scoring, stats and insight rules
npm run test:rules   # security rules on the Firestore emulator (needs Java)
npm run build        # production build in dist/ (offline-capable PWA, old app at /legacy/)
```

**Try it without touching real data:**

1. Run `npm run emulators` in one terminal.
2. Run `npm run seed:emulators` once, then `npm run dev:emulators`.
3. Open http://localhost:5176 and sign in as `parent@test.local` (password `testpass123`).

That account exists only in the local emulator. It comes with two old v2 matches, so you can watch the automatic import. The old app at `/legacy/` always uses the real project.

## Putting it online

- `npm run deploy:rules` publishes only the security rules and indexes.
- `npm run deploy` builds the app and publishes Hosting plus the rules to https://matchiq-9f263.web.app.
- To test first without changing the live site, use a preview link that expires on its own:

```bash
npm run build && npx firebase hosting:channel:deploy preview --expires 7d
```

The home screen shows the version and build date, for example "MatchIQ v3.00 · built 20 Nov 2026", so you can tell which deploy a phone has. The version comes from `package.json`: 3.1.0 shows as v3.01.

**App Check** is wired in the same way as Court Order, but off until a reCAPTCHA Enterprise key is registered for the MatchIQ domains. When there is one, paste it into `APP_CHECK_SITE_KEY` in `src/core/firebase.ts`.

## Moving from the old app

- **Old matches:** the old app's hockey matches are copied in automatically the first time each person signs in to v3. This covers matches in the cloud (`users/{uid}/matches`) and any kept in that browser. The originals are never changed. History → "Check for old matches" runs the import again.
- **Softball:** the old app is published inside v3 at `/legacy/`. The Softball button opens it, using the same accounts and data.
- **Safe copy:** the last v2 code is in `legacy/`, and the commit on main before the switch is tagged `v2-final`.
- **Old address:** GitHub Pages still serves `main`. The inline script in `index.html` sends visitors from `*.github.io` to https://matchiq-9f263.web.app (with `?moved=1`, which shows a one-time "new address" note). The old app stays reachable there at `/MatchIQ/legacy/`, so matches kept only in that browser can still be opened.

## How it is built

- **Vite + React + TypeScript (strict)**, hash routes (`#/sport/hockey`, `#/match/<id>`), so it runs from any folder.
- **A match is a setup plus a list of events.** The score, stats and insights are all worked out from the events, never stored separately. That gives:
  - unlimited undo and redo (one tap is one undo, even when it records several events);
  - deleting any earlier tap from the timeline, with the score corrected automatically;
  - old matches that can be re-analysed when the insight rules improve.
- **Phone first, cloud second.** Every tap is saved to IndexedDB at once, then pushed to Firestore (`users/{uid}/matchesV3`) a few seconds later. With no signal, the push waits until the phone is online. The old app's data in `users/{uid}/matches` is never written to.
- **Offline app.** A service worker caches the app, so it opens at a field with no signal.

```
src/
  core/            shared by every sport and knows no sport by name: events, clock, storage, sync, auth, UI pieces, insight helpers
  sports/types.ts  the SportModule contract every sport fills in
  sports/registry.ts  the list of sports; the only file that imports a sport folder
  sports/hockey/   everything hockey: model, taps, possessions, stats, insights, old-app importer, screens, hockey.css
  sports/tennis/   everything tennis: model, scoring, stats, insights, screens, tennis.css
  App.tsx          sign-in gate, home, sport menu, history, routing (reads the registry)
  styles.css       shared look only: colours, fonts, cards, buttons, tables, insights
legacy/            the previous app, kept for reference and for softball
```

**Rules that keep sports apart**

- `core/` never imports from `sports/`.
- A sport folder never imports from another sport folder.
- Outside its folder, a sport is reached only through its `index.ts`, which exports one `SportModule`. Its styles load with it.

**Adding a sport** (e.g. softball):

1. Create `src/sports/softball/`.
2. Give it an `index.ts` that exports a `SportModule`: name, icon, setup screen, match screens, title and score line.
3. Add it to `SPORTS` in `registry.ts` and remove it from `COMING_SOON`.

Nothing in hockey, tennis or `core/` needs to change.

## Hockey changes from v2

- Possessions are numbered and close as soon as anything else happens. In v2, events after a cancelled attack could be credited to the wrong attack.
- "Long corners against" is now counted. In v2 it always showed 0 because of a misspelled ID.
- A long corner in attack now ends the attack.
- Goals add a shot on target automatically if none was tapped, without counting a shot twice.
- The timeline shows the last taps in plain language, and any tap can be deleted.
- Insights compare against the team's last few matches, and small samples show as "3 of 5" rather than as misleading percentages.
- The clock is based on timestamps, so it stays right when the phone locks. The screen also stays awake during a match.
- **History → Import old matches** copies v2 hockey matches (from the cloud and from this browser) into v3. The originals are not changed.

## Tennis

There are three capture levels (Quick, Standard and Detailed), and the parent can switch between them mid-match. After each point, the parent taps who won and, if they can, how. MatchIQ keeps the score. "Missed point" keeps the score right without guessing stats. The report includes a capture check (taps and seconds per point) so the level can be tuned. "See a sample report first" creates a generated match that stays on the phone only.

## Teams, players and sharing

A *squad* is a hockey team or a tennis player (`src/core/squads.ts`, screens in `src/core/ui/Squads.tsx`).

- Whoever creates a squad is its **coach** and gets a 6-character **join code**. Anyone who enters the code joins as a **parent**.
- Members see the squad's matches and can capture new ones. Only whoever captured a match, or the coach, can delete it.
- The coach can remove people and make a new code (the old one stops working; people already in stay in).
- On a new match, "Share with" picks the team or player, or "Only me" for a private match. Private matches and imported v2 matches stay private.
- Shared matches live at `squads/{id}/matches`; private ones at `users/{uid}/matchesV3`. The rules check membership and the join code on the server, so nobody can read a team they're not in, even outside the app. Tests: `tests/rules/squads.rules.test.ts`.

## Firestore rules

`firestore.rules` lets each user read and write only their own profile and matches, and stops a user from making themselves an administrator. It also accepts exactly what the old app writes, so it is safe to publish while the old app is still in use (`tests/rules` checks this). Deploy with:

```bash
npm run deploy:rules
```

Check the rules in the Firebase console before deploying. If the live project has rules already, merge them rather than replacing them.
