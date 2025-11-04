import { useState } from "react";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Copy, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { getGeminiKey, setGeminiKey, getVTKey, setVTKey } from "@/lib/keys";
import { t, getLocale, setLocale } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY_DATASETS = "thorensic-datasets";

function loadDatasets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATASETS);
    return stored ? JSON.parse(stored) : [{ id: "1", name: "nginx_access", fileName: "nginx.log", rows: 5000, retention: "30 days" }];
  } catch {
    return [];
  }
}

function saveDatasets(datasets: any[]) {
  localStorage.setItem(STORAGE_KEY_DATASETS, JSON.stringify(datasets));
}

export default function SettingsPage() {
  const [locale, setLocaleState] = useState(getLocale());
  const [geminiKey, setGeminiKeyState] = useState(getGeminiKey() || "");
  const [vtKey, setVTKeyState] = useState(getVTKey() || "");
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isTestingVT, setIsTestingVT] = useState(false);
  const [datasets, setDatasets] = useState(loadDatasets());

  const hasEnvGemini = !!import.meta.env.VITE_GEMINI_API_KEY;
  const hasEnvVT = !!import.meta.env.VITE_VIRUSTOTAL_API_KEY;

  const handleLocaleChange = (newLocale: "en" | "az") => {
    setLocale(newLocale);
    setLocaleState(newLocale);
    setTimeout(() => window.location.reload(), 100);
  };

  const handleSaveGemini = () => {
    setGeminiKey(geminiKey || null);
    toast({ title: "Success", description: "Gemini key saved" });
  };

  const handleSaveVT = () => {
    setVTKey(vtKey || null);
    toast({ title: "Success", description: "VirusTotal key saved" });
  };

  const handleTestGemini = async () => {
    const key = geminiKey || getGeminiKey();
    if (!key) {
      toast({ title: "Error", description: "No API key provided", variant: "destructive" });
      return;
    }

    setIsTestingGemini(true);
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + key);
      if (response.ok) {
        toast({ title: "Success", description: "Gemini connection successful" });
      } else {
        throw new Error("Invalid API key");
      }
    } catch (error: any) {
      if (error.message?.includes("CORS") || error.message?.includes("Failed to fetch")) {
        // Validate key format
        if (key.length > 20) {
          toast({
            title: "Warning",
            description: "CORS blocked - key format looks valid. Test in production.",
          });
        } else {
          toast({
            title: "Error",
            description: "Invalid API key format",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Connection failed",
          variant: "destructive",
        });
      }
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestVT = async () => {
    const key = vtKey || getVTKey();
    if (!key) {
      toast({ title: "Error", description: "No API key provided", variant: "destructive" });
      return;
    }

    setIsTestingVT(true);
    try {
      const response = await fetch("https://www.virustotal.com/api/v3/users", {
        headers: { "x-apikey": key },
      });
      if (response.status === 200) {
        toast({ title: "Success", description: "VirusTotal connection successful" });
      } else if (response.status === 401) {
        toast({
          title: "Error",
          description: "Invalid VirusTotal API key",
          variant: "destructive",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      if (error.message?.includes("CORS") || error.message?.includes("Failed to fetch")) {
        if (key.length > 20) {
          toast({
            title: "Warning",
            description: "CORS blocked - key format looks valid. Test in production.",
          });
        } else {
          toast({
            title: "Error",
            description: "Invalid API key format",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Connection failed",
          variant: "destructive",
        });
      }
    } finally {
      setIsTestingVT(false);
    }
  };

  const handleDeleteDataset = (id: string) => {
    const updated = datasets.filter((d) => d.id !== id);
    setDatasets(updated);
    saveDatasets(updated);
    toast({ title: "Success", description: "Dataset deleted" });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-semibold mb-2">{t("nav.settings")}</h1>
          <p className="text-muted-foreground">Configure your Thorensic Log Analyzer instance</p>
        </div>

        <Tabs defaultValue="parsers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parsers">{t("settings.parsers")}</TabsTrigger>
            <TabsTrigger value="datasets">{t("settings.datasets")}</TabsTrigger>
            <TabsTrigger value="api-keys">{t("settings.apiKeys")}</TabsTrigger>
            <TabsTrigger value="localization">{t("settings.localization")}</TabsTrigger>
          </TabsList>

          <TabsContent value="parsers" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Apache Parser</h3>
              <div className="space-y-4">
                <div>
                  <Label>Grok Pattern</Label>
                  <Textarea
                    defaultValue='%{IPORHOST:clientip} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] "%{WORD:verb} %{URIPATHPARAM:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:response} (?:%{NUMBER:bytes}|-)'
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Sample Log Line</Label>
                  <Input defaultValue='203.0.113.45 - - [03/Nov/2025:18:41:20 +0000] "GET / HTTP/1.1" 200 5123' />
                </div>
                <Button>Preview</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Nginx Parser</h3>
              <div className="space-y-4">
                <div>
                  <Label>Grok Pattern</Label>
                  <Textarea
                    defaultValue='%{IPORHOST:remote_addr} - %{DATA:remote_user} \[%{HTTPDATE:time_local}\] "%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:status} %{NUMBER:body_bytes_sent}'
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Sample Log Line</Label>
                  <Input defaultValue='203.0.113.45 - - [03/Nov/2025:18:41:20 +0000] "GET / HTTP/1.1" 200 5123' />
                </div>
                <Button>Preview</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Custom Parser</h3>
              <div className="space-y-4">
                <div>
                  <Label>Parser Name</Label>
                  <Input placeholder="My Custom Parser" />
                </div>
                <div>
                  <Label>Grok/Regex Pattern</Label>
                  <Textarea placeholder="Enter your pattern..." rows={3} />
                </div>
                <Button>Add Parser</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset Name</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell className="font-medium">{dataset.name}</TableCell>
                      <TableCell>{dataset.fileName}</TableCell>
                      <TableCell className="tabular-nums">{dataset.rows.toLocaleString()}</TableCell>
                      <TableCell>{dataset.retention}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDataset(dataset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="gemini-key">Gemini API Key</Label>
                  {hasEnvGemini && !geminiKey && (
                    <Badge variant="secondary">Using env key</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="gemini-key"
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKeyState(e.target.value)}
                    placeholder={hasEnvGemini ? "Using environment key" : "Enter API key..."}
                  />
                  <Button onClick={handleSaveGemini}>Save</Button>
                  <Button variant="outline" onClick={handleTestGemini} disabled={isTestingGemini}>
                    {isTestingGemini ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="vt-key">VirusTotal API Key</Label>
                  {hasEnvVT && !vtKey && (
                    <Badge variant="secondary">Using env key</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="vt-key"
                    type="password"
                    value={vtKey}
                    onChange={(e) => setVTKeyState(e.target.value)}
                    placeholder={hasEnvVT ? "Using environment key" : "Enter API key..."}
                  />
                  <Button onClick={handleSaveVT}>Save</Button>
                  <Button variant="outline" onClick={handleTestVT} disabled={isTestingVT}>
                    {isTestingVT ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div>
                <Label>Language</Label>
                <select
                  value={locale}
                  onChange={(e) => handleLocaleChange(e.target.value as "en" | "az")}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="en">English</option>
                  <option value="az">Azərbaycan</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Changing the language will reload the page to apply translations.
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
