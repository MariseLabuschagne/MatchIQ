import type { Insight } from "./types";

/**
 * A printable match report, described as data. Each sport builds one of these from its stats
 * (see src/sports/<sport>/report.ts) and `exportReportPdf` lays it out as a clean A4 document:
 * white pages, the MatchIQ logo, aligned tables that break across pages, and page numbers.
 * jsPDF loads only when someone exports.
 */

export interface ReportDoc {
  /** e.g. "U14A vs Rivals" */
  title: string;
  /** e.g. "Hockey match report" */
  kind: string;
  /** e.g. ["21 Nov 2026", "League", "Home"] */
  meta: string[];
  /** The headline result, e.g. "3 – 1" or "6–4  6–3". */
  result: string;
  /** e.g. "U14A won" or "Match in progress". */
  resultNote?: string;
  sections: ReportSection[];
}

export type ReportSection =
  | { kind: "kpis"; title: string; items: { label: string; value: string }[] }
  | { kind: "table"; title: string; head: string[]; rows: ReportRow[]; note?: string; boldLast?: boolean }
  | { kind: "insights"; title: string; groups: { title: string; items: Insight[] }[] }
  | { kind: "text"; title: string; body: string };

/** A table row: cells as text. `indent` nests the label; `head` is a sub-heading row. */
export interface ReportRow { cells: string[]; indent?: 0 | 1 | 2; head?: boolean; dim?: number[] }

// ---- layout constants (mm, pt, RGB) ----
const PAGE_W = 210, PAGE_H = 297, M = 16, CONTENT_W = PAGE_W - 2 * M, FOOT = 12;
const INK: RGB = [15, 23, 42], GREY: RGB = [100, 116, 139], LIGHT: RGB = [148, 163, 184];
const TEAL: RGB = [13, 148, 136], RULE: RGB = [226, 232, 240], HEAD_BG: RGB = [241, 245, 249], ZEBRA: RGB = [248, 250, 252];
const TONE: Record<Insight["kind"], RGB> = { strength: [22, 163, 74], workon: [234, 88, 12], plan: TEAL, info: [71, 85, 105] };
type RGB = [number, number, number];

/** Standard PDF fonts cover Latin-1 plus a few typographic marks; swap anything else. */
function clean(s: string): string {
  return s
    .replace(/→/g, "to")
    .replace(/[←↑↓]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadLogo(): Promise<{ data: string; ratio: number } | null> {
  try {
    const blob = await (await fetch("./matchiq-logo.jpeg")).blob();
    const data = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
    const ratio = await new Promise<number>((res) => {
      const img = new Image();
      img.onload = () => res(img.naturalWidth / img.naturalHeight || 1);
      img.onerror = () => res(1);
      img.src = data;
    });
    return { data, ratio };
  } catch {
    return null;
  }
}

export async function exportReportPdf(doc: ReportDoc, filename: string): Promise<void> {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), loadLogo()]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawReport(pdf, doc, logo);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

type Pdf = InstanceType<typeof import("jspdf").jsPDF>;

/** Lays the report out on an empty jsPDF document. Separate from loading, so it can be tested in Node. */
export function drawReport(pdf: Pdf, doc: ReportDoc, logo: { data: string; ratio: number } | null): void {
  let y = M;

  const color = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
  const font = (size: number, style: "normal" | "bold" = "normal", c: RGB = INK) => { pdf.setFont("helvetica", style); pdf.setFontSize(size); color(c); };
  const lineH = (size: number) => size * 0.3528 * 1.35; // pt → mm with leading
  const room = (h: number) => y + h <= PAGE_H - M - FOOT;
  const newPage = () => { pdf.addPage(); y = M; };
  const ensure = (h: number) => { if (!room(h)) newPage(); };
  const wrap = (text: string, width: number): string[] => pdf.splitTextToSize(clean(text), width) as string[];

  // ---- header ----
  const logoH = 18;
  if (logo) pdf.addImage(logo.data, "JPEG", M, y, logoH * logo.ratio, logoH);
  const tx = M + (logo ? logoH * logo.ratio + 6 : 0);
  font(8, "bold", TEAL);
  pdf.text(clean(doc.kind).toUpperCase(), tx, y + 4.5, { charSpace: 0.4 });
  font(17, "bold");
  const titleLines = wrap(doc.title, PAGE_W - M - tx);
  pdf.text(titleLines[0] ?? "", tx, y + 11.5);
  font(9, "normal", GREY);
  pdf.text(clean(doc.meta.filter(Boolean).join("  ·  ")), tx, y + 17);
  y += logoH + 6;

  // ---- result band ----
  pdf.setFillColor(HEAD_BG[0], HEAD_BG[1], HEAD_BG[2]);
  pdf.roundedRect(M, y, CONTENT_W, 18, 2, 2, "F");
  pdf.setFillColor(TEAL[0], TEAL[1], TEAL[2]);
  pdf.rect(M, y, 1.4, 18, "F");
  font(20, "bold");
  pdf.text(clean(doc.result), M + 7, y + 11.5);
  if (doc.resultNote) {
    font(10, "normal", GREY);
    pdf.text(clean(doc.resultNote), PAGE_W - M - 6, y + 11, { align: "right" });
  }
  y += 18 + 8;

  const heading = (title: string, need: number) => {
    ensure(lineH(11.5) + 4 + need);
    font(11.5, "bold");
    pdf.text(clean(title), M, y + 4);
    y += lineH(11.5) + 1.5;
    pdf.setDrawColor(TEAL[0], TEAL[1], TEAL[2]);
    pdf.setLineWidth(0.5);
    pdf.line(M, y, M + 14, y);
    y += 4;
  };

  for (const sec of doc.sections) {
    if (sec.kind === "kpis") {
      const per = Math.min(4, sec.items.length) || 1, gap = 3, w = (CONTENT_W - gap * (per - 1)) / per, h = 17;
      const rows = Math.ceil(sec.items.length / per);
      heading(sec.title, h);
      sec.items.forEach((it, i) => {
        const col = i % per;
        if (col === 0 && i > 0) y += h + gap;
        if (col === 0) ensure(h);
        const x = M + col * (w + gap);
        pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(x, y, w, h, 1.5, 1.5, "S");
        font(14, "bold", TEAL);
        pdf.text(clean(it.value), x + 3.5, y + 7.5);
        font(7.5, "normal", GREY);
        pdf.text(wrap(it.label, w - 7).slice(0, 2), x + 3.5, y + 12);
      });
      y += (rows ? h : 0) + 8;
    }

    if (sec.kind === "table") {
      const cols = sec.head.length;
      const firstW = cols <= 2 ? CONTENT_W * 0.7 : cols === 3 ? CONTENT_W * 0.5 : Math.max(CONTENT_W * 0.36, CONTENT_W - (cols - 1) * 22);
      const otherW = cols > 1 ? (CONTENT_W - firstW) / (cols - 1) : 0;
      const rowH = 6.2;
      const colX = (c: number) => (c === 0 ? M : M + firstW + otherW * c); // right edge for c ≥ 1
      const drawHead = () => {
        pdf.setFillColor(HEAD_BG[0], HEAD_BG[1], HEAD_BG[2]);
        pdf.rect(M, y, CONTENT_W, rowH, "F");
        font(8, "bold", GREY);
        sec.head.forEach((h, c) => {
          if (c === 0) pdf.text(clean(h), M + 2, y + 4.2);
          else pdf.text(clean(h), colX(c) - 2, y + 4.2, { align: "right" });
        });
        y += rowH;
      };
      // Keep a table on one page when it fits on one; otherwise let it run on, repeating the header.
      const tableH = lineH(11.5) + 5.5 + rowH * (sec.rows.length + 1) + 6;
      if (!room(tableH) && tableH <= PAGE_H - 2 * M - FOOT) newPage();
      heading(sec.title, rowH * 3);
      drawHead();
      sec.rows.forEach((r, i) => {
        if (!room(rowH)) { newPage(); drawHead(); }
        if (i % 2 === 1) { pdf.setFillColor(ZEBRA[0], ZEBRA[1], ZEBRA[2]); pdf.rect(M, y, CONTENT_W, rowH, "F"); }
        r.cells.forEach((cell, c) => {
          const dim = r.dim?.includes(c);
          if (c === 0) {
            font(8.5, r.head || !r.indent ? "bold" : "normal", r.indent === 2 ? GREY : INK);
            pdf.text(wrap(cell, firstW - 4 - (r.indent ?? 0) * 4)[0] ?? "", M + 2 + (r.indent ?? 0) * 4, y + 4.2);
          } else {
            font(8.5, sec.boldLast && c === cols - 1 ? "bold" : "normal", dim ? LIGHT : INK);
            pdf.text(clean(cell), colX(c) - 2, y + 4.2, { align: "right" });
          }
        });
        y += rowH;
      });
      pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
      pdf.setLineWidth(0.3);
      pdf.line(M, y, M + CONTENT_W, y);
      y += 3;
      if (sec.note) {
        font(7.5, "normal", GREY);
        for (const l of wrap(sec.note, CONTENT_W)) { ensure(lineH(7.5)); pdf.text(l, M, y + 2.5); y += lineH(7.5); }
      }
      y += 6;
    }

    if (sec.kind === "insights") {
      heading(sec.title, 12);
      if (!sec.groups.some((g) => g.items.length)) {
        font(9, "normal", GREY);
        pdf.text("Not enough captured yet to spot clear patterns.", M, y + 3);
        y += lineH(9) + 6;
      }
      for (const g of sec.groups) {
        if (!g.items.length) continue;
        ensure(lineH(8) + 12);
        font(8, "bold", GREY);
        pdf.text(clean(g.title).toUpperCase(), M, y + 3, { charSpace: 0.3 });
        y += lineH(8) + 1;
        for (const it of g.items) {
          const lines = wrap(it.detail, CONTENT_W - 8);
          const h = lineH(9.5) + lines.length * lineH(8.5) + 2;
          ensure(h);
          const tone = TONE[it.kind] ?? TEAL;
          pdf.setFillColor(tone[0], tone[1], tone[2]);
          pdf.rect(M, y + 0.5, 1.2, h - 2.5, "F");
          font(9.5, "bold");
          pdf.text(clean(it.title), M + 4.5, y + 3.6);
          font(8.5, "normal", GREY);
          lines.forEach((l, i) => pdf.text(l, M + 4.5, y + 3.6 + lineH(9.5) + i * lineH(8.5)));
          y += h + 1.5;
        }
        y += 2;
      }
      y += 4;
    }

    if (sec.kind === "text" && sec.body.trim()) {
      const lines = wrap(sec.body, CONTENT_W);
      heading(sec.title, lineH(9.5) * Math.min(lines.length, 3));
      font(9.5);
      for (const l of lines) { ensure(lineH(9.5)); pdf.text(l, M, y + 3); y += lineH(9.5); }
      y += 6;
    }
  }

  // ---- footer on every page ----
  const pages = pdf.getNumberOfPages();
  const made = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
    pdf.setLineWidth(0.3);
    pdf.line(M, PAGE_H - M + 2, PAGE_W - M, PAGE_H - M + 2);
    font(7.5, "normal", LIGHT);
    pdf.text(clean(`MatchIQ  ·  ${doc.title}  ·  made ${made}`), M, PAGE_H - M + 6.5);
    pdf.text(`Page ${p} of ${pages}`, PAGE_W - M, PAGE_H - M + 6.5, { align: "right" });
  }
}
