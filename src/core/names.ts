/** "Mia van der Merwe" → "Mia". Empty stays empty. */
export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/** "Mia van der Merwe" → "MV"; an email falls back to its first letters. */
export function initials(name: string | null | undefined, email?: string | null): string {
  const parts = (name || email || "?").trim().split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Team names typed slightly differently count as one team:
 * "Hennopspark o/12 A" → "Hennopspark o/12A", "U14  A" → "U14A", extra spaces dropped.
 */
export const tidyTeam = (name: string | null | undefined) =>
  (name ?? "").trim().replace(/\s+/g, " ").replace(/\b([ou]\/?\s?\d{1,2})\s+([a-z])\b/gi, "$1$2");
