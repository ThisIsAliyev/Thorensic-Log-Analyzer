import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Calendar } from "lucide-react";
import { buildOpsReportPDF } from "@/lib/reportPdf";
import { sampleLogs } from "@/lib/mock-data";
import { runQuery } from "@/lib/queryEngine";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

const reports = [
  {
    id: "report-1",
    name: "Weekly Ops Summary",
    type: "Auto",
    schedule: "Weekly",
    lastGenerated: "2025-11-03T00:00:00Z",
    status: "active",
  },
  {
    id: "report-2",
    name: "Error Budget",
    type: "Auto",
    schedule: "Daily",
    lastGenerated: "2025-11-03T08:00:00Z",
    status: "active",
  },
  {
    id: "report-3",
    name: "Top Attack Patterns",
    type: "Manual",
    schedule: "On-demand",
    lastGenerated: "2025-11-02T12:00:00Z",
    status: "active",
  },
];

export default function ReportsPage() {
  const computeKPIs = () => {
    const total = sampleLogs.length;
    const err5xx = sampleLogs.filter((l) => l.status >= 500).length;
    const err4xx = sampleLogs.filter((l) => l.status >= 400 && l.status < 500).length;
    const err2xx = sampleLogs.filter((l) => l.status >= 200 && l.status < 300).length;
    
    // Compute P95 latency
    const latencies = sampleLogs.map((l) => l.latency_ms).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] || 0;

    return {
      total,
      err5xx,
      err4xx,
      err2xx,
      errorRate: ((err5xx / total) * 100).toFixed(2) + "%",
      p95Latency: p95Latency + "ms",
      successRate: ((err2xx / total) * 100).toFixed(2) + "%",
    };
  };

  const computeTop404s = () => {
    const four04s = sampleLogs.filter((l) => l.status === 404);
    const pathCounts = new Map<string, number>();
    four04s.forEach((l) => {
      pathCounts.set(l.path, (pathCounts.get(l.path) || 0) + 1);
    });
    return [...pathCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => [path, count.toString()]);
  };

  const computeTopIPs = () => {
    const ipCounts = new Map<string, number>();
    sampleLogs.forEach((l) => {
      ipCounts.set(l.ip, (ipCounts.get(l.ip) || 0) + 1);
    });
    return [...ipCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => [ip, count.toString()]);
  };

  const handleExportPDF = async (report: typeof reports[0]) => {
    try {
      const kpis = computeKPIs();
      const top404s = computeTop404s();
      const topIPs = computeTopIPs();
      
      const period = `${format(new Date(report.lastGenerated), "PP")} - ${format(new Date(), "PP")}`;
      
      const reportKPIs = [
        { label: "Total Requests", value: kpis.total.toLocaleString() },
        { label: "Success Rate (2xx)", value: kpis.successRate },
        { label: "Error Rate (5xx)", value: kpis.errorRate },
        { label: "P95 Latency", value: kpis.p95Latency },
        { label: "4xx Errors", value: kpis.err4xx.toString() },
      ];

      const tables: Array<{ title: string; columns: string[]; rows: any[][] }> = [
        {
          title: "Top 404 Paths",
          columns: ["Path", "Count"],
          rows: top404s,
        },
        {
          title: "Top IPs by Request Count",
          columns: ["IP Address", "Count"],
          rows: topIPs,
        },
      ];

      // Optional: Generate chart image if we have a chart element
      const charts: Array<{ title: string; dataUrl: string }> = [];
      
      const pdf = buildOpsReportPDF({
        title: report.name,
        period,
        kpis: reportKPIs,
        tables,
        charts,
      });

      const ts = format(new Date(), "yyyyMMdd_HHmm");
      const filename = `Report_${report.name.replace(/\s+/g, "_")}_${ts}`;
      pdf.save(`${filename}.pdf`);
      toast({ title: "Downloaded", description: `${filename}.pdf` });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{t("nav.reports")}</h1>
            <p className="text-muted-foreground">Automated reports and exports</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold mb-1">{report.name}</h3>
                  <Badge variant="secondary">{report.type}</Badge>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{report.schedule}</span>
                </div>
                <div>Last generated: {format(new Date(report.lastGenerated), "PPp")}</div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => handleExportPDF(report)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </Card>
          ))}
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{report.type}</Badge>
                  </TableCell>
                  <TableCell>{report.schedule}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(report.lastGenerated), "PPp")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === "active" ? "default" : "secondary"}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleExportPDF(report)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
