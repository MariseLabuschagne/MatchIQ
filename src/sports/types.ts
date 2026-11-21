import type { ComponentType } from "react";
import type { Match } from "../core/types";
import type { MatchSession } from "../core/useMatch";

/**
 * Everything the app shell needs to know about a sport.
 * Each sport folder exports one of these from its index.ts; nothing outside the
 * folder imports the sport's other files. To add a sport: build its folder,
 * export a SportModule, and add one line to registry.ts.
 */
export interface SportModule<TSetup = any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Stored on every match and used in routes, e.g. "hockey". Never change it once matches exist. */
  id: string;
  name: string;
  /** Line icon shown next to the name (drawn in the current text colour). */
  Icon: ComponentType;
  /** One line under the name on the home screen, e.g. "Team matches · entries, shots, goals". */
  blurb: string;
  /** New-match screen. */
  Setup: ComponentType;
  /** Live capture and summary screens. `view` is the route part after the match id, e.g. "summary". */
  MatchView: ComponentType<{ session: MatchSession<TSetup>; view?: string }>;
  /** Route part that opens a finished match, e.g. "summary" or "report". */
  completedView: string;
  /** Short match name for lists, e.g. "U14A vs Rivals". */
  title: (setup: TSetup) => string;
  /** Score for lists, e.g. "2–1" or "6–4 6–3". */
  scoreLine: (match: Match<TSetup>) => string;
  /** What a shared group is called in this sport: a hockey team, a tennis player. */
  squad: { one: string; many: string; nameLabel: string; placeholder: string };
  /** Optional work to run in the background after someone signs in (e.g. a one-off import of old matches). */
  onSignIn?: (uid: string) => Promise<void>;
  /** Optional extra panel at the bottom of the sport's history page (e.g. importing old matches). */
  HistoryExtra?: ComponentType<{ onChanged: () => void }>;
}

/** A sport not in this version yet, shown on the home screen; `href` can point to where it lives for now. */
export interface ComingSoon {
  name: string;
  Icon: ComponentType;
  note: string;
  href?: string;
}
