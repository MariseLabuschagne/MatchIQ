import type { SportModule } from "../types";
import { mergePoints, type TennisSetup } from "./model";
import { replay, resultString } from "./scoring";
import { TennisMatchView } from "./Screens";
import { TennisSetupScreen } from "./Setup";
import "./tennis.css";

export const tennis: SportModule<TennisSetup> = {
  id: "tennis",
  name: "Tennis",
  icon: "🎾",
  buttonClass: "tennis",
  Setup: TennisSetupScreen,
  MatchView: TennisMatchView,
  completedView: "report",
  title: (s) => `${s.player} vs ${s.opponent}`,
  scoreLine: (m) => {
    const r = replay(m.setup, mergePoints(m.events));
    return resultString(r) || `${r.games.p}–${r.games.o} in games`;
  }
};
