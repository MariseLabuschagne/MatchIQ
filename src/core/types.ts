/**
 * Shared match model for every sport.
 *
 * A match is a setup plus an ordered list of events. Live state (score, period,
 * open attack, game score, ...) is never stored: each sport derives it from the
 * events with a pure function, so undo, edits and old matches always stay correct.
 */

/** A sport's id, e.g. "hockey". Core code never depends on which sports exist: see src/sports/registry.ts. */
export type SportId = string;

export const SCHEMA_VERSION = 1;

export interface ClockStamp {
  /** Period label at the time of the event, e.g. "Q2" or "H1". */
  period: string;
  /** Seconds elapsed in the period. */
  second: number;
}

export interface MatchEvent<TType extends string = string, TData = Record<string, unknown>> {
  id: string;
  /** Monotonic order within the match. */
  seq: number;
  /** ISO timestamp of the tap. */
  at: string;
  /** Events created by one tap share a group, so one undo removes them together. */
  group: string;
  type: TType;
  data: TData;
  clock?: ClockStamp;
}

export interface ClockState {
  /** Length of one period in minutes (0 = no clock). */
  periodMinutes: number;
  /** Epoch ms when the clock was last started, or null when paused. */
  runningSince: number | null;
  /** Seconds banked in the current period before runningSince. */
  banked: number;
}

export type MatchStatus = "active" | "completed";

export interface Match<TSetup = unknown> {
  id: string;
  sport: SportId;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: MatchStatus;
  setup: TSetup;
  events: MatchEvent[];
  clock: ClockState;
  /** Set when a match was converted from the v2 app. */
  importedFrom?: string;
  /** Free-text notes written after the match. */
  notes?: string;
  /** Set when the match belongs to a team or player that is shared (see core/squads.ts). */
  squadId?: string;
  /** Who captured it. Only they or the squad's coach can delete a shared match. */
  createdBy?: string;
}

export interface Insight {
  kind: "strength" | "workon" | "plan" | "info";
  title: string;
  detail: string;
  /** Higher = more important; used to rank. */
  weight: number;
}
