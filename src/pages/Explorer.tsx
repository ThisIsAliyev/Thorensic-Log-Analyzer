import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { RightDrawer } from "@/components/app-shell/RightDrawer";
import { FacetFilter } from "@/components/explorer/FacetFilter";
import { LogTable } from "@/components/explorer/LogTable";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Save, Download, Pin, Bell, X } from "lucide-react";
import { format } from "date-fns";
import { mockLogService, sampleLogs, type LogEntry } from "@/lib/mock-data";
import { runQuery } from "@/lib/queryEngine";
import { exportCSV, exportJSON } from "@/lib/export";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function ExplorerPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeSeries, setTimeSeries] = useState<Array<{ time: string; count: number }>>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedIPs, setSelectedIPs] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedIPs, dateRange, query]);

  const loadData = async () => {
    let filtered = [...sampleLogs];

    // Apply filters - Status is single-select (first one)
    if (selectedStatus.length > 0) {
      filtered = runQuery(filtered, `status:${selectedStatus[0]}`);
    }
    if (selectedIPs.length > 0) {
      // Build OR query for multiple IPs
      const ipQuery = selectedIPs.map((ip) => `ip:${ip}`).join(" OR ");
      filtered = runQuery(filtered, ipQuery);
    }
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((log) => {
        const ts = new Date(log["@timestamp"]);
        return ts >= dateRange.from! && ts <= dateRange.to!;
      });
    }
    if (query.trim()) {
      filtered = runQuery(filtered, query);
    }

    setLogs(filtered.slice(0, 100)); // Limit for display

    // Generate time series
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
  };

  // Generate facet data
  const statusFacets = [
    { label: "200 OK", value: "200", count: logs.filter((l) => l.status === 200).length },
    { label: "404 Not Found", value: "404", count: logs.filter((l) => l.status === 404).length },
    { label: "401 Unauthorized", value: "401", count: logs.filter((l) => l.status === 401).length },
    { label: "403 Forbidden", value: "403", count: logs.filter((l) => l.status === 403).length },
    { label: "500 Error", value: "500", count: logs.filter((l) => l.status === 500).length },
  ];

  // Generate IP facets from all sample logs, not just filtered
  const allIPs = Array.from(new Set(sampleLogs.map((l) => l.ip)));
  const ipFacets = allIPs.slice(0, 10).map((ip) => {
    const count = sampleLogs.filter((l) => l.ip === ip).length;
    return {
      label: ip,
      value: ip,
      count,
    };
  });

  // Top IPs
  const topIPs = Array.from(
    logs.reduce((acc, log) => {
      acc.set(log.ip, (acc.get(log.ip) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top URLs
  const topURLs = Array.from(
    logs.reduce((acc, log) => {
      acc.set(log.path, (acc.get(log.path) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top 404s
  const top404s = logs
    .filter((l) => l.status === 404)
    .reduce((acc, log) => {
      acc.set(log.path, (acc.get(log.path) || 0) + 1);
      return acc;
    }, new Map<string, number>());
  const top404sArray = Array.from(top404s)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Query Bar */}
        <Card className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t("common.search")}</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., status:404 AND path:/wp-login.php"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={() => {
              const queryName = prompt("Enter query name:");
              if (queryName) {
                const queries = JSON.parse(localStorage.getItem("thorensic-queries") || "[]");
                queries.push({
                  id: crypto.randomUUID(),
                  name: queryName,
                  query,
                  tags: [],
                  lastRun: new Date().toISOString(),
                  owner: "user",
                });
                localStorage.setItem("thorensic-queries", JSON.stringify(queries));
                toast({ title: "Success", description: "Query saved" });
              }
            }}>
              <Save className="h-4 w-4 mr-2" />
              {t("explorer.saveQuery")}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Facets */}
          <div className="col-span-3 space-y-4">
            <FacetFilter
              title="Status Code"
              options={statusFacets}
              selected={selectedStatus}
              onSelectionChange={setSelectedStatus}
            />
            <FacetFilter
              title="IP Address (multi-select)"
              options={ipFacets}
              selected={selectedIPs}
              onSelectionChange={setSelectedIPs}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-9 space-y-6">
            {/* Timeseries Chart */}
            <TimeSeriesChart data={timeSeries} title="Requests Over Time" />

            {/* Top Tables */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold text-sm mb-3">Top IPs</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topIPs.map(([ip, count]) => (
                      <TableRow key={ip}>
                        <TableCell className="font-mono text-xs">{ip}</TableCell>
                        <TableCell className="text-right tabular-nums">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-sm mb-3">Top URLs</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topURLs.map(([path, count]) => (
                      <TableRow key={path}>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate">
                          {path}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-sm mb-3">Top 404s</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {top404sArray.map(([path, count]) => (
                      <TableRow key={path}>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate">
                          {path}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Active Filters */}
            {(selectedIPs.length > 0 || selectedStatus.length > 0 || query.trim()) && (
              <Card className="p-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium">Active filters:</span>
                  {selectedStatus.map((status) => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      Status: {status}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setSelectedStatus(selectedStatus.filter((s) => s !== status))}
                      />
                    </Badge>
                  ))}
                  {selectedIPs.map((ip) => (
                    <Badge key={ip} variant="secondary" className="gap-1">
                      IP: {ip}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setSelectedIPs(selectedIPs.filter((i) => i !== ip))}
                      />
                    </Badge>
                  ))}
                  {query.trim() && (
                    <Badge variant="secondary" className="gap-1">
                      Query: {query.slice(0, 20)}...
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setQuery("")}
                      />
                    </Badge>
                  )}
                </div>
              </Card>
            )}

            {/* Log Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Log Entries ({logs.length})</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const ts = format(new Date(), "yyyyMMdd_HHmm");
                      exportCSV(`explorer_logs_${ts}`, logs);
                      toast({ title: "Downloaded", description: `explorer_logs_${ts}.csv` });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("common.export")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const widgets = JSON.parse(localStorage.getItem("thorensic-dashboard-widgets") || "[]");
                      widgets.push({
                        id: crypto.randomUUID(),
                        type: "table",
                        title: "Explorer Query",
                        config: { query },
                        x: 0,
                        y: 0,
                        w: 12,
                        h: 4,
                      });
                      localStorage.setItem("thorensic-dashboard-widgets", JSON.stringify(widgets));
                      toast({ title: "Success", description: "Pinned to dashboard" });
                    }}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    {t("explorer.pinToDashboard")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/alerts")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {t("explorer.createAlert")}
                  </Button>
                </div>
              </div>
              {logs.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">{t("explorer.empty")}</p>
                </Card>
              ) : (
                <LogTable logs={logs} onRowClick={setSelectedLog} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Details Drawer */}
      <RightDrawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Log Details"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Timestamp</h3>
              <p className="font-mono text-sm">{selectedLog["@timestamp"]}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">IP Address</h3>
              <p className="font-mono text-sm">{selectedLog.ip}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Request</h3>
              <p className="font-mono text-sm">
                {selectedLog.verb} {selectedLog.path}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <Badge>{selectedLog.status}</Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Raw JSON</h3>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </RightDrawer>
    </AppLayout>
  );
}

