import { fetchDashboardData } from "@/lib/sheets";
import { fmt } from "@/lib/format";
import TabsClient from "./components/TabsClient";
import { RefreshCw } from "lucide-react";

export const revalidate = 3600; // revalidate every hour

export default async function DashboardPage() {
  let data;
  let error = false;

  try {
    data = await fetchDashboardData();
  } catch {
    error = true;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg font-medium mb-2">Failed to load data</div>
          <p className="text-zinc-500 text-sm">
            Make sure the Google Sheet is publicly accessible (Anyone with link → Viewer).
          </p>
        </div>
      </div>
    );
  }

  const bizTotal = data.business.monthly.at(-1)?.total ?? 0;
  const cplTotal = data.couple.monthly.at(-1)?.total ?? 0;
  const combined = bizTotal + cplTotal;
  const fetchTime = new Date(data.fetchedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest text-zinc-600 uppercase mb-2">
              Phundo Fintech India
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              App Download Tracker
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">
              Plan A Wedding — Business &amp; Couple · Live from Google Sheets
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-bold text-white">
              {fmt(combined)}
              <span className="text-zinc-600 text-lg font-normal ml-1">total</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <RefreshCw size={11} />
              Synced {fetchTime}
            </div>
          </div>
        </div>

        {/* Tabs + content */}
        <TabsClient data={data} />
      </div>
    </div>
  );
}
