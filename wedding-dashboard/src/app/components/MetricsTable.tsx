import GrowthBadge from "./GrowthBadge";
import ProgressBar from "./ProgressBar";
import { fmt, fmtShort } from "@/lib/format";
import type { DerivedMetrics } from "@/lib/sheets";

type Props = {
  metrics: DerivedMetrics;
  accentColor: string;
  progressBarColor: string;
};

export default function MetricsTable({
  metrics,
  accentColor,
  progressBarColor,
}: Props) {
  const m = metrics;

  const rows: {
    label: string;
    value: React.ReactNode;
    note?: React.ReactNode;
  }[] = [
    {
      label: "Total downloads",
      value: (
        <span className="font-semibold text-white">
          {fmt(m.totalDownloads)}
        </span>
      ),
      note: "All time",
    },
    {
      label: "iOS downloads",
      value: fmt(m.totalIOS),
      note: `${m.iosPct.toFixed(1)}% of Total`,
    },
    {
      label: "Android downloads",
      value: fmt(m.totalAndroid),
      note: `${m.androidPct.toFixed(1)}% of Total`,
    },
    {
      label: "Month-over-month",
      value: m.prevMonth ? (
        <GrowthBadge value={m.momPercent} size="md" />
      ) : (
        <span className="text-zinc-500 text-sm">No prior month</span>
      ),
      note: m.prevMonth
        ? `${m.momAbsolute >= 0 ? "+" : ""}${fmt(m.momAbsolute)} Downloads`
        : undefined,
    },
    {
      label: "Week-over-week",
      value: m.prevWeek ? (
        <GrowthBadge value={m.wowPercent} size="md" />
      ) : (
        <span className="text-zinc-500 text-sm">No prior week</span>
      ),
      note: m.prevWeek
        ? `${m.wowAbsolute >= 0 ? "+" : ""}${fmt(m.wowAbsolute)} Downloads`
        : undefined,
    },
    {
      label: "New This Month",
      value:
        m.thisMonthNewInstalls >= 0
          ? `+${fmt(m.thisMonthNewInstalls)}`
          : fmt(m.thisMonthNewInstalls),
      note: m.prevMonth
        ? `vs ${fmt(m.prevMonth.total)} Last Month`
        : "First Recorded Month",
    },
    {
      label: "Latest Week Downloads",
      value: m.latestWeek ? fmt(m.latestWeekDownloads) : "—",
      note: m.latestWeek ? m.latestWeek.week : undefined,
    },
    {
      label: "Avg Weekly Downloads",
      value: fmtShort(m.avgWeeklyDownloads),
      note: "Avg Weekly Downloads",
    },
    {
      label: "Platform Split",
      value: (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-blue-400">iOS {m.iosPct.toFixed(0)}%</span>
          <span className="text-zinc-600">/</span>
          <span className="text-green-400">
            Android {m.androidPct.toFixed(0)}%
          </span>
        </div>
      ),
    },
    {
      label: "Peak Month",
      value: m.peakMonth ? fmt(m.peakMonth.total) : "—",
      note: m.peakMonth
        ? `${m.peakMonth.month} · Most Downloads In A Month`
        : undefined,
    },
    {
      label: "Peak Week",
      value: m.peakWeek ? fmt(m.peakWeek.total) : "—",
      note: m.peakWeek
        ? `${m.peakWeek.week} · Most Downloads In One Week`
        : undefined,
    },
    {
      label: "Goal Progress (50K)",
      value: (
        <div className="w-full">
          <div className="flex justify-between mb-1 text-sm">
            <span className={`font-medium ${accentColor}`}>
              {m.goalProgress.toFixed(1)}%
            </span>
            <span className="text-zinc-500">
              {fmt(m.remainingToGoal)} remaining
            </span>
          </div>
          <ProgressBar
            value={m.goalProgress}
            color={progressBarColor}
            height="h-1.5"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="divide-y divide-zinc-800">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start justify-between py-3.5 gap-4">
          <span className="text-[13px] text-zinc-400 shrink-0 pt-0.5">
            {row.label}
          </span>
          <div className="text-right">
            <div className="text-[14px] text-zinc-200">{row.value}</div>
            {row.note && (
              <div className="text-[11px] text-zinc-500 mt-0.5">{row.note}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
