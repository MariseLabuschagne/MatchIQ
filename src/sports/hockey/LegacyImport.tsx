import { useState } from "react";
import { useAuth } from "../../core/auth/AuthProvider";
import { importLegacyMatches } from "./importLegacy";

/**
 * History panel for v2 hockey matches. They are imported automatically the first time
 * someone opens v3; this button is for checking again (e.g. after using the old app).
 */
export function LegacyImport({ onChanged }: { onChanged: () => void }) {
  const { user } = useAuth();
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setMsg(null);
    const { added, skipped, found, cloudFailed } = await importLegacyMatches(user?.uid ?? null);
    setBusy(false);
    const text = `${added} match${added === 1 ? "" : "es"} imported${skipped ? `, ${skipped} softball skipped` : ""}.${found && !added ? " Everything was already here." : ""}`;
    setMsg(cloudFailed ? { text: `Could not reach the cloud; only matches saved in this browser were checked. ${text}` } : { ok: true, text });
    onChanged();
  };

  return (
    <section className="card stack" style={{ marginTop: 16 }}>
      <h3>Matches from the old app</h3>
      <p className="muted small">Your earlier hockey matches are copied in automatically. Check again here if you have used the old app since. The old app and its data are not changed.</p>
      {msg && <p className={`message${msg.ok ? " ok" : ""}`}>{msg.text}</p>}
      <button className="btn block" disabled={busy} onClick={run}>{busy ? "Checking…" : "Check for old matches"}</button>
    </section>
  );
}
