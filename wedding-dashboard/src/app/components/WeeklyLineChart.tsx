"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { WeeklyRow } from "@/lib/sheets";

type Props = {
  data: WeeklyRow[];
  color: string;
  showPlatforms?: boolean;
  iosColor?: string;
  androidColor?: string;
};

const tickFmt = (v: number) =>
  v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v);

export default function WeeklyLineChart({
  data,
  color,
  showPlatforms,
  iosColor,
  androidColor,
}: Props) {
  const chartData = data.map((r) => ({
    name: r.week,
    Total: r.total,
    iOS: r.ios,
    Android: r.android,
  }));

  const avg = data.length
    ? data.reduce((s, r) => s + r.total, 0) / data.length
    : 0;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={chartData}
        margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#27272a"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={tickFmt}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            fontSize: 13,
          }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(val: number) => val.toLocaleString()}
          cursor={{ stroke: "#3f3f46" }}
        />
        {data.length > 1 && (
          <ReferenceLine
            y={avg}
            stroke="#52525b"
            strokeDasharray="4 4"
            label={{ value: "Avg", fill: "#71717a", fontSize: 11 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="Total"
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
        {showPlatforms && iosColor && (
          <Line
            type="monotone"
            dataKey="iOS"
            stroke={iosColor}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
        )}
        {showPlatforms && androidColor && (
          <Line
            type="monotone"
            dataKey="Android"
            stroke={androidColor}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
