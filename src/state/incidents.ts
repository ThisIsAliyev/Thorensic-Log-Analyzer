type Task = { id: string; title: string; done: boolean };

export type Incident = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "investigating" | "contained" | "resolved";
  timeline: { ts: string; text: string }[];
  tasks: Task[];
};

const STORAGE_KEY = "thorensic-incidents";

function loadIncidents(): Incident[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveIncidents(items: Incident[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const incidentsStore = {
  getItems: () => loadIncidents(),
  
  add: (incident: Omit<Incident, "id">) => {
    const items = loadIncidents();
    const newIncident: Incident = { ...incident, id: crypto.randomUUID() };
    items.push(newIncident);
    saveIncidents(items);
    return newIncident.id;
  },
  
  toggleTask: (incidentId: string, taskId: string) => {
    const items = loadIncidents();
    const updated = items.map((it) =>
      it.id !== incidentId
        ? it
        : {
            ...it,
            tasks: it.tasks.map((t) =>
              t.id === taskId ? { ...t, done: !t.done } : t
            ),
          }
    );
    saveIncidents(updated);
  },
  
  updateStatus: (incidentId: string, status: Incident["status"]) => {
    const items = loadIncidents();
    const updated = items.map((it) =>
      it.id !== incidentId ? it : { ...it, status }
    );
    saveIncidents(updated);
  },
  
  delete: (incidentId: string) => {
    const items = loadIncidents();
    const updated = items.filter((it) => it.id !== incidentId);
    saveIncidents(updated);
  },
};

