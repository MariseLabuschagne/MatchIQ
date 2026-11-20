import { newClock } from "./clock";
import { uid } from "./events";
import { saveMatch } from "./storage/sync";
import { SCHEMA_VERSION, type Match, type SportId } from "./types";

export async function createMatch<TSetup>(sport: SportId, setup: TSetup, periodMinutes: number, ownerUid: string | null): Promise<Match<TSetup>> {
  const now = new Date().toISOString();
  const match: Match<TSetup> = {
    id: uid(),
    sport,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    status: "active",
    setup,
    events: [],
    clock: newClock(periodMinutes)
  };
  await saveMatch(match as Match, ownerUid, true);
  return match;
}

/** Small per-phone conveniences (last team name, last competition). Never required. */
export function remember(key: string, value?: string): string {
  try {
    if (value !== undefined) localStorage.setItem(`matchiq.${key}`, value);
    return localStorage.getItem(`matchiq.${key}`) ?? "";
  } catch {
    return value ?? "";
  }
}
