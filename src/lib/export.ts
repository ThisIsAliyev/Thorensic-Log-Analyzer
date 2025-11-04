import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function exportJSON(name: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  saveAs(blob, ensure(name, "json"));
}

export function exportCSV(name: string, rows: any[]) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, ensure(name, "csv"));
}

export async function exportPDF(name: string, el: HTMLElement, title?: string) {
  const canvas = await html2canvas(el, { useCORS: true, backgroundColor: "#0b1220" });
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvas.width, canvas.height],
  });
  if (title) {
    pdf.setFontSize(14);
    pdf.text(title, 24, 28);
  }
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(ensure(name, "pdf"));
}

const ensure = (n: string, ext: string) =>
  n.toLowerCase().endsWith(`.${ext}`) ? n : `${n}.${ext}`;

