import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadZone } from "@/components/upload/UploadZone";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { sampleJsonLines } from "@/lib/mock-data";

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timezone, setTimezone] = useState("UTC");
  const [delimiter, setDelimiter] = useState("");
  const [customGrok, setCustomGrok] = useState("");
  const [fieldMapping, setFieldMapping] = useState("apache");

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setProgress(0);
  };

  const handleFileRemove = () => {
    setSelectedFile(undefined);
    setProgress(0);
  };

  const handleStartParsing = async () => {
    if (!selectedFile) return;

    setIsParsing(true);
    setProgress(0);

    // Simulate parsing progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsParsing(false);
          toast({
            title: t("common.success"),
            description: "File parsed successfully!",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleGoToExplorer = () => {
    navigate("/explorer");
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">{t("upload.title")}</h1>
          <p className="text-muted-foreground">{t("upload.subtitle")}</p>
        </div>

        <div className="space-y-6">
          <UploadZone
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            progress={progress}
            isParsing={isParsing}
          />

          {selectedFile && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced">
                <AccordionTrigger>{t("upload.advanced")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">{t("upload.timezone")}</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="Asia/Baku">Asia/Baku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delimiter">{t("upload.delimiter")}</Label>
                      <Input
                        id="delimiter"
                        value={delimiter}
                        onChange={(e) => setDelimiter(e.target.value)}
                        placeholder="e.g., \t or |"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-grok">{t("upload.customGrok")}</Label>
                      <Textarea
                        id="custom-grok"
                        value={customGrok}
                        onChange={(e) => setCustomGrok(e.target.value)}
                        placeholder="%{IP:ip} %{WORD:verb} %{URIPATHPARAM:path}"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-mapping">{t("upload.fieldMapping")}</Label>
                      <Select value={fieldMapping} onValueChange={setFieldMapping}>
                        <SelectTrigger id="field-mapping">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apache">{t("upload.preset.apache")}</SelectItem>
                          <SelectItem value="nginx">{t("upload.preset.nginx")}</SelectItem>
                          <SelectItem value="custom">{t("upload.preset.custom")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {selectedFile && !isParsing && progress < 100 && (
            <Button onClick={handleStartParsing} className="w-full" size="lg">
              {t("upload.startParsing")}
            </Button>
          )}

          {selectedFile && progress === 100 && (
            <Button onClick={handleGoToExplorer} className="w-full" size="lg">
              {t("upload.goToExplorer")}
            </Button>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Sample Preview</h3>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{sampleJsonLines.split("\n").slice(0, 3).join("\n")}</pre>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Copy and paste this into a file to test the upload functionality.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

