import { pullLegacyMatches } from "../../core/storage/cloud";
import { getLocal } from "../../core/storage/local";
import { saveMatch } from "../../core/storage/sync";
import type { Match } from "../../core/types";
import { convertLegacyHockey, type LegacyMatch } from "./legacy";

export interface ImportResult {
  added: number;
  skipped: number;
  found: number;
  cloudFailed: boolean;
}

/**
 * Copies v2 hockey matches into v3: the user's cloud copies (users/{uid}/matches) and any
 * kept in this browser by the old app ("matchHistory"). Originals are never changed.
 * Safe to run again: matches already here are left alone.
 */
export async function importLegacyMatches(uid: string | null): Promise<ImportResult> {
  const raws: LegacyMatch[] = [];
  let cloudFailed = false;
  try {
    if (uid) raws.push(...((await pullLegacyMatches(uid)) as LegacyMatch[]));
  } catch {
    cloudFailed = true;
  }
  try {
    const local = JSON.parse(localStorage.getItem("matchHistory") ?? "[]");
    if (Array.isArray(local)) raws.push(...local);
  } catch {
    /* nothing stored */
  }
  let added = 0, skipped = 0;
  for (const raw of raws) {
    const m = convertLegacyHockey(raw);
    if (!m) { skipped++; continue; }
    if (await getLocal(m.id)) continue;
    await saveMatch(m as Match, uid, true);
    added++;
  }
  return { added, skipped, found: raws.length, cloudFailed };
}

/** Runs the import once per user on this phone, quietly, the first time they open v3. */
export async function importLegacyOnce(uid: string): Promise<void> {
  const key = `matchiq.legacyImported.${uid}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch {
    return;
  }
  const res = await importLegacyMatches(uid);
  // If the cloud was out of reach, try again next time rather than marking it done.
  if (!res.cloudFailed) {
    try { localStorage.setItem(key, new Date().toISOString()); } catch { /* private mode */ }
  }
}
