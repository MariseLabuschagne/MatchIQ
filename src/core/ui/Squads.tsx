import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { navigate } from "../router";
import {
  changeCode, createSquad, getSquad, isDenied, isSquadAdmin, joinSquad, leaveSquad, listAllSquads, listMembers, listMySquads,
  lookUpCode, removeMember, ROLE_LABEL, ROLES, setMyRole, updateMember,
  type CodeInfo, type Member, type MySquad, type Squad, type SquadRole
} from "../squads";
import { dropSquadLocal } from "../storage/local";
import { BackLink, Confirm, Sheet } from "./components";

/** Words for a sport's squads, e.g. { one: "team", many: "teams" }. Comes from the SportModule. */
export interface SquadWords { one: string; many: string; nameLabel: string; placeholder: string }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const me = (user: { uid: string; displayName: string | null; email: string | null }, profileName?: string) =>
  ({ uid: user.uid, name: profileName || user.displayName || user.email || "Member" });

/** "Coach", "Parent · Admin", … */
export const roleText = (role: SquadRole, admin?: boolean) => `${ROLE_LABEL[role] ?? "Parent"}${admin ? " · Admin" : ""}`;

/** Whether the signed-in person is an app-wide administrator (set in the Firebase console). */
export function useAppAdmin(): boolean {
  const { profile } = useAuth();
  return profile?.role === "administrator";
}

/** The squads this person is in for a sport. null while loading. */
export function useMySquads(sport: string): [MySquad[] | null, () => void] {
  const { user } = useAuth();
  const [list, setList] = useState<MySquad[] | null>(null);
  const load = () => {
    if (!user) return setList([]);
    listMySquads(user.uid, sport).then(setList).catch(() => setList([]));
  };
  useEffect(load, [user, sport]); // eslint-disable-line react-hooks/exhaustive-deps
  return [list, load];
}

function RolePicker({ value, onChange }: { value: SquadRole | null; onChange: (r: SquadRole) => void }) {
  return (
    <div className="field">
      I am the
      <div className="seg" role="group" aria-label="Your role">
        {ROLES.map((r) => <button key={r} type="button" aria-pressed={value === r} onClick={() => onChange(r)}>{ROLE_LABEL[r]}</button>)}
      </div>
    </div>
  );
}

/** The "Teams" / "Players" block on a sport's menu. */
export function SquadSection({ sport, words }: { sport: string; words: SquadWords }) {
  const [list, reload] = useMySquads(sport);
  const [sheet, setSheet] = useState<"create" | "join" | null>(null);
  const appAdmin = useAppAdmin();
  return (
    <section className="squads">
      {list === null && <p className="muted small">Loading…</p>}
      {list?.length === 0 && (
        <p className="muted small">
          Create a {words.one} to share matches with the coach, parents and players, or join one with a code.
          If nobody has created yours yet, you can: the coach can join it later.
        </p>
      )}
      {list?.map((s) => (
        <button key={s.id} className="list-row" onClick={() => navigate(`/squad/${s.id}`)}>
          <span>{s.name}</span>
          <span className="badge">{roleText(s.role, s.admin)}</span>
        </button>
      ))}
      <div className="row-buttons">
        <button className="btn small" onClick={() => setSheet("create")}>Create {words.one}</button>
        <button className="btn small" onClick={() => setSheet("join")}>Join with a code</button>
      </div>
      {appAdmin && <AllSquads sport={sport} words={words} />}
      {sheet === "create" && <CreateSheet sport={sport} words={words} onClose={() => setSheet(null)} onDone={reload} />}
      {sheet === "join" && <JoinSheet sport={sport} words={words} onClose={() => setSheet(null)} onDone={reload} />}
    </section>
  );
}

/** App-wide administrators: every team or player for the sport, for support. */
function AllSquads({ sport, words }: { sport: string; words: SquadWords }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Squad[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open || list) return;
    listAllSquads(sport).then(setList).catch(() => setError("Could not load them."));
  }, [open, list, sport]);
  return (
    <div className="all-squads">
      <button className="link small" onClick={() => setOpen((o) => !o)}>{open ? "Hide" : "Show"} all {words.many} (administrator)</button>
      {open && (
        <div className="stack" style={{ gap: 8 }}>
          {error && <p className="message">{error}</p>}
          {!list && !error && <p className="muted small">Loading…</p>}
          {list?.length === 0 && <p className="muted small">No {words.many} yet.</p>}
          {list?.map((s) => (
            <button key={s.id} className="list-row" onClick={() => navigate(`/squad/${s.id}`)}>
              <span>{s.name}</span>
              <span className="muted small">{s.joinCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSheet({ sport, words, onClose, onDone }: { sport: string; words: SquadWords; onClose: () => void; onDone: () => void }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<SquadRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const create = async () => {
    if (!user) return;
    if (!name.trim()) return setError(`Enter the ${words.one}'s name.`);
    if (!role) return setError("Choose whether you are the coach, a parent or the player.");
    setBusy(true);
    try {
      const s = await createSquad(sport, name.trim().slice(0, 60), me(user, profile?.name), role);
      onDone();
      onClose();
      navigate(`/squad/${s.id}`);
    } catch {
      setError("Could not create it. Check your connection and try again.");
      setBusy(false);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <h2>Create a {words.one}</h2>
      <p className="muted small">You'll be its administrator: you get a code to share, and only people with the code can join. Anyone can create it, the coach can join later.</p>
      <label className="field">{words.nameLabel}<input type="text" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={words.placeholder} autoFocus /></label>
      <RolePicker value={role} onChange={setRole} />
      {error && <p className="message">{error}</p>}
      <button className="btn primary block" disabled={busy} onClick={create}>{busy ? "Creating…" : `Create ${words.one}`}</button>
    </Sheet>
  );
}

function JoinSheet({ sport, words, onClose, onDone }: { sport: string; words: SquadWords; onClose: () => void; onDone: () => void }) {
  const { user, profile } = useAuth();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<CodeInfo | null>(null);
  const [role, setRole] = useState<SquadRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const check = async () => {
    setError("");
    setBusy(true);
    try {
      const info = await lookUpCode(code);
      if (!info) setError("That code wasn't found. Check it with whoever shared it.");
      else if (info.sport !== sport) setError(`That code is for ${info.sport}, not this sport.`);
      else setFound(info);
    } catch {
      setError("Could not check the code. Check your connection and try again.");
    }
    setBusy(false);
  };
  const join = async () => {
    if (!user || !found) return;
    if (!role) return setError("Choose whether you are the coach, a parent or the player.");
    setBusy(true);
    try {
      const s = await joinSquad(found, me(user, profile?.name), role);
      onDone();
      onClose();
      navigate(`/squad/${s.id}`);
    } catch (err) {
      setError(isDenied(err) ? "That code has been changed. Ask for the new one." : "Could not join. Check your connection and try again.");
      setBusy(false);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <h2>Join a {words.one}</h2>
      {!found ? (
        <>
          <label className="field">Join code<input className="code-input" type="text" inputMode="text" autoCapitalize="characters" autoComplete="off" value={code} maxLength={8} onChange={(e) => setCode(e.target.value)} placeholder="6 letters or numbers" autoFocus /></label>
          {error && <p className="message">{error}</p>}
          <button className="btn primary block" disabled={busy || code.trim().length < 6} onClick={check}>{busy ? "Checking…" : "Continue"}</button>
        </>
      ) : (
        <>
          <p>Join <strong>{found.name}</strong>? You'll see its matches and can capture new ones.</p>
          <RolePicker value={role} onChange={setRole} />
          {role === "coach" && <p className="muted small">You join as a parent until an administrator of {found.name} approves you as coach.</p>}
          {error && <p className="message">{error}</p>}
          <button className="btn primary block" disabled={busy} onClick={join}>{busy ? "Joining…" : `Join ${found.name}`}</button>
        </>
      )}
    </Sheet>
  );
}

type Ask =
  | { kind: "remove"; m: Member } | { kind: "leave" } | { kind: "code" } | { kind: "manage"; m: Member } | { kind: "mine" };

/** One team or player: its join code (administrators), who is in it, roles, and leaving or removing people. */
export function SquadScreen({ id, words, sportName }: { id: string; words: (sport: string) => SquadWords | undefined; sportName: (sport: string) => string }) {
  const { user } = useAuth();
  const appAdmin = useAppAdmin();
  const [squad, setSquad] = useState<Squad | null | "gone">(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const s = await getSquad(id);
      if (!s) return setSquad("gone");
      setSquad(s);
      setMembers(await listMembers(id));
    } catch (err) {
      setSquad(isDenied(err) ? "gone" : null);
    }
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (squad === "gone") {
    return <><BackLink to="/teams" label="Teams & players" /><p className="muted">You're not in this team or player any more.</p></>;
  }
  if (!squad || !user) return <p className="muted center">Loading…</p>;

  const w = words(squad.sport) ?? { one: "team", many: "teams", nameLabel: "Name", placeholder: "" };
  const mine = members.find((m) => m.uid === user.uid);
  const admin = appAdmin || isSquadAdmin(mine, squad);
  const isCreator = squad.coachUid === user.uid;
  const requests = members.filter((m) => m.requested === "coach");
  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try { await fn(); } catch { setError("That didn't work. Check your connection and try again."); }
    load();
  };
  const share = async () => {
    const text = `Join ${squad.name} on MatchIQ: open https://matchiq-9f263.web.app, choose ${sportName(squad.sport)}, tap "Join with a code" and enter ${squad.joinCode}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { /* cancelled */ }
  };

  return (
    <>
      <BackLink to="/teams" label="Teams & players" />
      <h2>{squad.name}</h2>
      <p className="muted small">
        {cap(w.one)} · {mine ? <>you are {mine.role === "parent" ? "a parent" : `the ${ROLE_LABEL[mine.role].toLowerCase()}`}{isSquadAdmin(mine, squad) ? " and an administrator" : ""}</> : "you are viewing as app administrator"}
        {mine?.requested === "coach" && " · waiting for approval as coach"}
      </p>
      {error && <p className="message">{error}</p>}

      {admin && requests.length > 0 && (
        <div className="card">
          <h3>Asked to be coach</h3>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {requests.map((m) => (
              <div key={m.uid} className="list-row static">
                <span>{m.name}</span>
                <span className="row-buttons" style={{ flex: "none" }}>
                  <button className="btn small primary" onClick={() => act(() => updateMember(squad.id, m.uid, { role: "coach" }))}>Approve</button>
                  <button className="btn small" onClick={() => act(() => updateMember(squad.id, m.uid, { clearRequest: true }))}>Decline</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {admin && (
        <div className="card code-card">
          <span className="muted small">Join code</span>
          <span className="join-code">{squad.joinCode}</span>
          <p className="muted small">Share this with the coach, parents and players. Anyone with the code can join, see this {w.one}'s matches and capture new ones. Joining as coach needs your approval.</p>
          <div className="row-buttons">
            <button className="btn small primary" onClick={share}>{copied ? "Copied" : "Share code"}</button>
            <button className="btn small" onClick={() => setAsk({ kind: "code" })}>New code</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>People ({members.length})</h3>
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          {members.map((m) => {
            const self = m.uid === user.uid;
            const canManage = admin && !self && m.uid !== squad.coachUid;
            const tap = self ? () => setAsk({ kind: "mine" }) : canManage ? () => setAsk({ kind: "manage", m }) : undefined;
            return (
              <button key={m.uid} className={`list-row${tap ? "" : " static"}`} disabled={!tap} onClick={tap}>
                <span>{m.name}{self ? " (you)" : ""}{m.uid === squad.coachUid ? <span className="muted small"> · created it</span> : null}</span>
                <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className="badge">{roleText(m.role, isSquadAdmin(m, squad))}</span>
                  {m.requested === "coach" && <span className="badge pending">Asked to be coach</span>}
                </span>
              </button>
            );
          })}
        </div>
        {admin && <p className="muted small" style={{ marginTop: 8 }}>Tap someone to change their role, make them an administrator or remove them.</p>}
      </div>

      {mine && !isCreator && <button className="btn block" onClick={() => setAsk({ kind: "leave" })}>Leave {squad.name}</button>}

      {ask?.kind === "manage" && (
        <ManageSheet m={ask.m} squadName={squad.name} onClose={() => setAsk(null)}
          onRole={(role) => act(() => updateMember(squad.id, ask.m.uid, { role }))}
          onAdmin={(a) => act(() => updateMember(squad.id, ask.m.uid, { admin: a }))}
          onRemove={() => setAsk({ kind: "remove", m: ask.m })} />
      )}
      {ask?.kind === "mine" && mine && (
        <MySheet m={mine} admin={isSquadAdmin(mine, squad)} squadName={squad.name} onClose={() => setAsk(null)}
          onRole={(role) => act(() => setMyRole(squad.id, user.uid, role, isSquadAdmin(mine, squad)))} />
      )}
      {ask?.kind === "remove" && (
        <Confirm title={`Remove ${ask.m.name}?`} body={`They will no longer see ${squad.name}'s matches. Matches they captured stay. To stop them rejoining, also make a new code.`} confirmLabel="Remove" danger
          onConfirm={() => act(() => removeMember(squad.id, ask.m.uid))} onClose={() => setAsk(null)} />
      )}
      {ask?.kind === "leave" && (
        <Confirm title={`Leave ${squad.name}?`} body={`Its matches will be removed from this phone. You can rejoin later with the code.`} confirmLabel="Leave" danger
          onConfirm={async () => { await leaveSquad(squad.id, user.uid); await dropSquadLocal(squad.id, user.uid); navigate("/teams"); }} onClose={() => setAsk(null)} />
      )}
      {ask?.kind === "code" && (
        <Confirm title="Make a new code?" body="The old code stops working. Everyone already in stays in." confirmLabel="New code"
          onConfirm={() => act(async () => { await changeCode(squad); setCopied(false); })} onClose={() => setAsk(null)} />
      )}
    </>
  );
}

function ManageSheet({ m, squadName, onClose, onRole, onAdmin, onRemove }: {
  m: Member; squadName: string; onClose: () => void; onRole: (r: SquadRole) => void; onAdmin: (a: boolean) => void; onRemove: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <h2>{m.name}</h2>
      {m.requested === "coach" && <p className="muted small">Asked to be coach. Choose Coach to approve.</p>}
      <RolePicker value={m.role} onChange={(r) => { onRole(r); onClose(); }} />
      <button className="btn block" onClick={() => { onAdmin(!m.admin); onClose(); }}>
        {m.admin ? "Remove as administrator" : `Make an administrator of ${squadName}`}
      </button>
      <p className="muted small">Administrators share the code, approve coaches, change roles and remove people. Coaches can delete any match.</p>
      <button className="btn danger block" onClick={() => { onClose(); onRemove(); }}>Remove from {squadName}</button>
    </Sheet>
  );
}

function MySheet({ m, admin, squadName, onClose, onRole }: { m: Member; admin: boolean; squadName: string; onClose: () => void; onRole: (r: SquadRole) => void }) {
  return (
    <Sheet onClose={onClose}>
      <h2>Your role in {squadName}</h2>
      <RolePicker value={m.role} onChange={(r) => { if (r !== m.role) onRole(r); onClose(); }} />
      {!admin && <p className="muted small">Choosing Coach asks an administrator to approve it.</p>}
    </Sheet>
  );
}

/** On a new-match screen: who the match is shared with. Returns the chosen squad (or null for "only me"). */
export function SquadPicker({ sport, words, value, onChange }: { sport: string; words: SquadWords; value: string; onChange: (s: MySquad | null) => void }) {
  const [list] = useMySquads(sport);
  useEffect(() => {
    // Start on the last one used, or the only one there is.
    if (!list || value) return;
    let last = "";
    try { last = localStorage.getItem(`matchiq.${sport}.squad`) ?? ""; } catch { /* private mode */ }
    const pick = list.find((s) => s.id === last) ?? (list.length === 1 ? list[0] : undefined);
    if (pick) onChange(pick);
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!list || list.length === 0) return null;
  return (
    <label className="field">
      Share with
      <select value={value} onChange={(e) => {
        const s = list.find((x) => x.id === e.target.value) ?? null;
        try { localStorage.setItem(`matchiq.${sport}.squad`, s?.id ?? ""); } catch { /* private mode */ }
        onChange(s);
      }}>
        {list.map((s) => <option key={s.id} value={s.id}>{s.name} ({words.one})</option>)}
        <option value="">Only me</option>
      </select>
    </label>
  );
}
