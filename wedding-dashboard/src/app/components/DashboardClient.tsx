"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import type { DashboardData } from "@/lib/sheets";
import { fmt } from "@/lib/format";
import {
  assessFreshness,
  type FreshnessStatus,
} from "@/lib/freshness";
import DataFreshnessBanner from "./DataFreshnessBanner";
import TabsClient from "./TabsClient";

type Props = {
  initialData: DashboardData;
  initialFreshness: FreshnessStatus;
};

function formatSyncTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardClient({
  initialData,
  initialFreshness,
}: Props) {
  const [data, setData] = useState(initialData);
  const [freshness, setFreshness] = useState(initialFreshness);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const combined = useMemo(() => {
    const biz = data.business.monthly.at(-1)?.total ?? 0;
    const cpl = data.couple.monthly.at(-1)?.total ?? 0;
    return biz + cpl;
  }, [data]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Refresh failed");
      }
      setData(json.data);
      setFreshness(json.freshness);
    } catch (err) {
      setRefreshError(
        err instanceof Error ? err.message : "Could not refresh data.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  const syncLabel = freshness.isCacheStale
    ? `Synced ${formatSyncTime(data.fetchedAt)} · may be cached`
    : `Synced ${formatSyncTime(data.fetchedAt)}`;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/paw_brand_logo.svg"
              alt="Mobile Apps Logo"
              width={300}
              height={90.81}
              className="text-[#863AC1]"
            />
          </div>
          <p className="text-xs font-medium tracking-widest text-zinc-600 uppercase mb-2">
            Variety Vintage Technologies Pvt. Ltd.
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            App Download Tracker
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Plan A Wedding - Business &amp; Couple · Live from Google Sheets
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-3xl font-bold text-white">
            {fmt(combined)}
            <span className="text-zinc-600 text-lg font-normal ml-1">total</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg px-2 py-1 hover:bg-zinc-800/60"
              title="Fetch latest data from Google Sheets"
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin" : undefined}
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <span
              className={`text-xs ${
                freshness.isCacheStale ? "text-amber-500/80" : "text-zinc-600"
              }`}
            >
              {syncLabel}
            </span>
          </div>
          {refreshError && (
            <p className="text-xs text-red-400 max-w-xs text-right">{refreshError}</p>
          )}
        </div>
      </div>

      <DataFreshnessBanner warnings={freshness.warnings} />
      <TabsClient data={data} />
    </>
  );
}
