import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Send, Sparkles, AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";
import { sampleLogs } from "@/lib/mock-data";
import { runQuery } from "@/lib/queryEngine";
import { analyzeLogs } from "@/services/ai";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function AIAnalysisPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<Array<{ time: string; count: number }>>([]);

  useEffect(() => {
    if (analysis) {
      const filtered = runQuery(sampleLogs, prompt || "");
      const buckets: Record<string, number> = {};
      filtered.forEach((log) => {
        const timestamp = new Date(log["@timestamp"]);
        const bucket = `${timestamp.getUTCFullYear()}-${String(timestamp.getUTCMonth() + 1).padStart(2, "0")}-${String(timestamp.getUTCDate()).padStart(2, "0")} ${String(timestamp.getUTCHours()).padStart(2, "0")}:00:00`;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      });
      setTimeSeries(
        Object.entries(buckets)
          .map(([time, count]) => ({ time, count }))
          .sort((a, b) => a.time.localeCompare(b.time))
      );
    }
  }, [analysis, prompt]);

  const examplePrompts = [
    t("ai.example1"),
    t("ai.example2"),
    t("ai.example3"),
  ];

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      const filtered = runQuery(sampleLogs, prompt);
      
      // Compute top IPs and paths for stats
      const ipMap = new Map<string, number>();
      const pathMap = new Map<string, number>();
      filtered.forEach((r: any) => {
        ipMap.set(r.ip, (ipMap.get(r.ip) || 0) + 1);
        pathMap.set(r.path, (pathMap.get(r.path) || 0) + 1);
      });
      const topIPs = [...ipMap.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const topPaths = [...pathMap.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const result = await analyzeLogs({
        expr: prompt,
        rows: filtered,
        topIPs,
        topPaths,
      });
      setAnalysis(result);
    } catch (error) {
      console.error("AI analysis failed", error);
      toast({ title: "Error", description: "Analysis failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <AppLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-semibold mb-2">{t("nav.aiAnalysis")}</h1>
          <p className="text-muted-foreground">Ask natural language questions about your logs</p>
        </div>

        {/* Prompt Input */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder={t("ai.prompt")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] pr-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
              <Button
                size="icon"
                className="absolute bottom-4 right-4"
                onClick={handleSubmit}
                disabled={!prompt.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Example Prompts */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {examplePrompts.map((example, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* AI Output */}
        {isLoading && (
          <Card className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Analyzing your logs...</span>
            </div>
          </Card>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* VirusTotal Threat Intel */}
            {analysis.virusTotal && analysis.virusTotal.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Threat Intelligence (VirusTotal)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IOC</TableHead>
                      <TableHead>Malicious</TableHead>
                      <TableHead>Suspicious</TableHead>
                      <TableHead>Country</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.virusTotal.map((vt: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{vt.ioc}</TableCell>
                        <TableCell>
                          <Badge variant={vt.malicious > 0 ? "destructive" : "secondary"}>
                            {vt.malicious}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vt.suspicious > 2 ? "warning" : "secondary"}>
                            {vt.suspicious}
                          </Badge>
                        </TableCell>
                        <TableCell>{vt.country || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">AI Analysis Results</h2>
              </div>
              <div className="prose prose-invert max-w-none space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm">{analysis.summary}</p>
                </div>
                {analysis.topPaths && analysis.topPaths.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Top Paths</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.topPaths.map((p: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {p.key}: {p.count} requests
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.topIPs && analysis.topIPs.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Top IPs</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.topIPs.map((p: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {p.key}: {p.count} requests
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Generated Charts */}
            {timeSeries.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                <TimeSeriesChart data={timeSeries} title="Filtered Requests Over Time" />
                {analysis.topIPs && analysis.topIPs.length > 0 && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Top Suspicious IPs</h3>
                    <div className="space-y-2">
                      {analysis.topIPs.slice(0, 3).map((ip: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 bg-destructive/10 rounded"
                        >
                          <span className="font-mono text-sm">{ip.key}</span>
                          <Badge variant="destructive">{ip.count} requests</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Actions */}
            <Card className="p-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/explorer")}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Re-run on different time window
                </Button>
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Alert from insight
                </Button>
                <Button variant="outline" onClick={() => navigate("/explorer")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Explorer
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
      </AppLayout>
    </ErrorBoundary>
  );
}
