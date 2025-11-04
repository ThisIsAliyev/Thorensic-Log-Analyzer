import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { Card } from "@/components/ui/card";

interface TimeSeriesData {
  time: string;
  count: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  title?: string;
  onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
}

export function TimeSeriesChart({ data, title, onBrushChange }: TimeSeriesChartProps) {
  return (
    <Card className="p-6">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Brush
            dataKey="time"
            height={30}
            stroke="hsl(var(--primary))"
            fill="hsl(var(--muted))"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

