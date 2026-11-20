# MatchIQ v3

Tap-based match capture with coach insights for school sport. This version covers **field hockey** and **tennis**. Softball is being redesigned; until then, use the old app in `legacy/`.

## Run it

```bash
npm install
npm run dev          # signs in with Firebase (project matchiq-9f263)
npm run dev:local    # no sign-in, everything stays on this computer (testing only)
npm test             # scoring, stats and insight rules
npm run build        # production build in dist/ (offline-capable PWA)
```

`dev:local` is switched off in production builds.

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

## Firestore rules

`firestore.rules` lets each user read and write only their own profile and matches, and stops a user from making themselves an administrator. Deploy with:

```bash
firebase deploy --only firestore:rules
```

Check the rules in the Firebase console before deploying. If the live project has rules already, merge them rather than replacing them.
