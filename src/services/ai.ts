import { getGeminiKey } from "@/lib/keys";
import { analyzeMock } from "./aiMock";
import { analyzeWithGemini, type AnalysisStats } from "./ai-gemini";
import { batchLookupIPs } from "./virustotal";

export async function analyzeLogs({
  expr,
  rows,
  topIPs,
  topPaths,
}: {
  expr: string;
  rows: any[];
  topIPs?: Array<{ key: string; count: number }>;
  topPaths?: Array<{ key: string; count: number }>;
}) {
  const total = rows.length;
  const err5xx = rows.filter((x: any) => +x.status >= 500).length;
  const err4xx = rows.filter((x: any) => +x.status >= 400 && +x.status < 500).length;

  // Compute top IPs and paths if not provided
  const computedTopIPs =
    topIPs ||
    (() => {
      const map = new Map<string, number>();
      rows.forEach((r: any) => map.set(r.ip, (map.get(r.ip) || 0) + 1));
      return [...map.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    })();

  const computedTopPaths =
    topPaths ||
    (() => {
      const map = new Map<string, number>();
      rows.forEach((r: any) => map.set(r.path, (map.get(r.path) || 0) + 1));
      return [...map.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    })();

  // Detect anomalies
  const anomalies: Array<{ type: string; description: string }> = [];
  if (err5xx > total * 0.03) {
    anomalies.push({
      type: "High Error Rate",
      description: `5xx errors are ${((err5xx / total) * 100).toFixed(1)}% of total requests`,
    });
  }
  if (computedTopIPs[0] && computedTopIPs[0].count > total * 0.3) {
    anomalies.push({
      type: "Single IP Dominance",
      description: `${computedTopIPs[0].key} accounts for ${((computedTopIPs[0].count / total) * 100).toFixed(1)}% of requests`,
    });
  }

  // VirusTotal enrichment
  let vtResults: AnalysisStats["virusTotal"] = undefined;
  try {
    const ipsToCheck = computedTopIPs.slice(0, 5).map((ip) => ip.key);
    vtResults = await batchLookupIPs(ipsToCheck);
  } catch (error: any) {
    console.warn("VirusTotal lookup failed:", error);
    // Continue without VT data
  }

  const stats: AnalysisStats = {
    summary: `Total: ${total}, 5xx: ${err5xx} (${((err5xx / total) * 100).toFixed(1)}%), 4xx: ${err4xx} (${((err4xx / total) * 100).toFixed(1)}%)`,
    topIPs: computedTopIPs,
    topPaths: computedTopPaths,
    anomalies,
    virusTotal: vtResults,
  };

  // Try Gemini if key is available
  const key = getGeminiKey();
  if (key) {
    try {
      const geminiResponse = await analyzeWithGemini(stats, expr);
      return {
        summary: geminiResponse,
        topPaths: computedTopPaths,
        topIPs: computedTopIPs,
        recommendations: geminiResponse
          .split("\n")
          .filter((l: string) => l.trim() && (l.includes("•") || l.includes("-") || l.match(/^\d+\./)))
          .slice(0, 5),
        virusTotal: vtResults,
      };
    } catch (error: any) {
      console.warn("Gemini call failed, falling back to mock:", error);
    }
  }

  // Fallback to mock (still input-sensitive)
  return analyzeMock({ rows, expr, stats });
}

