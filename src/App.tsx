import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./core/auth/AuthProvider";
import { AuthScreen, VerifyScreen } from "./core/auth/AuthScreen";
import { firstName } from "./core/names";
import { navigate, useRoute } from "./core/router";
import { listMySquads, type MySquad } from "./core/squads";
import { listLocal, onLocalChange, type StoredMatch } from "./core/storage/local";
import { pullAll, removeMatch } from "./core/storage/sync";
import { BuiltBy, Confirm, MovedNotice, PageHeader, ProfileButton, useDataSaver, useRoleLabel } from "./core/ui/components";
import { ArrowRightIcon, CaptureIcon, ChevronRightIcon, DashboardIcon, MatchIQMark, MatchesIcon, PlayIcon, TeamsIcon } from "./core/ui/icons-nav";
import { SquadScreen, SquadSection, useAppAdmin, useMySquads, roleText } from "./core/ui/Squads";
import { useMatch } from "./core/useMatch";
import { COMING_SOON, SPORTS, getSport } from "./sports/registry";
import type { SportModule } from "./sports/types";

/**
 * App shell, as in CourtOrder: a navy sidebar on laptops, a bottom bar on phones and tablets,
 * a white header with the profile, and the page in between. It knows no sport by name;
 * everything sport-specific comes from src/sports/registry.ts.
 *
 * Routes: #/ dashboard · #/capture · #/new/<sport> · #/matches/<sport> · #/teams · #/squad/<id> · #/match/<id>[/view]
 */
export default function App() {
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!user?.emailVerified) return;
    const uid = user.uid;
    pullAll(uid).catch((err) => console.warn("Could not fetch cloud matches yet", err));
    for (const s of SPORTS) s.onSignIn?.(uid).catch((err) => console.warn(`${s.name}: sign-in task will retry next time`, err));
  }, [user]);

  if (!ready) return <main className="app"><p className="muted center" style={{ marginTop: 80 }}>Loading…</p></main>;
  if (!user) return <main className="app"><MovedNotice /><AuthScreen /></main>;
  if (!user.emailVerified) return <main className="app"><VerifyScreen /></main>;
  return <Shell />;
}

type Section = "dashboard" | "capture" | "matches" | "teams";
const NAV: { id: Section; to: string; label: string; short?: string; Icon: () => ReactNode }[] = [
  { id: "dashboard", to: "/", label: "Dashboard", Icon: DashboardIcon },
  { id: "capture", to: "/capture", label: "New match", short: "New match", Icon: CaptureIcon },
  { id: "matches", to: "/matches", label: "Matches", Icon: MatchesIcon },
  { id: "teams", to: "/teams", label: "Teams & players", short: "Teams", Icon: TeamsIcon }
];

function sectionOf(a: string | undefined): Section {
  if (a === "capture" || a === "new") return "capture";
  if (a === "matches" || a === "history" || a === "match" || a === "sport") return "matches";
  if (a === "teams" || a === "squad") return "teams";
  return "dashboard";
}

const Brand = ({ light = false }: { light?: boolean }) => (
  <span className={`brand${light ? " light" : ""}`}>
    <MatchIQMark size={light ? 38 : 30} />
    <span>
      <span className="brand-name">Match<span className="iq">IQ</span></span>
      {light && <span className="brand-tag">Capture · Analyse · Improve</span>}
    </span>
  </span>
);

function Shell() {
  const route = useRoute();
  const [a, , c] = route;
  const section = sectionOf(a);
  // Live capture needs every pixel on a phone: no bottom bar while a match is being captured.
  const live = a === "match" && !c;
  const role = useRoleLabel();
  const saver = useDataSaver();
  const go = (to: string) => navigate(to);

  return (
    <div className={`shell${live ? " is-live" : ""}`}>
      <aside className="sidebar" aria-label="Main">
        <button className="sidebar-brand" onClick={() => go("/")}><Brand light /></button>
        <nav className="side-nav">
          {NAV.map(({ id, to, label, Icon }) => (
            <button key={id} className={`side-item${section === id ? " active" : ""}`} aria-current={section === id ? "page" : undefined} onClick={() => go(to)}>
              <Icon /><span>{label}</span>{section === id && <i className="dot" />}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          {role && (
            <div className="side-card">
              <p className="side-eyebrow">Signed in as</p>
              <p className="side-value">{role}</p>
            </div>
          )}
          <div className="side-card">
            <p className="side-eyebrow">Sending matches</p>
            <p className="side-text">{saver ? "Data saver is on: matches are sent when they end." : "Every tap is saved on this device first, then sent to the cloud."}</p>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="appbar">
          <button className="appbar-brand" onClick={() => go("/")}><Brand /></button>
          <p className="appbar-context">Match capture and analysis</p>
          <ProfileButton />
        </header>
        <main className="page">
          <MovedNotice />
          <Routes route={route} />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Main">
        {NAV.map(({ id, to, label, short, Icon }) => (
          <button key={id} className={section === id ? "active" : ""} aria-current={section === id ? "page" : undefined} onClick={() => go(to)}>
            <Icon /><span>{short ?? label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Routes({ route }: { route: string[] }) {
  const [a, b, c] = route;
  const sport = getSport(b);
  if (a === "capture") return <Capture />;
  if (a === "new" && sport) return <sport.Setup />;
  if ((a === "matches" || a === "history" || a === "sport")) return <Matches sportId={b} />;
  if (a === "teams") return <Teams />;
  if (a === "match" && b) return <MatchScreen key={b} id={b} view={c} />;
  if (a === "squad" && b) return <SquadScreen key={b} id={b} words={(id) => getSport(id)?.squad} sportName={(id) => getSport(id)?.name ?? id} />;
  return <Dashboard />;
}

/* ------------------------------------------------------------------ data hooks */

function useLocalMatches(): StoredMatch[] | null {
  const { user } = useAuth();
  const [list, setList] = useState<StoredMatch[] | null>(null);
  useEffect(() => {
    const load = () => listLocal(user?.uid ?? null).then(setList);
    load();
    return onLocalChange(load);
  }, [user]);
  return list;
}

function useAllSquads(): MySquad[] | null {
  const { user } = useAuth();
  const [list, setList] = useState<MySquad[] | null>(null);
  useEffect(() => {
    if (!user) return;
    listMySquads(user.uid).then(setList).catch(() => setList([]));
  }, [user]);
  return list;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const openPath = (m: StoredMatch) => {
  const sport = getSport(m.sport);
  return `/match/${m.id}${m.status === "completed" && sport ? `/${sport.completedView}` : ""}`;
};

function MatchRow({ m, right }: { m: StoredMatch; right?: ReactNode }) {
  const sport = getSport(m.sport);
  if (!sport) return null;
  return (
    <div className="match-row">
      <button className="match-row-main" onClick={() => navigate(openPath(m))}>
        <span className="tile"><sport.Icon /></span>
        <span className="match-row-text">
          <span className="match-title">{sport.title(m.setup)}</span>
          <span className="match-meta">{fmtDate(m.createdAt)} · {sport.scoreLine(m)}</span>
        </span>
        {m.status === "active" ? <span className="pill live">Live</span> : <ChevronRightIcon />}
      </button>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ dashboard */

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { profile } = useAuth();
  const all = useLocalMatches();
  const squads = useAllSquads();
  const year = String(new Date().getFullYear());
  const active = (all ?? []).filter((m) => m.status === "active");
  const done = (all ?? []).filter((m) => m.status === "completed");
  const thisYear = done.filter((m) => m.createdAt.startsWith(year));
  const recent = done.slice(0, 5);
  const resume = active[0];
  const resumeSport = resume ? getSport(resume.sport) : undefined;
  const name = firstName(profile?.name);

  const stats = [
    { label: `Matches ${year}`, value: thisYear.length },
    ...SPORTS.map((s) => ({ label: s.name, value: thisYear.filter((m) => m.sport === s.id).length })),
    { label: "Teams & players", value: squads?.length ?? "–" }
  ];

  return (
    <div className="stack-lg">
      <PageHeader title={`${greeting()}${name ? `, ${name}` : ""}`} subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} />

      <section className="hero">
        <div className="hero-top">
          <div>
            <span className="hero-pill"><i />{resume ? "Match in progress" : "Ready when you are"}</span>
            <h2>{resume && resumeSport ? resumeSport.title(resume.setup) : "Capture the next match, tap by tap."}</h2>
            {resume && resumeSport && <p className="hero-sub">{resumeSport.name} · {resumeSport.scoreLine(resume)}</p>}
          </div>
          {resume ? (
            <button className="hero-btn" onClick={() => navigate(`/match/${resume.id}`)}><PlayIcon /> Resume match</button>
          ) : (
            <button className="hero-btn" onClick={() => navigate("/capture")}>Start a match <ArrowRightIcon /></button>
          )}
        </div>
        <dl className="hero-stats" style={{ ["--n" as string]: stats.length }}>
          {stats.map((s) => <div key={s.label}><dd>{s.value}</dd><dt>{s.label}</dt></div>)}
        </dl>
      </section>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Recent matches</h3>
            <button className="text-btn" onClick={() => navigate("/matches")}>View all <ArrowRightIcon size={14} /></button>
          </div>
          {all === null ? <p className="muted small">Loading…</p>
            : recent.length === 0 ? <p className="muted small">No finished matches yet. Your reports will appear here.</p>
            : <div className="rows">{recent.map((m) => <MatchRow key={m.id} m={m} />)}</div>}
          {active.length > 1 && (
            <>
              <p className="eyebrow" style={{ marginTop: 16 }}>Also in progress</p>
              <div className="rows">{active.slice(1).map((m) => <MatchRow key={m.id} m={m} />)}</div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Teams &amp; players</h3>
            <button className="text-btn" onClick={() => navigate("/teams")}>Manage <ArrowRightIcon size={14} /></button>
          </div>
          {squads === null ? <p className="muted small">Loading…</p>
            : squads.length === 0 ? <p className="muted small">Create or join a team or player to share matches with the coach and other parents.</p>
            : (
              <div className="rows">
                {squads.slice(0, 6).map((s) => {
                  const sp = getSport(s.sport);
                  return (
                    <button key={s.id} className="squad-row" onClick={() => navigate(`/squad/${s.id}`)}>
                      <span className="tile small">{sp && <sp.Icon />}</span>
                      <span className="match-row-text"><span className="match-title">{s.name}</span><span className="match-meta">{sp?.name}</span></span>
                      <span className="pill">{roleText(s.role, s.admin)}</span>
                    </button>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      <BuiltBy />
    </div>
  );
}

/* ------------------------------------------------------------------ capture */

function Capture() {
  const all = useLocalMatches();
  const active = (all ?? []).filter((m) => m.status === "active");
  return (
    <div className="stack-lg">
      <PageHeader title="New match" subtitle="Choose the sport. Every tap is saved on this device straight away, so nothing is lost without signal." />
      {active.length > 0 && (
        <section className="panel">
          <div className="panel-head"><h3>In progress</h3></div>
          <div className="rows">{active.map((m) => <MatchRow key={m.id} m={m} />)}</div>
        </section>
      )}
      <div className="sport-cards">
        {SPORTS.map((s) => (
          <button key={s.id} className="sport-card" onClick={() => navigate(`/new/${s.id}`)}>
            <span className="tile large"><s.Icon /></span>
            <span className="sport-card-name">{s.name}</span>
            <span className="sport-card-sub">{s.blurb}</span>
            <span className="sport-card-go">Start {s.name.toLowerCase()} match <ArrowRightIcon size={14} /></span>
          </button>
        ))}
        {COMING_SOON.map((s) => {
          const body = (
            <>
              <span className="tile large muted-tile"><s.Icon /></span>
              <span className="sport-card-name">{s.name}</span>
              <span className="sport-card-sub">{s.note}</span>
            </>
          );
          return s.href
            ? <a key={s.name} className="sport-card soon" href={s.href}>{body}</a>
            : <div key={s.name} className="sport-card soon" aria-disabled="true">{body}</div>;
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ matches */

function SportTabs({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="sport-tabs" role="tablist" aria-label="Sport">
      {SPORTS.map((s) => (
        <button key={s.id} role="tab" aria-selected={value === s.id} className={value === s.id ? "active" : ""} onClick={() => onChange(s.id)}>
          <s.Icon /> {s.name}
        </button>
      ))}
    </div>
  );
}

function rememberedSport(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function Matches({ sportId }: { sportId?: string }) {
  const id = getSport(sportId)?.id ?? getSport(rememberedSport("matchiq.matches.sport", ""))?.id ?? SPORTS[0].id;
  const sport = getSport(id)!;
  const pick = (next: string) => {
    try { localStorage.setItem("matchiq.matches.sport", next); } catch { /* private mode */ }
    navigate(`/matches/${next}`);
  };
  return (
    <div className="stack-lg">
      <PageHeader title="Matches" subtitle="Every match you and your teams have captured, with season trends."
        actions={<button className="btn primary" onClick={() => navigate(`/new/${sport.id}`)}>New {sport.name.toLowerCase()} match</button>} />
      <SportTabs value={id} onChange={pick} />
      <History key={id} sport={sport} />
    </div>
  );
}

function History({ sport }: { sport: SportModule }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [list, setList] = useState<StoredMatch[] | null>(null);
  const [del, setDel] = useState<StoredMatch | null>(null);
  const [squads] = useMySquads(sport.id);
  const appAdmin = useAppAdmin();
  const load = () => listLocal(uid, sport.id).then(setList);
  useEffect(() => {
    load();
    // Fetch matches others in your teams have captured since you opened the app.
    if (uid) pullAll(uid).catch(() => {});
    return onLocalChange(load);
  }, [sport, uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const squadOf = (m: StoredMatch) => squads?.find((s) => s.id === m.squadId);

  // Season filters: which team or player, and which year. Remembered per sport on this device.
  const keyOf = (m: StoredMatch) => sport.seasonKey(m.setup) || "Unnamed";
  const keys = [...new Set((list ?? []).map(keyOf))].sort();
  const years = [...new Set((list ?? []).map((m) => m.createdAt.slice(0, 4)))].sort().reverse();
  const [who, setWho] = useState<string>(() => rememberedSport(`matchiq.${sport.id}.season.who`, ""));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const pickWho = (v: string) => { setWho(v); try { localStorage.setItem(`matchiq.${sport.id}.season.who`, v); } catch { /* private mode */ } };
  const activeWho = keys.includes(who) ? who : keys.length === 1 ? keys[0] : "";
  const shown = (list ?? []).filter((m) => (!activeWho || keyOf(m) === activeWho) && (year === "all" || m.createdAt.startsWith(year)));
  const seasonMatches = shown.filter((m) => m.status === "completed").slice().reverse();
  // Your own matches; in a shared team or player, coaches and administrators can delete any match.
  const canDelete = (m: StoredMatch) => !m.squadId || m.createdBy === uid || appAdmin || squadOf(m)?.role === "coach" || !!squadOf(m)?.admin;

  if (list === null) return <p className="muted">Loading…</p>;
  if (list.length === 0) {
    return (
      <section className="panel empty">
        <span className="tile large"><sport.Icon /></span>
        <h3>No {sport.name.toLowerCase()} matches yet</h3>
        <p className="muted small">Capture a match and its report and season trends appear here.</p>
        <button className="btn primary" onClick={() => navigate(`/new/${sport.id}`)}>Start a {sport.name.toLowerCase()} match</button>
      </section>
    );
  }

  return (
    <>
      <div className="filters">
        <select aria-label={`${sport.squad.one} to show`} value={activeWho} onChange={(e) => pickWho(e.target.value)}>
          {keys.length > 1 && <option value="">All {sport.squad.many}</option>}
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
          {!years.includes(year) && year !== "all" && <option value={year}>{year}</option>}
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
          <option value="all">All time</option>
        </select>
      </div>

      <div className="history-layout">
        <section className="panel season">
          <div className="panel-head"><h3>{activeWho ? `${activeWho} · ` : ""}{year === "all" ? "All time" : `${year} season`}</h3></div>
          {!activeWho ? <p className="muted small">Choose a {sport.squad.one} to see their season.</p>
            : seasonMatches.length === 0 ? <p className="muted small">No finished matches in this period yet.</p>
            : <sport.Season matches={seasonMatches} />}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Matches</h3><span className="muted small">{shown.length}</span></div>
          {shown.length === 0 ? <p className="muted small">No matches in this period.</p> : (
            <div className="rows">
              {shown.map((m) => (
                <MatchRow key={m.id} m={m} right={
                  <div className="match-row-extra">
                    {m.importedFrom && <span className="pill">Imported</span>}
                    {m.squadId && <span className="pill">{squadOf(m)?.name ?? "Shared"}</span>}
                    {canDelete(m) && <button className="text-btn danger" onClick={() => setDel(m)} aria-label={`Delete ${sport.title(m.setup)}`}>Delete</button>}
                  </div>
                } />
              ))}
            </div>
          )}
        </section>
      </div>
      {sport.HistoryExtra && <sport.HistoryExtra onChanged={load} />}
      {del && <Confirm title="Delete this match?" body={`${sport.title(del.setup)} on ${fmtDate(del.createdAt)} is removed from this device and the cloud${del.squadId ? ", for everyone in the " + sport.squad.one : ""}. This cannot be undone.`} confirmLabel="Delete match" danger onConfirm={async () => { await removeMatch(del.id, uid); load(); }} onClose={() => setDel(null)} />}
    </>
  );
}

/* ------------------------------------------------------------------ teams */

function Teams() {
  return (
    <div className="stack-lg">
      <PageHeader title="Teams & players" subtitle="Share matches with the coach, parents and players. Create a team or player, or join one with a code." />
      <div className="teams-grid">
        {SPORTS.map((s) => (
          <section key={s.id} className="panel">
            <div className="panel-head"><h3 className="with-tile"><span className="tile small"><s.Icon /></span>{s.name}</h3></div>
            <SquadSection sport={s.id} words={s.squad} />
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ match */

function MatchScreen({ id, view }: { id: string; view?: string }) {
  const { user } = useAuth();
  const session = useMatch<unknown>(id, user?.uid ?? null);
  const m = session.match;
  if (session.missing) return <EmptyState text="This match is not on this device." />;
  if (!m) return <p className="muted center">Loading…</p>;
  const sport = getSport(m.sport);
  if (!sport) return <EmptyState text={`This app version cannot open ${m.sport} matches yet.`} />;
  return <sport.MatchView session={session} view={view} />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <section className="panel empty">
      <p className="muted">{text}</p>
      <button className="btn" onClick={() => navigate("/matches")}>Go to matches</button>
    </section>
  );
}
