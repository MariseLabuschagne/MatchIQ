import { useState } from "react";
import { LOCAL_UID, useAuth } from "../../core/auth/AuthProvider";
import { pullLegacyMatches } from "../../core/storage/cloud";
import { getLocal } from "../../core/storage/local";
import { saveMatch } from "../../core/storage/sync";
import type { Match } from "../../core/types";
import { convertLegacyHockey, type LegacyMatch } from "./legacy";

/** Brings v2 hockey matches across: cloud copies and any left in this browser. Originals stay untouched. */
export function LegacyImport({ onChanged }: { onChanged: () => void }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setMsg(null);
    const raws: LegacyMatch[] = [];
    let cloudFailed = false;
    try { if (uid && uid !== LOCAL_UID) raws.push(...((await pullLegacyMatches(uid)) as LegacyMatch[])); }
    catch { cloudFailed = true; }
    try { const local = JSON.parse(localStorage.getItem("matchHistory") ?? "[]"); if (Array.isArray(local)) raws.push(...local); } catch { /* nothing stored */ }
    let added = 0, skipped = 0;
    for (const raw of raws) {
      const m = convertLegacyHockey(raw);
      if (!m) { skipped++; continue; }
      if (await getLocal(m.id)) continue;
      await saveMatch(m as Match, uid, true);
      added++;
    }
    setBusy(false);
    const text = `${added} match${added === 1 ? "" : "es"} imported${skipped ? `, ${skipped} softball skipped` : ""}.${raws.length && !added ? " Everything was already here." : ""}`;
    setMsg(cloudFailed ? { text: `Could not reach the cloud; only matches saved in this browser were checked. ${text}` } : { ok: true, text });
    onChanged();
  };

  return (
    <section className="card stack" style={{ marginTop: 16 }}>
      <h3>Matches from the old app</h3>
      <p className="muted small">Copies your earlier hockey matches into this version. The old app and its data are not changed.</p>
      {msg && <p className={`message${msg.ok ? " ok" : ""}`}>{msg.text}</p>}
      <button className="btn block" disabled={busy} onClick={run}>{busy ? "Importing…" : "Import old matches"}</button>
    </section>
  );
}
