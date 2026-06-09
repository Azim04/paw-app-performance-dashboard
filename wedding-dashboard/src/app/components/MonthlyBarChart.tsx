"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LabelList,
} from "recharts";
import type { MonthlyRow } from "@/lib/sheets";

type Props = {
  data: MonthlyRow[];
  iosColor: string;
  androidColor: string;
};

const tickFmt = (v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v));

export default function MonthlyBarChart({ data, iosColor, androidColor }: Props) {
  const chartData = data.map((r) => ({
    name: r.month.replace(" - ", "\n"),
    iOS: r.ios,
    Android: r.android,
    Total: r.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={tickFmt} tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 13 }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(val: number) => val.toLocaleString()}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Legend
          wrapperStyle={{ paddingTop: 12, fontSize: 12, color: "#a1a1aa" }}
          iconType="square"
          iconSize={10}
        />
        <Bar dataKey="iOS" fill={iosColor} radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.length === 1 && <LabelList dataKey="iOS" position="top" style={{ fill: iosColor, fontSize: 12, fontWeight: 500 }} />}
        </Bar>
        <Bar dataKey="Android" fill={androidColor} radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.length === 1 && <LabelList dataKey="Android" position="top" style={{ fill: androidColor, fontSize: 12, fontWeight: 500 }} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
