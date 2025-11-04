import { useState } from "react";
import { AppLayout } from "@/components/app-shell/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Edit, Save, X, Plus } from "lucide-react";
import { seedDashboards, mockLogService } from "@/lib/mock-data";
import { t } from "@/lib/i18n";
import { useEffect } from "react";

export default function DashboardPage() {
  const [dashboards] = useState(seedDashboards);
  const [selectedDashboard, setSelectedDashboard] = useState(seedDashboards[0]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [timeSeries, setTimeSeries] = useState<Array<{ time: string; count: number }>>([]);

  useEffect(() => {
    mockLogService.getTimeSeries().then(setTimeSeries);
  }, []);

  const pieData = [
    { name: "200", value: 4500 },
    { name: "404", value: 300 },
    { name: "500", value: 100 },
    { name: "401", value: 100 },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent))"];

  const barData = [
    { name: "/", count: 2500 },
    { name: "/login", count: 800 },
    { name: "/api/users", count: 600 },
    { name: "/report/export", count: 200 },
    { name: "/wp-login.php", count: 150 },
  ];

  const renderWidget = (widget: typeof selectedDashboard.widgets[0]) => {
    switch (widget.type) {
      case "timeseries":
        return <TimeSeriesChart data={timeSeries} title={widget.title} />;
      case "kpi":
        return (
          <Card className="p-6 h-full flex flex-col justify-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{widget.title}</h3>
            <p className="text-3xl font-bold tabular-nums">{widget.config.value as string}</p>
          </Card>
        );
      case "bar":
        return (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{widget.title}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        );
      case "pie":
      case "donut":
        return (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{widget.title}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        );
      case "table":
        return (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{widget.title}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>-</TableCell>
                  <TableCell className="text-right tabular-nums">3200</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>https://example.com</TableCell>
                  <TableCell className="text-right tabular-nums">850</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>https://google.com</TableCell>
                  <TableCell className="text-right tabular-nums">450</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        );
      case "geo":
        return (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{widget.title}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">AZ</span>
                <Badge>2,450</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">TR</span>
                <Badge>1,200</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">RU</span>
                <Badge>850</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">DE</span>
                <Badge>500</Badge>
              </div>
            </div>
          </Card>
        );
      default:
        return <Card className="p-6">{widget.title}</Card>;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{t("nav.dashboard")}</h1>
            <p className="text-muted-foreground">Executive overview of your log data</p>
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t("dashboard.cancel")}
                </Button>
                <Button onClick={() => setIsEditMode(false)}>
                  <Save className="h-4 w-4 mr-2" />
                  {t("dashboard.save")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("dashboard.edit")}
                </Button>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.addWidget")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Selector */}
        <div className="flex gap-2">
          {dashboards.map((dash) => (
            <Button
              key={dash.id}
              variant={selectedDashboard.id === dash.id ? "default" : "outline"}
              onClick={() => setSelectedDashboard(dash)}
            >
              {dash.name}
            </Button>
          ))}
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-12 gap-4 auto-rows-min">
          {selectedDashboard.widgets.map((widget) => (
            <div
              key={widget.id}
              className={`col-span-${widget.w} row-span-${widget.h} ${isEditMode ? "border-2 border-dashed border-primary" : ""}`}
              style={{
                gridColumn: `span ${widget.w}`,
                gridRow: `span ${widget.h}`,
              }}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

