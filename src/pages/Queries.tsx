import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, Play, Pin, Download, Edit, Trash2, Copy, HelpCircle } from "lucide-react";
import { seedQueries, sampleLogs } from "@/lib/mock-data";
import { runQuery } from "@/lib/queryEngine";
import { exportJSON, exportCSV } from "@/lib/export";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

type SavedQuery = {
  id: string;
  name: string;
  query: string;
  description?: string;
  tags: string[];
  lastRun?: string;
  owner: string;
};

const STORAGE_KEY = "thorensic-queries";

function loadQueries(): SavedQuery[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedQueries;
  } catch {
    return seedQueries;
  }
}

function saveQueries(queries: SavedQuery[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
}

export default function QueriesPage() {
  const [queries, setQueries] = useState<SavedQuery[]>(loadQueries());
  const [searchTerm, setSearchTerm] = useState("");
  const [editorQuery, setEditorQuery] = useState("");
  const [editorName, setEditorName] = useState("");
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    saveQueries(queries);
  }, [queries]);

  const filteredQueries = queries.filter(
    (q) =>
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRunPreview = () => {
    if (!editorQuery.trim()) {
      toast({ title: "Error", description: "Enter a query to run", variant: "destructive" });
      return;
    }
    const results = runQuery(sampleLogs, editorQuery);
    setPreviewResults(results.slice(0, 100));
    toast({ title: "Success", description: `Found ${results.length} results` });
  };

  const handleSaveQuery = () => {
    if (!editorName.trim() || !editorQuery.trim()) {
      toast({ title: "Error", description: "Name and query are required", variant: "destructive" });
      return;
    }
    const newQuery: SavedQuery = {
      id: crypto.randomUUID(),
      name: editorName,
      query: editorQuery,
      tags: [],
      lastRun: new Date().toISOString(),
      owner: "user",
    };
    setQueries([...queries, newQuery]);
    toast({ title: "Success", description: "Query saved" });
    setEditorName("");
    setEditorQuery("");
    setPreviewResults([]);
  };

  const handleRun = (query: SavedQuery) => {
    const results = runQuery(sampleLogs, query.query);
    setPreviewResults(results.slice(0, 100));
    setEditorQuery(query.query);
    setQueries(
      queries.map((q) =>
        q.id === query.id ? { ...q, lastRun: new Date().toISOString() } : q
      )
    );
    toast({ title: "Success", description: `Found ${results.length} results` });
  };

  const handlePin = (query: SavedQuery) => {
    const widgets = JSON.parse(localStorage.getItem("thorensic-dashboard-widgets") || "[]");
    widgets.push({
      id: crypto.randomUUID(),
      type: "table",
      title: query.name,
      config: { query: query.query },
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    });
    localStorage.setItem("thorensic-dashboard-widgets", JSON.stringify(widgets));
    toast({ title: "Success", description: "Query pinned to dashboard" });
  };

  const handleDuplicate = (query: SavedQuery) => {
    const newQuery: SavedQuery = {
      ...query,
      id: crypto.randomUUID(),
      name: `${query.name} (copy)`,
    };
    setQueries([...queries, newQuery]);
    toast({ title: "Success", description: "Query duplicated" });
  };

  const handleExportJSON = (query: SavedQuery) => {
    const ts = format(new Date(), "yyyyMMdd_HHmm");
    exportJSON(`query_${query.name}_${ts}`, query);
    toast({ title: "Downloaded", description: `query_${query.name}_${ts}.json` });
  };

  const handleExportCSV = (query: SavedQuery) => {
    if (previewResults.length === 0) {
      toast({
        title: "Error",
        description: "Run preview first",
        variant: "destructive",
      });
      return;
    }
    const ts = format(new Date(), "yyyyMMdd_HHmm");
    exportCSV(`results_${query.name}_${ts}`, previewResults);
    toast({ title: "Downloaded", description: `results_${query.name}_${ts}.csv` });
  };

  const handleDelete = (id: string) => {
    setQueries(queries.filter((q) => q.id !== id));
    toast({ title: "Success", description: "Query deleted" });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{t("nav.queries")}</h1>
            <p className="text-muted-foreground">Saved searches and query management</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell className="font-medium">{query.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{query.query}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {query.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{query.owner}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {query.lastRun ? format(new Date(query.lastRun), "PPp") : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRun(query)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Run query</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePin(query)}
                            >
                              <Pin className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Pin to dashboard</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(query)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportJSON(query)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export JSON</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(query.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Query Editor</h3>
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Syntax Help
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Query Syntax</DialogTitle>
                  <DialogDescription>
                    <div className="space-y-2 mt-4">
                      <p>
                        <strong>Field:value</strong> - Match field contains value (case-insensitive)
                      </p>
                      <p>
                        <strong>Field:&gt;number</strong> - Greater than comparison
                      </p>
                      <p>
                        <strong>Field:&lt;number</strong> - Less than comparison
                      </p>
                      <p>
                        <strong>AND</strong> - Logical AND
                      </p>
                      <p>
                        <strong>OR</strong> - Logical OR
                      </p>
                      <p className="mt-4">
                        <strong>Examples:</strong>
                      </p>
                      <code className="block text-xs bg-muted p-2 rounded">
                        status:404 AND path:/wp-login.php
                      </code>
                      <code className="block text-xs bg-muted p-2 rounded">
                        latency_ms:&gt;500
                      </code>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="Query name"
              value={editorName}
              onChange={(e) => setEditorName(e.target.value)}
            />
            <Textarea
              placeholder="Enter your query... (e.g., status:404 AND path:/wp-login.php)"
              rows={4}
              value={editorQuery}
              onChange={(e) => setEditorQuery(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRunPreview}>
                <Play className="h-4 w-4 mr-2" />
                Run Preview
              </Button>
              <Button onClick={handleSaveQuery}>Save Query</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        disabled={previewResults.length === 0}
                        onClick={() => {
                          if (previewResults.length > 0) {
                            const ts = format(new Date(), "yyyyMMdd_HHmm");
                            exportCSV(`results_${editorName || "query"}_${ts}`, previewResults);
                            toast({ title: "Downloaded", description: `results_${editorName || "query"}_${ts}.csv` });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {previewResults.length === 0
                      ? "Run preview first"
                      : "Export preview results"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {previewResults.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Preview Results ({previewResults.length})</h4>
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewResults.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {row["@timestamp"]?.slice(0, 19)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {row.path}
                        </TableCell>
                        <TableCell>
                          <Badge>{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
