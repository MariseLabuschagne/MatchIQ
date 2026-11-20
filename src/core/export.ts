/** Downloads and shares for match reports. Libraries load only when used, keeping the live screen light. */

export function safeName(...parts: string[]): string {
  return parts.filter(Boolean).join("-").replace(/[^a-z0-9-]+/gi, "_").slice(0, 80);
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadCsv(rows: (string | number | null | undefined)[][], filename: string): void {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = rows.map((r) => r.map(esc).join(",")).join("\n");
  download(new Blob([text], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/** Renders an element to a multi-page A4 PDF. */
export async function exportPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(el, { backgroundColor: "#020617", scale: 2, useCORS: true });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW - 16, imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.92);
  let y = 0;
  while (y < imgH) {
    if (y > 0) pdf.addPage();
    pdf.setFillColor(2, 6, 23);
    pdf.rect(0, 0, pageW, pageH, "F");
    pdf.addImage(img, "JPEG", 8, 8 - y, imgW, imgH);
    y += pageH - 16;
  }
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
