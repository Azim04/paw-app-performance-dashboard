import KpiCard from "./KpiCard";
import GrowthBadge from "./GrowthBadge";
import ProgressBar from "./ProgressBar";
import PlatformDonut from "./PlatformDonut";
import MonthlyBarChart from "./MonthlyBarChart";
import WeeklyLineChart from "./WeeklyLineChart";
import MetricsTable from "./MetricsTable";
import { fmt, fmtShort } from "@/lib/format";
import type { AppData } from "@/lib/sheets";
import { deriveMetrics } from "@/lib/sheets";
import {
  Download, TrendingUp, Target, Smartphone,
  BarChart2, Calendar, Trophy, Zap,
} from "lucide-react";

type Props = {
  appName: string;
  appTag: string;
  data: AppData;
  accent: string;          // tailwind text color
  borderAccent: string;    // tailwind border color
  iosColor: string;        // hex
  androidColor: string;    // hex
  progressBarColor: string; // tailwind bg color
};

export default function AppSection({
  appName, appTag, data, accent, borderAccent,
  iosColor, androidColor, progressBarColor,
}: Props) {
  const m = deriveMetrics(data);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total downloads"
          value={fmt(m.totalDownloads)}
          icon={<Download size={16} />}
          sub={
            m.prevMonth ? (
              <GrowthBadge value={m.momPercent} label="MoM" />
            ) : (
              <span className="text-zinc-600 text-xs">First month</span>
            )
          }
          accent={borderAccent}
        />
        <KpiCard
          label="This week"
          value={m.latestWeek ? fmt(m.latestWeek.total) : "—"}
          icon={<Calendar size={16} />}
          sub={
            m.prevWeek ? (
              <GrowthBadge value={m.wowPercent} label="WoW" />
            ) : (
              <span className="text-zinc-600 text-xs">First week</span>
            )
          }
          accent={borderAccent}
        />
        <KpiCard
          label="Avg weekly"
          value={fmtShort(m.avgWeeklyDownloads)}
          icon={<TrendingUp size={16} />}
          sub={<span className="text-zinc-500 text-xs">Per week avg</span>}
          accent={borderAccent}
        />
        <KpiCard
          label="Goal (50K)"
          value={`${m.goalProgress.toFixed(0)}%`}
          icon={<Target size={16} />}
          sub={<span className="text-zinc-500 text-xs">{fmt(m.remainingToGoal)} remaining</span>}
          footer={<ProgressBar value={m.goalProgress} color={progressBarColor} />}
          accent={borderAccent}
        />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="iOS downloads"
          value={fmt(m.totalIOS)}
          icon={<Smartphone size={16} />}
          sub={<span className="text-zinc-500 text-xs">{m.iosPct.toFixed(1)}% of total</span>}
        />
        <KpiCard
          label="Android downloads"
          value={fmt(m.totalAndroid)}
          icon={<Smartphone size={16} />}
          sub={<span className="text-zinc-500 text-xs">{m.androidPct.toFixed(1)}% of total</span>}
        />
        <KpiCard
          label="New this month"
          value={`${m.thisMonthNewInstalls >= 0 ? "+" : ""}${fmt(m.thisMonthNewInstalls)}`}
          icon={<Zap size={16} />}
          sub={<span className="text-zinc-500 text-xs">vs prior month</span>}
        />
        <KpiCard
          label="Peak month"
          value={m.peakMonth ? fmtShort(m.peakMonth.total) : "—"}
          icon={<Trophy size={16} />}
          sub={<span className="text-zinc-500 text-xs">{m.peakMonth?.month ?? "N/A"}</span>}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-300">Monthly downloads</h3>
            <span className={`ml-auto text-xs ${accent}`}>{appTag}</span>
          </div>
          {data.monthly.length > 0 ? (
            <MonthlyBarChart data={data.monthly} iosColor={iosColor} androidColor={androidColor} />
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">No monthly data yet</div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Platform split</h3>
          <PlatformDonut ios={m.totalIOS} android={m.totalAndroid} iosColor={iosColor} androidColor={androidColor} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="bg-zinc-800 rounded-lg p-2">
              <div className="text-xs text-zinc-500 mb-0.5">iOS</div>
              <div className="text-sm font-medium" style={{ color: iosColor }}>{m.iosPct.toFixed(0)}%</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <div className="text-xs text-zinc-500 mb-0.5">Android</div>
              <div className="text-sm font-medium" style={{ color: androidColor }}>{m.androidPct.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-300">Weekly download trend</h3>
          {m.prevWeek && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              WoW: <GrowthBadge value={m.wowPercent} />
            </div>
          )}
        </div>
        {data.weekly.length > 0 ? (
          <WeeklyLineChart
            data={data.weekly}
            color={iosColor}
            showPlatforms={true}
            iosColor={iosColor}
            androidColor={androidColor}
          />
        ) : (
          <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">No weekly data yet</div>
        )}
        <p className="text-[11px] text-zinc-600 mt-3">Dashed lines = iOS / Android breakdown. Solid = total. Dashed horizontal = average.</p>
      </div>

      {/* Full metrics table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-1">All derived metrics</h3>
        <p className="text-xs text-zinc-600 mb-4">Every stat computable from your current data</p>
        <MetricsTable metrics={m} accentColor={accent} progressBarColor={progressBarColor} />
      </div>
    </div>
  );
}
