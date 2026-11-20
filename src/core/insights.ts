import type { Insight } from "./types";

/** Percentage rounded to a whole number; 0 when there is nothing to divide by. */
export function pct(a: number, n: number): number {
  return n ? Math.round((a / n) * 100) : 0;
}

/**
 * Sample-size honesty: show "3 of 5" below 10 occurrences, and
 * "12 of 20 (60%)" from 10 up, so small samples never look like trends.
 */
export function frac(a: number, n: number): string {
  return n >= 10 ? `${a} of ${n} (${pct(a, n)}%)` : `${a} of ${n}`;
}

export function plural(n: number, word: string, many = word + "s"): string {
  return `${n} ${n === 1 ? word : many}`;
}

/** A tiny rules engine: collect candidate insights, keep the strongest of each kind. */
export class InsightCollector {
  private items: Insight[] = [];

  add(kind: Insight["kind"], weight: number, title: string, detail: string): void {
    this.items.push({ kind, weight, title, detail });
  }

  top(kind: Insight["kind"], n = 3): Insight[] {
    return this.items.filter((i) => i.kind === kind).sort((a, b) => b.weight - a.weight).slice(0, n);
  }
}
