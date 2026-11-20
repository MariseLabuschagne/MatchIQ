import type { ClockState } from "./types";

/** The clock stores when it started, not a ticking counter, so it survives the phone locking or the app closing. */

export function newClock(periodMinutes: number): ClockState {
  return { periodMinutes, runningSince: null, banked: 0 };
}

export function elapsedSeconds(c: ClockState, now = Date.now()): number {
  return Math.floor(c.banked + (c.runningSince != null ? (now - c.runningSince) / 1000 : 0));
}

export function startClock(c: ClockState, now = Date.now()): ClockState {
  return c.runningSince != null ? c : { ...c, runningSince: now };
}

export function pauseClock(c: ClockState, now = Date.now()): ClockState {
  if (c.runningSince == null) return c;
  return { ...c, banked: c.banked + (now - c.runningSince) / 1000, runningSince: null };
}

export function resetClock(c: ClockState): ClockState {
  return { ...c, banked: 0, runningSince: null };
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
