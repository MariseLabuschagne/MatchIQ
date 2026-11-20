import { hockey } from "./hockey";
import { tennis } from "./tennis";
import type { ComingSoon, SportModule } from "./types";

/** The sports this app offers, in home-screen order. Adding a sport is one line here. */
export const SPORTS: SportModule[] = [hockey, tennis];

export const COMING_SOON: ComingSoon[] = [
  { name: "Softball", icon: "🥎", note: "Being redesigned · use the current app for now" }
];

export function getSport(id: string | undefined): SportModule | undefined {
  return SPORTS.find((s) => s.id === id);
}
