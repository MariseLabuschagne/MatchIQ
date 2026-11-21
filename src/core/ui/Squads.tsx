import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { navigate } from "../router";
import {
  changeCode, createSquad, getSquad, isDenied, joinSquad, leaveSquad, listMembers, listMySquads, lookUpCode, removeMember,
  type CodeInfo, type Member, type MySquad, type Squad
} from "../squads";
import { dropSquadLocal } from "../storage/local";
import { Confirm, Sheet, Topbar } from "./components";

/** Words for a sport's squads, e.g. { one: "team", many: "teams" }. Comes from the SportModule. */
export interface SquadWords { one: string; many: string; nameLabel: string; placeholder: string }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const me = (user: { uid: string; displayName: string | null; email: string | null }, profileName?: string) =>
  ({ uid: user.uid, name: profileName || user.displayName || user.email || "Member" });

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

/** The "Teams" / "Players" block on a sport's menu. */
export function SquadSection({ sport, words }: { sport: string; words: SquadWords }) {
  const [list, reload] = useMySquads(sport);
  const [sheet, setSheet] = useState<"create" | "join" | null>(null);
  return (
    <section className="squads">
      <h3>Your {words.many}</h3>
      {list === null && <p className="muted small">Loading…</p>}
      {list?.length === 0 && (
        <p className="muted small">
          Create a {words.one} to share matches with other parents and the coach, or join one with a code.
        </p>
      )}
      {list?.map((s) => (
        <button key={s.id} className="list-row" onClick={() => navigate(`/squad/${s.id}`)}>
          <span>{s.name}</span>
          <span className="badge">{s.role === "coach" ? "Coach" : "Parent"}</span>
        </button>
      ))}
      <div className="row-buttons">
        <button className="btn small" onClick={() => setSheet("create")}>Create {words.one}</button>
        <button className="btn small" onClick={() => setSheet("join")}>Join with a code</button>
      </div>
      {sheet === "create" && <CreateSheet sport={sport} words={words} onClose={() => setSheet(null)} onDone={reload} />}
      {sheet === "join" && <JoinSheet sport={sport} words={words} onClose={() => setSheet(null)} onDone={reload} />}
    </section>
  );
}

function CreateSheet({ sport, words, onClose, onDone }: { sport: string; words: SquadWords; onClose: () => void; onDone: () => void }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const create = async () => {
    if (!user) return;
    if (!name.trim()) return setError(`Enter the ${words.one}'s name.`);
    setBusy(true);
    try {
      const s = await createSquad(sport, name.trim().slice(0, 60), me(user, profile?.name));
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
      <p className="muted small">You'll be its coach. You get a code to share, and only people with the code can join.</p>
      <label className="field">{words.nameLabel}<input type="text" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={words.placeholder} autoFocus /></label>
      {error && <p className="message">{error}</p>}
      <button className="btn primary block" disabled={busy} onClick={create}>{busy ? "Creating…" : `Create ${words.one}`}</button>
    </Sheet>
  );
}

function JoinSheet({ sport, words, onClose, onDone }: { sport: string; words: SquadWords; onClose: () => void; onDone: () => void }) {
  const { user, profile } = useAuth();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<CodeInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const check = async () => {
    setError("");
    setBusy(true);
    try {
      const info = await lookUpCode(code);
      if (!info) setError("That code wasn't found. Check it with the coach.");
      else if (info.sport !== sport) setError(`That code is for ${info.sport}, not this sport.`);
      else setFound(info);
    } catch {
      setError("Could not check the code. Check your connection and try again.");
    }
    setBusy(false);
  };
  const join = async () => {
    if (!user || !found) return;
    setBusy(true);
    try {
      const s = await joinSquad(found, me(user, profile?.name));
      onDone();
      onClose();
      navigate(`/squad/${s.id}`);
    } catch (err) {
      setError(isDenied(err) ? "That code has been changed. Ask the coach for the new one." : "Could not join. Check your connection and try again.");
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
          <p>Join <strong>{found.name}</strong>? You'll see its matches and can capture new ones. The coach can see that you joined.</p>
          {error && <p className="message">{error}</p>}
          <button className="btn primary block" disabled={busy} onClick={join}>{busy ? "Joining…" : `Join ${found.name}`}</button>
        </>
      )}
    </Sheet>
  );
}

/** One team or player: its join code (coach), who is in it, and leaving or removing people. */
export function SquadScreen({ id, words, sportName }: { id: string; words: (sport: string) => SquadWords | undefined; sportName: (sport: string) => string }) {
  const { user } = useAuth();
  const [squad, setSquad] = useState<Squad | null | "gone">(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [confirm, setConfirm] = useState<{ kind: "remove"; m: Member } | { kind: "leave" } | { kind: "code" } | null>(null);
  const [copied, setCopied] = useState(false);

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
    return <><Topbar /><p className="muted">You're not in this team or player any more.</p><button className="link" onClick={() => navigate("/")}>Home</button></>;
  }
  if (!squad || !user) return <><Topbar /><p className="muted center">Loading…</p></>;

  const w = words(squad.sport) ?? { one: "team", many: "teams", nameLabel: "Name", placeholder: "" };
  const isCoach = squad.coachUid === user.uid;
  const share = async () => {
    const text = `Join ${squad.name} on MatchIQ: open https://matchiq-9f263.web.app, choose ${sportName(squad.sport)}, tap "Join with a code" and enter ${squad.joinCode}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { /* cancelled */ }
  };

  return (
    <>
      <Topbar />
      <button className="link" onClick={() => navigate(`/sport/${squad.sport}`)}>← {sportName(squad.sport)}</button>
      <h2>{squad.name}</h2>
      <p className="muted small">{cap(w.one)} · you are the {isCoach ? "coach" : "parent"}</p>

      {isCoach && (
        <div className="card code-card">
          <span className="muted small">Join code</span>
          <span className="join-code">{squad.joinCode}</span>
          <p className="muted small">Share this with parents. Anyone with the code can join, see this {w.one}'s matches and capture new ones.</p>
          <div className="row-buttons">
            <button className="btn small primary" onClick={share}>{copied ? "Copied" : "Share code"}</button>
            <button className="btn small" onClick={() => setConfirm({ kind: "code" })}>New code</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>People ({members.length})</h3>
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          {members.map((m) => (
            <div key={m.uid} className="list-row static">
              <span>{m.name}{m.uid === user.uid ? " (you)" : ""}</span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="badge">{m.role === "coach" ? "Coach" : "Parent"}</span>
                {isCoach && m.uid !== user.uid && <button className="btn small danger" onClick={() => setConfirm({ kind: "remove", m })}>Remove</button>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isCoach && <button className="btn block" onClick={() => setConfirm({ kind: "leave" })}>Leave {squad.name}</button>}

      {confirm?.kind === "remove" && (
        <Confirm title={`Remove ${confirm.m.name}?`} body={`They will no longer see ${squad.name}'s matches. Matches they captured stay. To stop them rejoining, also make a new code.`} confirmLabel="Remove" danger
          onConfirm={async () => { await removeMember(squad.id, confirm.m.uid); load(); }} onClose={() => setConfirm(null)} />
      )}
      {confirm?.kind === "leave" && (
        <Confirm title={`Leave ${squad.name}?`} body={`Its matches will be removed from this phone. You can rejoin later with the code.`} confirmLabel="Leave" danger
          onConfirm={async () => { await leaveSquad(squad.id, user.uid); await dropSquadLocal(squad.id, user.uid); navigate(`/sport/${squad.sport}`); }} onClose={() => setConfirm(null)} />
      )}
      {confirm?.kind === "code" && (
        <Confirm title="Make a new code?" body="The old code stops working. Everyone already in stays in." confirmLabel="New code"
          onConfirm={async () => { await changeCode(squad); setCopied(false); load(); }} onClose={() => setConfirm(null)} />
      )}
    </>
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
