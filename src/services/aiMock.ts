import { runQuery } from "@/lib/queryEngine";
import type { AnalysisStats } from "./ai-gemini";

export function analyzeMock({
  rows,
  expr,
  stats,
}: {
  rows: any[];
  expr: string;
  stats?: AnalysisStats;
}) {
  const r = runQuery(rows, expr);
  const total = r.length;
  const err5xx = r.filter((x: any) => +x.status >= 500).length;
  const err4xx = r.filter((x: any) => +x.status >= 400 && +x.status < 500).length;
  const topPaths = tally(r, "path").slice(0, 3);
  const topIPs = tally(r, "ip").slice(0, 3);

  const recommendations: string[] = [];
  if (err5xx > total * 0.03) {
    recommendations.push(`Investigate ${err5xx} 5xx errors (${((err5xx / total) * 100).toFixed(1)}% of traffic)`);
  }
  if (err4xx > total * 0.1) {
    recommendations.push(`Review ${err4xx} 4xx errors - may indicate broken links or misconfigurations`);
  }
  if (topPaths.find((p) => /wp-login\.php/.test(p.key))) {
    recommendations.push("Rate-limit /wp-login.php - potential brute-force target");
  }
  if (topIPs[0] && topIPs[0].count > total * 0.2) {
    recommendations.push(`Monitor IP ${topIPs[0].key} - ${((topIPs[0].count / total) * 100).toFixed(1)}% of requests`);
  }
  if (recommendations.length === 0) {
    recommendations.push("No immediate security concerns detected");
    recommendations.push("Continue monitoring for anomalies");
  }

  return {
    summary: stats?.summary || `Matched ${total} rows; 5xx=${err5xx}, 4xx=${err4xx}`,
    topPaths: stats?.topPaths || topPaths,
    topIPs: stats?.topIPs || topIPs,
    recommendations,
    virusTotal: stats?.virusTotal,
  };
}

function tally(rows: any[], f: string) {
  const m = new Map<string, number>();
  rows.forEach((x) => m.set(x[f], (m.get(x[f]) || 0) + 1));
  return [...m]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

