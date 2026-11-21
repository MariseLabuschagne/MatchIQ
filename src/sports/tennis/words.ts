import type { SquadWords } from "../../core/ui/Squads";

/** What a shared group is called in tennis. */
export const SQUAD_WORDS: SquadWords = { one: "player", many: "players", nameLabel: "Player's name", placeholder: "e.g. Mia" };

/** "Home", "Away" or "Neutral venue"; empty for older matches. */
export const venueLabel = (s: { venue?: string }) => (s.venue === "home" ? "Home" : s.venue === "away" ? "Away" : s.venue === "neutral" ? "Neutral venue" : "");
