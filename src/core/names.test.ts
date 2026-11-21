import { describe, expect, it } from "vitest";
import { tidyTeam } from "./names";

describe("tidyTeam", () => {
  it("treats o/12 A and o/12A as one team", () => {
    expect(tidyTeam("Hennopspark o/12 A")).toBe(tidyTeam("Hennopspark o/12A"));
    expect(tidyTeam("Hennopspark o/10 A")).toBe("Hennopspark o/10A");
    expect(tidyTeam(" U14  A ")).toBe("U14A");
  });
  it("leaves other names alone", () => {
    expect(tidyTeam("St Albans 1st XI")).toBe("St Albans 1st XI");
    expect(tidyTeam("Team A")).toBe("Team A");
  });
});
