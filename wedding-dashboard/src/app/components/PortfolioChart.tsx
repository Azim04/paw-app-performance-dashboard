"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

type Props = {
  bizTotal: number;
  cplTotal: number;
  bizIOS: number;
  bizAndroid: number;
  cplIOS: number;
  cplAndroid: number;
};

export default function PortfolioChart({ bizTotal, cplTotal, bizIOS, bizAndroid, cplIOS, cplAndroid }: Props) {
  const data = [
    { name: "Business", iOS: bizIOS, Android: bizAndroid, Total: bizTotal },
    { name: "Couple", iOS: cplIOS, Android: cplAndroid, Total: cplTotal },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} barCategoryGap="40%">
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 13 }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(val: number) => val.toLocaleString()}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12, color: "#a1a1aa" }} iconType="square" iconSize={10} />
        <Bar dataKey="iOS" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} maxBarSize={64} />
        <Bar dataKey="Android" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={64} />
      </BarChart>
    </ResponsiveContainer>
  );
}
