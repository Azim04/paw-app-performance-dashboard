"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Props = {
  ios: number;
  android: number;
  iosColor: string;
  androidColor: string;
};

export default function PlatformDonut({ ios, android, iosColor, androidColor }: Props) {
  const total = ios + android;
  const data = [
    { name: `iOS`, value: ios, pct: total ? ((ios / total) * 100).toFixed(1) : "0" },
    { name: `Android`, value: android, pct: total ? ((android / total) * 100).toFixed(1) : "0" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={iosColor} />
          <Cell fill={androidColor} />
        </Pie>
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 13 }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(value: number) => [value.toLocaleString(), ""]}
        />
        <Legend
          formatter={(val, entry) => {
            const pct = (entry as { payload?: { pct?: string } }).payload?.pct;
            return (
              <span style={{ color: "#a1a1aa", fontSize: 12 }}>
                {val} <span style={{ color: "#ffffff", fontWeight: 500 }}>{pct}%</span>
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
