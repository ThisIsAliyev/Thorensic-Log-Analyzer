import jsPDF from "jspdf";
// @ts-ignore
import "jspdf-autotable";

export interface ReportKPIs {
  label: string;
  value: string;
}

export interface ReportTable {
  title: string;
  columns: string[];
  rows: any[][];
}

export interface ReportChart {
  title: string;
  dataUrl: string;
}

export function buildOpsReportPDF({
  title,
  period,
  kpis,
  tables,
  charts,
}: {
  title: string;
  period: string;
  kpis: ReportKPIs[];
  tables: ReportTable[];
  charts?: ReportChart[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 60;

  // Cover
  doc.setFontSize(20);
  doc.text(title, 40, y);
  y += 30;

  doc.setFontSize(12);
  doc.text(`Period: ${period}`, 40, y);
  y += 30;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
  y += 40;

  // KPIs
  if (kpis.length > 0) {
    doc.setFontSize(14);
    doc.text("Key Performance Indicators", 40, y);
    y += 20;

    doc.setFontSize(11);
    kpis.forEach((kpi) => {
      doc.text(`${kpi.label}: ${kpi.value}`, 40, y);
      y += 18;
    });
    y += 20;
  }

  // Tables
  tables.forEach((table) => {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 60;
    }

    doc.setFontSize(12);
    doc.text(table.title, 40, y);
    y += 20;

    // @ts-ignore
    doc.autoTable({
      startY: y,
      head: [table.columns],
      body: table.rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 36, 54] },
      margin: { left: 40, right: 40 },
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 24;
  });

  // Charts as images
  if (charts && charts.length > 0) {
    charts.forEach((chart) => {
      doc.addPage();
      y = 60;

      doc.setFontSize(14);
      doc.text(chart.title, 40, y);
      y += 30;

      try {
        const imgWidth = pageWidth - 80;
        const imgHeight = (imgWidth * 3) / 4; // 4:3 aspect ratio
        doc.addImage(chart.dataUrl, "PNG", 40, y, imgWidth, imgHeight);
      } catch (error) {
        console.error("Failed to add chart image:", error);
        doc.setFontSize(10);
        doc.text("Chart image unavailable", 40, y);
      }
    });
  }

  return doc;
}

