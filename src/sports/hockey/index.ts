import { HockeyIcon } from "./Icon";
import { SQUAD_WORDS } from "./words";
import type { SportModule } from "../types";
import { importLegacyOnce } from "./importLegacy";
import { LegacyImport } from "./LegacyImport";
import { HockeyMatchView } from "./MatchView";
import type { HockeySetup } from "./model";
import { deriveLive } from "./reducer";
import { HockeySetupScreen } from "./Setup";
import "./hockey.css";

export const hockey: SportModule<HockeySetup> = {
  id: "hockey",
  name: "Hockey",
  Icon: HockeyIcon,
  blurb: "Team matches · entries, shots and goals",
  squad: SQUAD_WORDS,
  Setup: HockeySetupScreen,
  MatchView: HockeyMatchView,
  completedView: "summary",
  title: (s) => `${s.ourTeam} vs ${s.opponent}`,
  scoreLine: (m) => {
    const { score } = deriveLive(m.setup, m.events);
    return `${score.for}–${score.against}`;
  },
  onSignIn: importLegacyOnce,
  HistoryExtra: LegacyImport
};
