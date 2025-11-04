import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { incidentsStore, type Incident } from "@/state/incidents";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState({
    title: "",
    severity: "medium" as Incident["severity"],
    status: "open" as Incident["status"],
    tasks: [{ id: crypto.randomUUID(), title: "", done: false }],
  });

  useEffect(() => {
    setIncidents(incidentsStore.getItems());
  }, []);

  const refresh = () => setIncidents(incidentsStore.getItems());

  const handleCreate = () => {
    if (!newIncident.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    const tasks = newIncident.tasks.filter((t) => t.title.trim());
    // Default tasks if none provided
    const defaultTasks = tasks.length > 0 ? tasks : [
      { id: crypto.randomUUID(), title: "Block suspicious IPs", done: false },
      { id: crypto.randomUUID(), title: "Review access logs", done: false },
      { id: crypto.randomUUID(), title: "Update firewall rules", done: false },
    ];
    const id = incidentsStore.add({
      title: newIncident.title,
      severity: newIncident.severity,
      status: "open",
      timeline: [
        {
          ts: new Date().toISOString(),
          text: `Incident created: ${newIncident.title}`,
        },
      ],
      tasks: defaultTasks,
    });
    toast({ title: "Success", description: "Incident created" });
    setIsCreateOpen(false);
    setNewIncident({
      title: "",
      severity: "medium",
      status: "open",
      tasks: [{ id: crypto.randomUUID(), title: "", done: false }],
    });
    refresh();
  };

  const handleToggleTask = (incidentId: string, taskId: string) => {
    incidentsStore.toggleTask(incidentId, taskId);
    refresh();
  };

  const handleDelete = (id: string) => {
    incidentsStore.delete(id);
    toast({ title: "Success", description: "Incident deleted" });
    setDeleteId(null);
    refresh();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "contained":
        return <XCircle className="h-4 w-4" />;
      case "investigating":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredIncidents =
    selectedStatus === "all"
      ? incidents
      : incidents.filter((inc) => inc.status === selectedStatus);

  const kanbanColumns = [
    { id: "open", label: "Open", status: "open" as const },
    { id: "investigating", label: "Investigating", status: "investigating" as const },
    { id: "contained", label: "Contained", status: "contained" as const },
    { id: "resolved", label: "Resolved", status: "resolved" as const },
  ];

  return (
    <ErrorBoundary>
      <AppLayout>
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{t("nav.incidents")}</h1>
            <p className="text-muted-foreground">Case management and incident tracking</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>Add a new incident to track and manage.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newIncident.title}
                    onChange={(e) =>
                      setNewIncident({ ...newIncident, title: e.target.value })
                    }
                    placeholder="Incident title"
                  />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={newIncident.severity}
                    onValueChange={(v) =>
                      setNewIncident({ ...newIncident, severity: v as Incident["severity"] })
                    }
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Initial Tasks</Label>
                  <div className="space-y-2">
                    {newIncident.tasks.map((task, idx) => (
                      <Input
                        key={task.id}
                        value={task.title}
                        onChange={(e) => {
                          const tasks = [...newIncident.tasks];
                          tasks[idx].title = e.target.value;
                          setNewIncident({ ...newIncident, tasks });
                        }}
                        placeholder={`Task ${idx + 1}`}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNewIncident({
                          ...newIncident,
                          tasks: [
                            ...newIncident.tasks,
                            { id: crypto.randomUUID(), title: "", done: false },
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban View */}
        <div className="grid grid-cols-4 gap-4">
          {kanbanColumns.map((column) => {
            const columnIncidents = filteredIncidents.filter(
              (inc) => inc.status === column.status
            );
            return (
              <Card key={column.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{column.label}</h3>
                  <Badge variant="secondary">{columnIncidents.length}</Badge>
                </div>
                <div className="space-y-2">
                  {columnIncidents.map((incident) => (
                    <Card
                      key={incident.id}
                      className="p-3 cursor-pointer hover:bg-muted/50"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{incident.title}</h4>
                          <Badge variant={getSeverityColor(incident.severity) as any}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {getStatusIcon(incident.status)}
                          <span>{incident.tasks.length} tasks</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {incident.tasks.filter((t) => t.done).length} /{" "}
                          {incident.tasks.length} completed
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Incident Details */}
        {incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{incident.title}</h3>
                    <div className="flex gap-2 mb-4">
                      <Badge variant={getSeverityColor(incident.severity) as any}>
                        {incident.severity}
                      </Badge>
                      <Badge variant="outline">{incident.status}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(incident.id)}
                  >
                    Delete
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Timeline</h4>
                    <div className="space-y-2">
                      {incident.timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1">
                            <div className="text-sm">{event.text}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(event.ts), "PPp")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Tasks</h4>
                    <div className="space-y-2">
                      {incident.tasks.length > 0 ? (
                        incident.tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={task.done}
                              onCheckedChange={() => handleToggleTask(incident.id, task.id)}
                            />
                            <span
                              className={
                                task.done ? "line-through text-muted-foreground" : ""
                              }
                            >
                              {task.title}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tasks</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No incidents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first incident to start tracking security events.
            </p>
          </Card>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Incident</AlertDialogTitle>
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
    </ErrorBoundary>
  );
}
