import type { MatchSession } from "../../core/useMatch";
import { HockeyLive } from "./Live";
import type { HockeySetup } from "./model";
import { HockeySummary } from "./Summary";

/** Live capture while the match is on; the summary once it is finished or when asked for. */
export function HockeyMatchView({ session, view }: { session: MatchSession<HockeySetup>; view?: string }) {
  return view === "summary" || session.match?.status === "completed" ? <HockeySummary session={session} /> : <HockeyLive session={session} />;
}
