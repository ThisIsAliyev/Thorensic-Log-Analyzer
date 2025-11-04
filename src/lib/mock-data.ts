// Mock data services for Thorensic Log Analyzer

export interface LogEntry {
  "@timestamp": string;
  ip: string;
  verb: string;
  path: string;
  status: number;
  bytes: number;
  referrer: string;
  user_agent: string;
  host: string;
  latency_ms: number;
  geo: {
    country: string;
    city: string;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: "timeseries" | "kpi" | "bar" | "pie" | "donut" | "table" | "heatmap" | "geo";
  title: string;
  config: Record<string, unknown>;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Alert {
  id: string;
  name: string;
  query: string;
  threshold: number;
  schedule: string;
  status: "active" | "inactive";
  lastTriggered?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "contained" | "resolved";
  timeline: Array<{
    timestamp: string;
    event: string;
    user: string;
  }>;
  queries: string[];
  alerts: string[];
  assignees: string[];
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  description?: string;
  tags: string[];
  lastRun?: string;
  owner: string;
}

// Generate sample log data
function generateLogEntry(baseTime: Date, index: number): LogEntry {
  const timestamp = new Date(baseTime.getTime() + index * 60000); // 1 min intervals
  
  // Realistic distributions
  const statuses = [
    ...Array(90).fill(200), // 90% success
    ...Array(6).fill(404),  // 6% not found
    ...Array(2).fill(500),  // 2% server error
    ...Array(2).fill(401),  // 2% unauthorized
  ];
  
  const paths = [
    "/", "/", "/", "/", "/", // 50% home
    "/login", "/login", "/login",
    "/api/users", "/api/users",
    "/report/export",
    "/wp-login.php", "/wp-login.php", // Suspicious
    "/health",
    "/404",
  ];
  
  const ips = [
    "203.0.113.45", // AZ - frequent
    "198.51.100.22", // TR - frequent
    "192.0.2.77", // RU - suspicious (wp-login attempts)
    "203.0.113.88", // DE
    "198.51.100.33", // TR
    "192.0.2.99", // RU
    "203.0.113.12", // AZ
  ];
  
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "curl/8.4.0",
    "python-requests/2.31",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  ];
  
  const status = statuses[Math.floor(Math.random() * statuses.length)] as number;
  const path = paths[Math.floor(Math.random() * paths.length)] as string;
  const ip = ips[Math.floor(Math.random() * ips.length)] as string;
  
  // Create spikes at 10:00 and 19:00
  const hour = timestamp.getUTCHours();
  const spikeMultiplier = (hour === 10 || hour === 19) ? 3 : 1;
  
  // Suspicious IP behavior
  let suspiciousModifier = 1;
  if (ip === "192.0.2.77" && path === "/wp-login.php") {
    suspiciousModifier = 10; // Many attempts
  }
  
  // Long latency on /report/export
  let latency = Math.floor(Math.random() * 100) + 20;
  if (path === "/report/export") {
    latency = Math.floor(Math.random() * 500) + 700;
  }
  
  const geoMap: Record<string, { country: string; city: string }> = {
    "203.0.113.45": { country: "AZ", city: "Baku" },
    "198.51.100.22": { country: "TR", city: "Istanbul" },
    "192.0.2.77": { country: "RU", city: "Moscow" },
    "203.0.113.88": { country: "DE", city: "Frankfurt" },
    "198.51.100.33": { country: "TR", city: "Ankara" },
    "192.0.2.99": { country: "RU", city: "Saint Petersburg" },
    "203.0.113.12": { country: "AZ", city: "Ganja" },
  };
  
  return {
    "@timestamp": timestamp.toISOString(),
    ip,
    verb: Math.random() > 0.9 ? "POST" : "GET",
    path,
    status,
    bytes: Math.floor(Math.random() * 10000) + 100,
    referrer: Math.random() > 0.7 ? "/" : "-",
    user_agent: userAgents[Math.floor(Math.random() * userAgents.length)] as string,
    host: "thorensic.demo",
    latency_ms: latency,
    geo: geoMap[ip] || { country: "US", city: "Unknown" },
  };
}

// Generate 5000 log entries
const baseTime = new Date("2025-11-03T18:00:00Z");
export const sampleLogs: LogEntry[] = Array.from({ length: 5000 }, (_, i) => 
  generateLogEntry(baseTime, i)
);

// Sample JSON lines for upload
export const sampleJsonLines = `{"@timestamp":"2025-11-03T18:41:20Z","ip":"203.0.113.45","verb":"GET","path":"/","status":200,"bytes":5123,"referrer":"-","user_agent":"Mozilla/5.0","host":"thorensic.demo","latency_ms":42,"geo":{"country":"AZ","city":"Baku"}}
{"@timestamp":"2025-11-03T18:42:01Z","ip":"198.51.100.22","verb":"POST","path":"/login","status":401,"bytes":321,"referrer":"/","user_agent":"curl/8.4.0","host":"thorensic.demo","latency_ms":11,"geo":{"country":"TR","city":"Istanbul"}}
{"@timestamp":"2025-11-03T18:43:10Z","ip":"192.0.2.77","verb":"GET","path":"/wp-login.php","status":403,"bytes":1290,"referrer":"-","user_agent":"python-requests/2.31","host":"thorensic.demo","latency_ms":18,"geo":{"country":"RU","city":"Moscow"}}
{"@timestamp":"2025-11-03T19:01:02Z","ip":"203.0.113.45","verb":"GET","path":"/report/export","status":200,"bytes":842001,"referrer":"/report","user_agent":"Mozilla/5.0","host":"thorensic.demo","latency_ms":910,"geo":{"country":"AZ","city":"Baku"}}
{"@timestamp":"2025-11-03T19:05:41Z","ip":"198.51.100.22","verb":"GET","path":"/health","status":200,"bytes":24,"referrer":"-","user_agent":"curl/8.4.0","host":"thorensic.demo","latency_ms":2,"geo":{"country":"TR","city":"Istanbul"}}
{"@timestamp":"2025-11-03T19:06:09Z","ip":"192.0.2.77","verb":"GET","path":"/wp-login.php","status":403,"bytes":1290,"referrer":"-","user_agent":"python-requests/2.31","host":"thorensic.demo","latency_ms":20,"geo":{"country":"RU","city":"Moscow"}}
{"@timestamp":"2025-11-03T19:06:20Z","ip":"192.0.2.77","verb":"GET","path":"/wp-login.php","status":403,"bytes":1290,"referrer":"-","user_agent":"python-requests/2.31","host":"thorensic.demo","latency_ms":23,"geo":{"country":"RU","city":"Moscow"}}
{"@timestamp":"2025-11-03T19:07:55Z","ip":"203.0.113.88","verb":"GET","path":"/404","status":404,"bytes":512,"referrer":"-","user_agent":"Mozilla/5.0","host":"thorensic.demo","latency_ms":35,"geo":{"country":"DE","city":"Frankfurt"}}`;

// Seed data
export const seedDashboards: Dashboard[] = [
  {
    id: "dash-1",
    name: "Operations Overview",
    widgets: [
      { id: "w1", type: "timeseries", title: "Requests Over Time", config: {}, x: 0, y: 0, w: 12, h: 4 },
      { id: "w2", type: "kpi", title: "Error Rate", config: { value: "2.1%" }, x: 0, y: 4, w: 3, h: 2 },
      { id: "w3", type: "kpi", title: "P95 Latency", config: { value: "142ms" }, x: 3, y: 4, w: 3, h: 2 },
      { id: "w4", type: "bar", title: "Top Endpoints", config: {}, x: 6, y: 4, w: 6, h: 2 },
      { id: "w5", type: "table", title: "Top Referrers", config: {}, x: 0, y: 6, w: 6, h: 4 },
      { id: "w6", type: "geo", title: "Geo Distribution", config: {}, x: 6, y: 6, w: 6, h: 4 },
    ],
  },
  {
    id: "dash-2",
    name: "Security Watch",
    widgets: [
      { id: "w7", type: "timeseries", title: "Anomalies Detected", config: {}, x: 0, y: 0, w: 12, h: 4 },
      { id: "w8", type: "bar", title: "Top Attack Patterns", config: {}, x: 0, y: 4, w: 6, h: 4 },
      { id: "w9", type: "table", title: "Suspicious IPs", config: {}, x: 6, y: 4, w: 6, h: 4 },
    ],
  },
];

export const seedAlerts: Alert[] = [
  {
    id: "alert-1",
    name: "5xx rate > 3%",
    query: "status:>=500",
    threshold: 3,
    schedule: "*/5 * * * *",
    status: "active",
    lastTriggered: "2025-11-03T19:00:00Z",
  },
  {
    id: "alert-2",
    name: "Brute-force pattern on /wp-login.php",
    query: "path:/wp-login.php AND status:403",
    threshold: 10,
    schedule: "*/1 * * * *",
    status: "active",
    lastTriggered: "2025-11-03T19:06:00Z",
  },
  {
    id: "alert-3",
    name: "Burst of 404s per IP",
    query: "status:404",
    threshold: 50,
    schedule: "*/10 * * * *",
    status: "active",
  },
];

export const seedQueries: SavedQuery[] = [
  {
    id: "query-1",
    name: "Failed Login Attempts",
    query: "verb:POST AND path:/login AND status:401",
    description: "All failed login attempts in the last 24 hours",
    tags: ["security", "auth"],
    lastRun: "2025-11-03T19:00:00Z",
    owner: "admin",
  },
  {
    id: "query-2",
    name: "Slow Endpoints",
    query: "latency_ms:>500",
    description: "Endpoints with latency over 500ms",
    tags: ["performance"],
    lastRun: "2025-11-03T18:30:00Z",
    owner: "admin",
  },
  {
    id: "query-3",
    name: "Suspicious User Agents",
    query: "user_agent:curl OR user_agent:python",
    description: "Requests from automated tools",
    tags: ["security", "bots"],
    lastRun: "2025-11-03T17:00:00Z",
    owner: "admin",
  },
];

export const seedIncidents: Incident[] = [
  {
    id: "inc-1",
    title: "Brute Force Attack on /wp-login.php",
    severity: "high",
    status: "investigating",
    timeline: [
      { timestamp: "2025-11-03T19:00:00Z", event: "Alert triggered: Brute-force pattern detected", user: "System" },
      { timestamp: "2025-11-03T19:05:00Z", event: "Incident created", user: "admin" },
      { timestamp: "2025-11-03T19:10:00Z", event: "IP 192.0.2.77 blocked", user: "admin" },
    ],
    queries: ["query-1"],
    alerts: ["alert-2"],
    assignees: ["admin"],
    tasks: [
      { id: "t1", text: "Block suspicious IPs", completed: true },
      { id: "t2", text: "Review access logs", completed: false },
      { id: "t3", text: "Update firewall rules", completed: false },
    ],
  },
];

// Mock API functions
export const mockLogService = {
  getLogs: (filters?: Record<string, unknown>) => {
    let logs = [...sampleLogs];
    
    if (filters) {
      if (filters.status) {
        logs = logs.filter((log) => log.status === filters.status);
      }
      if (filters.path) {
        logs = logs.filter((log) => log.path.includes(filters.path as string));
      }
      if (filters.ip) {
        logs = logs.filter((log) => log.ip === filters.ip);
      }
      if (filters.timeRange) {
        const { start, end } = filters.timeRange as { start: string; end: string };
        logs = logs.filter((log) => {
          const ts = new Date(log["@timestamp"]);
          return ts >= new Date(start) && ts <= new Date(end);
        });
      }
    }
    
    return Promise.resolve(logs);
  },
  
  getAggregations: (field: keyof LogEntry, filters?: Record<string, unknown>) => {
    return mockLogService.getLogs(filters).then((logs) => {
      const counts: Record<string, number> = {};
      logs.forEach((log) => {
        const value = log[field];
        const key = typeof value === "object" ? JSON.stringify(value) : String(value);
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    });
  },
  
  getTimeSeries: (filters?: Record<string, unknown>) => {
    return mockLogService.getLogs(filters).then((logs) => {
      const buckets: Record<string, number> = {};
      logs.forEach((log) => {
        const timestamp = new Date(log["@timestamp"]);
        const bucket = `${timestamp.getUTCFullYear()}-${String(timestamp.getUTCMonth() + 1).padStart(2, "0")}-${String(timestamp.getUTCDate()).padStart(2, "0")} ${String(timestamp.getUTCHours()).padStart(2, "0")}:00:00`;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      });
      return Object.entries(buckets)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => a.time.localeCompare(b.time));
    });
  },
};

