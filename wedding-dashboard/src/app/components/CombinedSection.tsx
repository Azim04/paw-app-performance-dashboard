import KpiCard from "./KpiCard";
import GrowthBadge from "./GrowthBadge";
import ProgressBar from "./ProgressBar";
import PortfolioChart from "./PortfolioChart";
import { fmt } from "@/lib/format";
import { deriveMetrics, type AppData } from "@/lib/sheets";
import { Download, Target, BarChart2, Layers } from "lucide-react";
import Image from "next/image";

type Props = {
  business: AppData;
  couple: AppData;
};

export default function CombinedSection({ business, couple }: Props) {
  const bm = deriveMetrics(business);
  const cm = deriveMetrics(couple);

  const combined = bm.totalDownloads + cm.totalDownloads;
  const GOAL = 50000;
  const combinedProgress = Math.min((combined / GOAL) * 100, 100);
  const remainingToGoal = Math.max(GOAL - combined, 0);

  const combinedIOS = bm.totalIOS + cm.totalIOS;
  const combinedAndroid = bm.totalAndroid + cm.totalAndroid;
  const combinedIosPct = combined > 0 ? (combinedIOS / combined) * 100 : 0;

  const bizShare = combined > 0 ? (bm.totalDownloads / combined) * 100 : 0;
  const cplShare = combined > 0 ? (cm.totalDownloads / combined) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Portfolio total"
          value={fmt(combined)}
          icon={<Download size={16} />}
          sub={
            <span className="text-zinc-500 text-xs">Both apps combined</span>
          }
          accent="border-violet-800/50"
        />
        <KpiCard
          label="Goal progress"
          value={`${combinedProgress.toFixed(0)}%`}
          icon={<Target size={16} />}
          sub={
            <span className="text-zinc-500 text-xs">
              {fmt(remainingToGoal)} to 50K
            </span>
          }
          footer={
            <ProgressBar value={combinedProgress} color="bg-violet-500" />
          }
          accent="border-violet-800/50"
        />
        <KpiCard
          label="Business app"
          value={fmt(bm.totalDownloads)}
          icon={
            <div className="flex items-center gap-3">
              <Image
                src="/business_app_logo.svg"
                alt="Mobile Apps Logo"
                width={16}
                height={16}
                className="text-[#863AC1]"
              />
            </div>
          }
          sub={
            <span className="text-violet-400 text-xs">
              {bizShare.toFixed(0)}% of portfolio
            </span>
          }
        />
        <KpiCard
          label="Couple app"
          value={fmt(cm.totalDownloads)}
          icon={
            <div className="flex items-center gap-3">
              <Image
                src="/couple_app_logo.svg"
                alt="Mobile Apps Logo"
                width={16}
                height={16}
                className="text-[#863AC1]"
              />
            </div>
          }
          sub={
            <span className="text-teal-400 text-xs">
              {cplShare.toFixed(0)}% of portfolio
            </span>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-300">
              Downloads by app
            </h3>
          </div>
          <PortfolioChart
            bizTotal={bm.totalDownloads}
            cplTotal={cm.totalDownloads}
            bizIOS={bm.totalIOS}
            bizAndroid={bm.totalAndroid}
            cplIOS={cm.totalIOS}
            cplAndroid={cm.totalAndroid}
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-5">
            Portfolio Breakdown
          </h3>
          <div className="space-y-4">
            {/* Business share bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">Business app</span>
                <span className="text-violet-400 font-medium">
                  {fmt(bm.totalDownloads)} ({bizShare.toFixed(0)}%)
                </span>
              </div>
              <ProgressBar
                value={bizShare}
                color="bg-violet-500"
                height="h-2.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">Couple app</span>
                <span className="text-teal-400 font-medium">
                  {fmt(cm.totalDownloads)} ({cplShare.toFixed(0)}%)
                </span>
              </div>
              <ProgressBar
                value={cplShare}
                color="bg-teal-500"
                height="h-2.5"
              />
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              {/* iOS Row */}
              <div className="flex justify-between text-xs items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src="/apple_logo.svg"
                    alt="iOS"
                    width={16}
                    height={16}
                    className="text-zinc-500 [filter:brightness(0.8)_saturate(0)_hue-rotate(240deg)]"
                  />
                  <span className="text-zinc-500">iOS across both apps</span>
                </div>
                <span className="text-zinc-300">
                  {fmt(combinedIOS)} ({combinedIosPct.toFixed(0)}%)
                </span>
              </div>

              {/* Android Row */}
              <div className="flex justify-between text-xs items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src="/android_logo.svg"
                    alt="Android"
                    width={16}
                    height={16}
                    className="text-zinc-500"
                  />
                  <span className="text-zinc-500">
                    Android across both apps
                  </span>
                </div>
                <span className="text-zinc-300">
                  {fmt(combinedAndroid)} ({(100 - combinedIosPct).toFixed(0)}%)
                </span>
              </div>

              {/* Remaining stats */}
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Remaining to 50K goal</span>
                <span className="text-zinc-300">{fmt(remainingToGoal)}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Business / Couple ratio</span>
                <span className="text-zinc-300">
                  {bizShare.toFixed(0)}:{cplShare.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-1">
          App-to-app comparison
        </h3>
        <p className="text-xs text-zinc-600 mb-4">Same metrics, side by side</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-zinc-500 font-medium py-2 pr-4">
                  Metric
                </th>
                <th className="text-right text-xs font-medium py-2 px-4 text-violet-400">
                  Business
                </th>
                <th className="text-right text-xs font-medium py-2 pl-4 text-teal-400">
                  Couple
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {[
                [
                  "Total downloads",
                  fmt(bm.totalDownloads),
                  fmt(cm.totalDownloads),
                ],
                ["iOS downloads", fmt(bm.totalIOS), fmt(cm.totalIOS)],
                [
                  "Android downloads",
                  fmt(bm.totalAndroid),
                  fmt(cm.totalAndroid),
                ],
                [
                  "iOS share",
                  `${bm.iosPct.toFixed(0)}%`,
                  `${cm.iosPct.toFixed(0)}%`,
                ],
                [
                  "Android share",
                  `${bm.androidPct.toFixed(0)}%`,
                  `${cm.androidPct.toFixed(0)}%`,
                ],
                [
                  "Latest week",
                  bm.latestWeek ? fmt(bm.latestWeek.total) : "—",
                  cm.latestWeek ? fmt(cm.latestWeek.total) : "—",
                ],
                [
                  "Peak month",
                  bm.peakMonth ? fmt(bm.peakMonth.total) : "—",
                  cm.peakMonth ? fmt(cm.peakMonth.total) : "—",
                ],
                [
                  "Goal progress",
                  `${bm.goalProgress.toFixed(0)}%`,
                  `${cm.goalProgress.toFixed(0)}%`,
                ],
                [
                  "Portfolio share",
                  `${bizShare.toFixed(0)}%`,
                  `${cplShare.toFixed(0)}%`,
                ],
              ].map(([label, biz, cpl], i) => (
                <tr key={i}>
                  <td className="py-2.5 pr-4 text-zinc-400 text-xs">{label}</td>
                  <td className="py-2.5 px-4 text-right text-zinc-200 font-medium">
                    {biz}
                  </td>
                  <td className="py-2.5 pl-4 text-right text-zinc-200 font-medium">
                    {cpl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
