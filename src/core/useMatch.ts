import { useCallback, useEffect, useRef, useState } from "react";
import { appendEvents, deleteGroup, removeLastGroup, restoreGroup, type NewEvent } from "./events";
import { getLocal } from "./storage/local";
import { saveMatch } from "./storage/sync";
import type { ClockStamp, Match, MatchEvent } from "./types";

/**
 * Loads one match and gives the live screen everything it needs:
 * record a tap, unlimited undo and redo, delete any earlier tap, and edit the match itself.
 * Every change is saved straight away (phone first, cloud a few seconds later).
 */
export function useMatch<TSetup>(id: string, uid: string | null) {
  const [match, setMatchState] = useState<Match<TSetup> | null>(null);
  const [missing, setMissing] = useState(false);
  const current = useRef<Match<TSetup> | null>(null);
  const redoStack = useRef<MatchEvent[][]>([]);

  useEffect(() => {
    let alive = true;
    getLocal(id).then((m) => {
      if (!alive) return;
      if (m) {
        current.current = m as unknown as Match<TSetup>;
        setMatchState(current.current);
      } else setMissing(true);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const set = useCallback(
    (next: Match<TSetup>, immediate = false) => {
      current.current = next;
      setMatchState(next);
      saveMatch(next as Match, uid, immediate);
    },
    [uid]
  );

  const record = useCallback(
    (items: NewEvent[], clock?: ClockStamp) => {
      const cur = current.current;
      if (!cur || !items.length) return;
      redoStack.current = [];
      set(appendEvents(cur as Match, items, clock) as Match<TSetup>);
    },
    [set]
  );

  const undo = useCallback(() => {
    const cur = current.current;
    if (!cur) return;
    const { match: next, removed } = removeLastGroup(cur as Match);
    if (!removed.length) return;
    redoStack.current.push(removed);
    set(next as Match<TSetup>);
  }, [set]);

  const redo = useCallback(() => {
    const cur = current.current;
    const g = redoStack.current.pop();
    if (!cur || !g) return;
    set(restoreGroup(cur as Match, g) as Match<TSetup>);
  }, [set]);

  const remove = useCallback(
    (eventId: string) => {
      const cur = current.current;
      if (!cur) return;
      redoStack.current = [];
      set(deleteGroup(cur as Match, eventId) as Match<TSetup>);
    },
    [set]
  );

  const update = useCallback(
    (fn: (m: Match<TSetup>) => Match<TSetup>, immediate = false) => {
      const cur = current.current;
      if (!cur) return;
      set({ ...fn(cur), updatedAt: new Date().toISOString() }, immediate);
    },
    [set]
  );

  return {
    match,
    missing,
    record,
    undo,
    redo,
    remove,
    update,
    canUndo: !!match && match.events.length > 0,
    canRedo: redoStack.current.length > 0
  };
}

/** What a sport's match screens receive. */
export type MatchSession<TSetup> = ReturnType<typeof useMatch<TSetup>>;
