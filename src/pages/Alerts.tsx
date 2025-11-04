import { useState } from "react";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Bell, Edit, Trash2, Download } from "lucide-react";
import { seedAlerts } from "@/lib/mock-data";
import { FLAGS } from "@/lib/flags";
import { exportJSON } from "@/lib/export";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

type Alert = {
  id: string;
  name: string;
  query: string;
  threshold: number;
  schedule: string;
  status: "active" | "inactive";
  lastTriggered?: string;
};

const STORAGE_KEY = "thorensic-alerts";

function loadAlerts(): Alert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedAlerts;
  } catch {
    return seedAlerts;
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts());
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [wizardQuery, setWizardQuery] = useState("");
  const [wizardThreshold, setWizardThreshold] = useState("3");
  const [wizardSchedule, setWizardSchedule] = useState("*/5 * * * *");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const toggleAlert = (id: string) => {
    const updated = alerts.map((alert) =>
      alert.id === id
        ? { ...alert, status: alert.status === "active" ? "inactive" : "active" }
        : alert
    );
    setAlerts(updated);
    saveAlerts(updated);
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingAlert) return;
    const updated = alerts.map((a) =>
      a.id === editingAlert.id ? editingAlert : a
    );
    setAlerts(updated);
    saveAlerts(updated);
    setIsEditOpen(false);
    setEditingAlert(null);
    toast({ title: "Success", description: "Alert updated" });
  };

  const handleDelete = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
    toast({ title: "Success", description: "Alert deleted" });
    setDeleteId(null);
  };

  const handleExport = (alert: Alert) => {
    const ts = format(new Date(), "yyyyMMdd_HHmm");
    exportJSON(`alert_${alert.name}_${ts}`, alert);
    toast({ title: "Downloaded", description: `alert_${alert.name}_${ts}.json` });
  };

  const handleWizardSave = () => {
    if (!wizardQuery.trim()) {
      toast({ title: "Error", description: "Query is required", variant: "destructive" });
      return;
    }
    const newAlert: Alert = {
      id: crypto.randomUUID(),
      name: `Alert from ${wizardQuery.slice(0, 20)}`,
      query: wizardQuery,
      threshold: parseFloat(wizardThreshold) || 3,
      schedule: wizardSchedule,
      status: "active",
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
    setIsWizardOpen(false);
    setWizardQuery("");
    toast({ title: "Success", description: "Alert created" });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{t("nav.alerts")}</h1>
            <p className="text-muted-foreground">Detection rules and alert history</p>
          </div>
          <Button onClick={() => setIsWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{alert.query}</code>
                  </TableCell>
                  <TableCell className="tabular-nums">{alert.threshold}%</TableCell>
                  <TableCell className="font-mono text-xs">{alert.schedule}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.status === "active"}
                        onCheckedChange={() => toggleAlert(alert.id)}
                        aria-label={`Toggle ${alert.name}`}
                      />
                      <Badge variant={alert.status === "active" ? "default" : "secondary"}>
                        {alert.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alert.lastTriggered
                      ? format(new Date(alert.lastTriggered), "PPp")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(alert)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExport(alert)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(alert.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {FLAGS.ALERT_WIZARD && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Create Alert from Query</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use this wizard to create an alert rule from a saved query. You can test the rule on
              past data and configure notification channels (email/webhook).
            </p>
            <Sheet open={isWizardOpen} onOpenChange={setIsWizardOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Start Wizard
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create Alert</SheetTitle>
                  <SheetDescription>
                    Create a new alert rule from a query expression.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="wizard-query">Query</Label>
                    <Input
                      id="wizard-query"
                      value={wizardQuery}
                      onChange={(e) => setWizardQuery(e.target.value)}
                      placeholder="status:404 AND path:/wp-login.php"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wizard-threshold">Threshold (%)</Label>
                    <Input
                      id="wizard-threshold"
                      type="number"
                      value={wizardThreshold}
                      onChange={(e) => setWizardThreshold(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wizard-schedule">Schedule (cron)</Label>
                    <Input
                      id="wizard-schedule"
                      value={wizardSchedule}
                      onChange={(e) => setWizardSchedule(e.target.value)}
                      placeholder="*/5 * * * *"
                    />
                  </div>
                  <Button onClick={handleWizardSave} className="w-full">
                    Save Alert
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </Card>
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Alert</DialogTitle>
              <DialogDescription>Update alert rule settings.</DialogDescription>
            </DialogHeader>
            {editingAlert && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingAlert.name}
                    onChange={(e) =>
                      setEditingAlert({ ...editingAlert, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-threshold">Threshold (%)</Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    value={editingAlert.threshold}
                    onChange={(e) =>
                      setEditingAlert({
                        ...editingAlert,
                        threshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-schedule">Schedule</Label>
                  <Input
                    id="edit-schedule"
                    value={editingAlert.schedule}
                    onChange={(e) =>
                      setEditingAlert({ ...editingAlert, schedule: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Alert</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
