import { useRef, useState, useCallback } from "react";
import { CloudUpload, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  progress?: number;
  isParsing?: boolean;
}

export function UploadZone({ onFileSelect, onFileRemove, selectedFile, progress, isParsing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const detectFormat = (filename: string) => {
    if (filename.endsWith(".json") || filename.endsWith(".jsonl")) return "JSON Lines";
    if (filename.includes("nginx")) return "Nginx";
    if (filename.includes("apache")) return "Apache Combined";
    return "Custom";
  };

  if (selectedFile) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedFile.name}</span>
              <Badge variant="secondary" className="ml-2">
                {detectFormat(selectedFile.name)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {formatFileSize(selectedFile.size)}
            </div>
            {isParsing && progress !== undefined && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground">
                  Parsing... {progress}%
                </div>
              </div>
            )}
            {!isParsing && progress === 100 && (
              <div className="flex items-center gap-2 text-accent">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Parsing complete!</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFileRemove}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed p-12 transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <CloudUpload className="h-16 w-16 text-muted-foreground" />
        <div>
          <p className="text-lg font-medium mb-2">{t("upload.dropzone")}</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            {t("upload.chooseFile")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("upload.supportedFormats")} {t("upload.formats.apache")}, {t("upload.formats.nginx")}, {t("upload.formats.jsonl")}, {t("upload.formats.custom")}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInput}
        accept=".log,.txt,.json,.jsonl"
        aria-label="Choose log file"
      />
    </Card>
  );
}
