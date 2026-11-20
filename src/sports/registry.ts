import { hockey } from "./hockey";
import { tennis } from "./tennis";
import type { ComingSoon, SportModule } from "./types";

/** The sports this app offers, in home-screen order. Adding a sport is one line here. */
export const SPORTS: SportModule[] = [hockey, tennis];

export const COMING_SOON: ComingSoon[] = [
  // The v2 app is published alongside v3 at ./legacy/ (see vite.config.ts) and shares sign-in and data.
  { name: "Softball", icon: "🥎", note: "Being redesigned · opens the current app", href: "./legacy/" }
];

export function getSport(id: string | undefined): SportModule | undefined {
  return SPORTS.find((s) => s.id === id);
}
