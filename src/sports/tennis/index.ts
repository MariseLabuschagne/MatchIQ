import { TennisSeason } from "./Season";
import { TennisIcon } from "./Icon";
import { SQUAD_WORDS } from "./words";
import type { SportModule } from "../types";
import { mergePoints, type TennisSetup } from "./model";
import { replay, resultString } from "./scoring";
import { TennisMatchView } from "./Screens";
import { TennisSetupScreen } from "./Setup";
import "./tennis.css";

export const tennis: SportModule<TennisSetup> = {
  id: "tennis",
  name: "Tennis",
  Icon: TennisIcon,
  blurb: "Point by point · serve, return and winners",
  squad: SQUAD_WORDS,
  Setup: TennisSetupScreen,
  MatchView: TennisMatchView,
  seasonKey: (s) => (s?.player ?? "").trim(),
  Season: TennisSeason,
  completedView: "report",
  title: (s) => `${s.player} vs ${s.opponent}`,
  scoreLine: (m) => {
    const r = replay(m.setup, mergePoints(m.events));
    return resultString(r) || `${r.games.p}–${r.games.o} in games`;
  }
};
