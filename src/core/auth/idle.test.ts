import { beforeEach, describe, expect, it } from "vitest";
import { clearActive, IDLE_LIMIT_MS, isIdleTooLong, markActive, takeIdleNotice } from "./idle";

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> }).localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => void store.set(k, v),
  removeItem: (k) => void store.delete(k)
};

describe("idle log-out", () => {
  beforeEach(() => { store.clear(); clearActive(false); });

  it("treats no record as just used", () => {
    expect(isIdleTooLong()).toBe(false);
  });
  it("logs out only after 12 hours without use", () => {
    const t = Date.now();
    markActive(t);
    expect(isIdleTooLong(t + IDLE_LIMIT_MS - 1000)).toBe(false);
    expect(isIdleTooLong(t + IDLE_LIMIT_MS + 1000)).toBe(true);
  });
  it("a sign-out clears the clock and leaves a one-time notice after idling", () => {
    markActive(Date.now() - IDLE_LIMIT_MS * 2);
    clearActive(true);
    expect(isIdleTooLong()).toBe(false);
    expect(takeIdleNotice()).toBe(true);
    expect(takeIdleNotice()).toBe(true);
    clearActive(false); // signing in again clears it
    expect(takeIdleNotice()).toBe(false);
  });
});
