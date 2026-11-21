import { useState } from "react";

/**
 * Small column chart for season views: one group per match, one or two series.
 * Plain SVG, no library. Thin columns with rounded tops on one baseline, hairline grid,
 * a legend when there are two series, tap or hover a match to see its values,
 * and a table view so nothing depends on colour alone.
 */

export interface Series { name: string; color: string }
export interface Group { label: string; detail: string; values: (number | null)[] }

interface Props {
  title: string;
  series: Series[];
  groups: Group[];
  /** Fixed top of the scale, e.g. 100 for percentages. Otherwise from the data. */
  max?: number;
  /** A reference line, e.g. 50 for "half the points". */
  reference?: { value: number; label: string };
  format?: (v: number) => string;
}

const H = 150, PAD_L = 36, PAD_B = 22, PAD_T = 8;

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= v) return m * step;
  return 10 * step;
}

export function SeasonChart({ title, series, groups, max, reference, format = String }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 340;
  const top = max ?? niceMax(Math.max(1, ...groups.flatMap((g) => g.values.map((v) => v ?? 0))));
  const ticks = [0, top / 2, top];
  const plotW = W - PAD_L - 4, plotH = H - PAD_B - PAD_T;
  const band = plotW / Math.max(groups.length, 1);
  const barW = Math.max(3, Math.min(14, (band - 6) / series.length - 2));
  const y = (v: number) => PAD_T + plotH - (Math.min(v, top) / top) * plotH;
  // Show at most ~8 x labels so they never collide.
  const every = Math.ceil(groups.length / 8);
  const shown = active !== null ? groups[active] : null;

  return (
    <figure className="season-chart">
      <figcaption className="spread">
        <span className="chart-title">{title}</span>
        <button className="link small" onClick={() => setTable((t) => !t)}>{table ? "Chart" : "Table"}</button>
      </figcaption>
      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}
        </div>
      )}
      {table ? (
        <div className="table-wrap"><table className="period-table">
          <thead><tr><th>Match</th>{series.map((s) => <th key={s.name}>{s.name}</th>)}</tr></thead>
          <tbody>{groups.map((g, i) => <tr key={i}><td>{g.detail}</td>{g.values.map((v, j) => <td key={j}>{v === null ? "–" : format(v)}</td>)}</tr>)}</tbody>
        </table></div>
      ) : (
        <>
          <p className="chart-readout" aria-live="polite">
            {shown ? <>{shown.detail}: {series.map((s, j) => `${series.length > 1 ? s.name + " " : ""}${shown.values[j] === null ? "–" : format(shown.values[j]!)}`).join(" · ")}</> : <span className="muted">Tap a match to see its numbers</span>}
          </p>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${title}, ${groups.length} matches`} onMouseLeave={() => setActive(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD_L} x2={W - 4} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
                <text x={PAD_L - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">{format(t)}</text>
              </g>
            ))}
            {reference && (
              <g>
                <line x1={PAD_L} x2={W - 4} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--muted)" strokeWidth="1" />
                <text x={W - 6} y={y(reference.value) - 4} textAnchor="end" fontSize="10" fill="var(--muted)">{reference.label}</text>
              </g>
            )}
            {groups.map((g, i) => {
              const x0 = PAD_L + i * band;
              const inner = series.length * barW + (series.length - 1) * 2;
              return (
                <g key={i} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} style={{ cursor: "pointer" }}>
                  {/* hit target: the whole band, bigger than the marks */}
                  <rect x={x0} y={PAD_T} width={band} height={plotH} fill={active === i ? "rgba(148,163,184,0.10)" : "transparent"} />
                  {g.values.map((v, j) => {
                    if (v === null) return null;
                    const bx = x0 + (band - inner) / 2 + j * (barW + 2), by = y(v), bh = PAD_T + plotH - by;
                    const r = Math.min(4, barW / 2, bh);
                    // Rounded top, square at the baseline.
                    const d = bh <= 0 ? "" : `M${bx},${by + bh} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + barW - r} Q${bx + barW},${by} ${bx + barW},${by + r} V${by + bh} Z`;
                    return d ? <path key={j} d={d} fill={series[j].color} /> : null;
                  })}
                  {i % every === 0 && <text x={x0 + band / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">{g.label}</text>}
                </g>
              );
            })}
          </svg>
        </>
      )}
    </figure>
  );
}
