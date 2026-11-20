import type { ClockStamp, Match, MatchEvent } from "./types";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface NewEvent {
  type: string;
  data?: Record<string, unknown>;
}

/** Append the events of one tap. Returns a new match; the input is not changed. */
export function appendEvents(match: Match, items: NewEvent[], clock?: ClockStamp): Match {
  if (!items.length) return match;
  const group = uid();
  const at = new Date().toISOString();
  let seq = match.events.length ? match.events[match.events.length - 1].seq : 0;
  const added: MatchEvent[] = items.map((it) => ({
    id: uid(),
    seq: ++seq,
    at,
    group,
    type: it.type,
    data: it.data ?? {},
    clock
  }));
  return { ...match, events: [...match.events, ...added], updatedAt: at };
}

/** Remove the last tap (all events in the last group). Returns the new match and the removed events. */
export function removeLastGroup(match: Match): { match: Match; removed: MatchEvent[] } {
  const last = match.events[match.events.length - 1];
  if (!last) return { match, removed: [] };
  const removed = match.events.filter((e) => e.group === last.group);
  return {
    match: { ...match, events: match.events.filter((e) => e.group !== last.group), updatedAt: new Date().toISOString() },
    removed
  };
}

/** Put back a group removed by undo. */
export function restoreGroup(match: Match, removed: MatchEvent[]): Match {
  return { ...match, events: [...match.events, ...removed], updatedAt: new Date().toISOString() };
}

/** Delete one tap anywhere in the match (the whole group of the given event). */
export function deleteGroup(match: Match, eventId: string): Match {
  const target = match.events.find((e) => e.id === eventId);
  if (!target) return match;
  return { ...match, events: match.events.filter((e) => e.group !== target.group), updatedAt: new Date().toISOString() };
}

/** Group events by tap, in order. */
export function groups(events: MatchEvent[]): MatchEvent[][] {
  const out: MatchEvent[][] = [];
  for (const e of events) {
    const cur = out[out.length - 1];
    if (cur && cur[0].group === e.group) cur.push(e);
    else out.push([e]);
  }
  return out;
}
