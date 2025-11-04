import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LogEntry } from "@/lib/mock-data";
import { format } from "date-fns";

interface LogTableProps {
  logs: LogEntry[];
  onRowClick?: (log: LogEntry) => void;
}

export function LogTable({ logs, onRowClick }: LogTableProps) {
  const getStatusColor = (status: number) => {
    if (status >= 500) return "destructive";
    if (status >= 400) return "warning";
    return "default";
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Verb</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Bytes</TableHead>
            <TableHead>Referrer</TableHead>
            <TableHead>User Agent</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, idx) => (
            <TableRow
              key={idx}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick?.(log)}
            >
              <TableCell className="font-mono text-xs">
                {format(new Date(log["@timestamp"]), "yyyy-MM-dd HH:mm:ss")}
              </TableCell>
              <TableCell className="font-mono text-xs">{log.ip}</TableCell>
              <TableCell>
                <Badge variant="outline">{log.verb}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs max-w-[200px] truncate">
                {log.path}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(log.status) as any}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {log.bytes.toLocaleString()}
              </TableCell>
              <TableCell className="text-xs max-w-[150px] truncate">
                {log.referrer}
              </TableCell>
              <TableCell className="text-xs max-w-[200px] truncate">
                {log.user_agent}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      // Investigate IP
                    }}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Investigate IP
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

