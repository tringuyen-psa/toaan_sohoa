"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userColor } from "@/lib/colors";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "#1e3a8a", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export function PagesByUserChart({
  data,
}: {
  data: { name: string; pages: number; key?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Số trang theo người</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="pages" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={userColor(d.key ?? d.name).border} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PagesByDayChart({ data }: { data: { day: string; pages: number; records: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Số trang & số HS theo ngày</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="pages" name="Số trang" stroke="#1e3a8a" strokeWidth={2} />
            <Line type="monotone" dataKey="records" name="Số HS" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DocTypePieChart({ data }: { data: { name: string; value: number }[] }) {
  const safe = data.filter((d) => d.value > 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tỷ lệ loại hồ sơ (theo số trang)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safe}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label={(p) => `${p.name}: ${p.value}`}
              labelLine={false}
              fontSize={11}
            >
              {safe.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
