const SHEET_ID = "1ydkkBv6DKesQDu-xUHrbq-W_-jk-dskdpNVz1f-9-G0";

export type MonthlyRow = {
  month: string;
  ios: number;
  android: number;
  total: number;
};

export type WeeklyRow = {
  week: string;
  ios: number;
  android: number;
  total: number;
};

export type AppData = {
  monthly: MonthlyRow[];
  weekly: WeeklyRow[];
};

export type DashboardData = {
  business: AppData;
  couple: AppData;
  fetchedAt: string;
};

export type DerivedMetrics = {
  // Volume (cumulative — latest monthly snapshot)
  totalDownloads: number;
  totalIOS: number;
  totalAndroid: number;

  // Latest cumulative snapshots (raw sheet values)
  latestMonth: MonthlyRow | null;
  latestWeek: WeeklyRow | null;
  prevMonth: MonthlyRow | null;
  prevWeek: WeeklyRow | null;

  // Period deltas (downloads within each week/month, not cumulative)
  weeklyDeltas: WeeklyRow[];
  monthlyDeltas: MonthlyRow[];
  latestWeekDownloads: number;
  latestMonthDownloads: number;

  // Growth — monthly
  momAbsolute: number;
  momPercent: number;

  // Growth — weekly
  wowAbsolute: number;
  wowPercent: number;

  // Platform split (from latest cumulative monthly snapshot)
  iosPct: number;
  androidPct: number;

  // Weekly velocity (mean of per-week download deltas)
  avgWeeklyDownloads: number;

  // Best period by downloads in that week/month (delta, not cumulative)
  peakMonth: MonthlyRow | null;
  peakWeek: WeeklyRow | null;

  // Downloads gained in the latest month (same as momAbsolute)
  thisMonthNewInstalls: number;

  // Goal
  goalTotal: number;
  goalProgress: number;
  remainingToGoal: number;
};

/** Convert cumulative snapshots into per-period download counts. */
export function toWeeklyDeltas(rows: WeeklyRow[]): WeeklyRow[] {
  return rows.map((row, i) => {
    const prev = i > 0 ? rows[i - 1] : null;
    return {
      week: row.week,
      ios: row.ios - (prev?.ios ?? 0),
      android: row.android - (prev?.android ?? 0),
      total: row.total - (prev?.total ?? 0),
    };
  });
}

/** Convert cumulative snapshots into per-period download counts. */
export function toMonthlyDeltas(rows: MonthlyRow[]): MonthlyRow[] {
  return rows.map((row, i) => {
    const prev = i > 0 ? rows[i - 1] : null;
    return {
      month: row.month,
      ios: row.ios - (prev?.ios ?? 0),
      android: row.android - (prev?.android ?? 0),
      total: row.total - (prev?.total ?? 0),
    };
  });
}

function peakByDelta<T extends { total: number }>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return rows.reduce((a, b) => (b.total > a.total ? b : a));
}

/** Skip the first snapshot — its delta is the full cumulative baseline, not one period. */
function periodChanges<T>(deltas: T[]): T[] {
  return deltas.length > 1 ? deltas.slice(1) : deltas;
}

type FetchOptions = {
  fresh?: boolean;
};

async function fetchCSV(sheet: string, options?: FetchOptions): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(
    url,
    options?.fresh ? { cache: "no-store" } : { next: { revalidate: 3600 } },
  );
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${sheet}`);
  const text = await res.text();
  return text
    .trim()
    .split("\n")
    .slice(1)
    .filter((r) => r.trim())
    .map((row) => {
      const cols: string[] = [];
      let inQuote = false;
      let current = "";
      for (const ch of row) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === "," && !inQuote) { cols.push(current.trim()); current = ""; }
        else { current += ch; }
      }
      cols.push(current.trim());
      return cols;
    });
}

function parseMonthly(rows: string[][]): MonthlyRow[] {
  return rows
    .filter((r) => r[0] && r[3] && !isNaN(parseInt(r[3])))
    .map((r) => ({
      month: r[0],
      ios: parseInt(r[1]) || 0,
      android: parseInt(r[2]) || 0,
      total: parseInt(r[3]) || 0,
    }));
}

function parseWeekly(rows: string[][]): WeeklyRow[] {
  return rows
    .filter((r) => r[0] && r[3] && !isNaN(parseInt(r[3])))
    .map((r) => ({
      week: r[0],
      ios: parseInt(r[1]) || 0,
      android: parseInt(r[2]) || 0,
      total: parseInt(r[3]) || 0,
    }));
}

export async function fetchDashboardData(
  options?: FetchOptions,
): Promise<DashboardData> {
  const [bizMonthly, bizWeekly, cplMonthly, cplWeekly] = await Promise.all([
    fetchCSV("Business_Monthly", options),
    fetchCSV("Business_Weekly", options),
    fetchCSV("Couple_Monthly", options),
    fetchCSV("Couple_Weekly", options),
  ]);

  return {
    business: {
      monthly: parseMonthly(bizMonthly),
      weekly: parseWeekly(bizWeekly),
    },
    couple: {
      monthly: parseMonthly(cplMonthly),
      weekly: parseWeekly(cplWeekly),
    },
    fetchedAt: new Date().toISOString(),
  };
}

export function deriveMetrics(data: AppData, goalTotal = 50000): DerivedMetrics {
  const { monthly, weekly } = data;

  const weeklyDeltas = toWeeklyDeltas(weekly);
  const monthlyDeltas = toMonthlyDeltas(monthly);

  const latestMonth = monthly.length > 0 ? monthly[monthly.length - 1] : null;
  const prevMonth = monthly.length > 1 ? monthly[monthly.length - 2] : null;
  const latestWeek = weekly.length > 0 ? weekly[weekly.length - 1] : null;
  const prevWeek = weekly.length > 1 ? weekly[weekly.length - 2] : null;

  const latestWeekDelta = weeklyDeltas.length > 0 ? weeklyDeltas[weeklyDeltas.length - 1] : null;
  const latestMonthDelta = monthlyDeltas.length > 0 ? monthlyDeltas[monthlyDeltas.length - 1] : null;

  const totalDownloads = latestMonth?.total ?? 0;
  const totalIOS = latestMonth?.ios ?? 0;
  const totalAndroid = latestMonth?.android ?? 0;

  const momAbsolute = latestMonthDelta?.total ?? 0;
  const momPercent = prevMonth && prevMonth.total > 0
    ? (momAbsolute / prevMonth.total) * 100
    : 0;

  const prevWeekDelta = weeklyDeltas.length > 1 ? weeklyDeltas[weeklyDeltas.length - 2] : null;
  const wowAbsolute =
    latestWeekDelta && prevWeekDelta
      ? latestWeekDelta.total - prevWeekDelta.total
      : 0;
  const wowPercent =
    prevWeekDelta && prevWeekDelta.total > 0
      ? (wowAbsolute / prevWeekDelta.total) * 100
      : 0;

  const iosPct = totalDownloads > 0 ? (totalIOS / totalDownloads) * 100 : 0;
  const androidPct = 100 - iosPct;

  const weeklyChanges = periodChanges(weeklyDeltas);
  const monthlyChanges = periodChanges(monthlyDeltas);

  const avgWeeklyDownloads = weeklyChanges.length > 0
    ? weeklyChanges.reduce((s, r) => s + r.total, 0) / weeklyChanges.length
    : 0;

  const peakMonth = peakByDelta(monthlyChanges);
  const peakWeek = peakByDelta(weeklyChanges);

  const thisMonthNewInstalls = momAbsolute;

  const goalProgress = goalTotal > 0 ? Math.min((totalDownloads / goalTotal) * 100, 100) : 0;
  const remainingToGoal = Math.max(goalTotal - totalDownloads, 0);

  return {
    totalDownloads, totalIOS, totalAndroid,
    latestMonth, latestWeek, prevMonth, prevWeek,
    weeklyDeltas, monthlyDeltas,
    latestWeekDownloads: latestWeekDelta?.total ?? 0,
    latestMonthDownloads: latestMonthDelta?.total ?? 0,
    momAbsolute, momPercent,
    wowAbsolute, wowPercent,
    iosPct, androidPct,
    avgWeeklyDownloads,
    peakMonth, peakWeek,
    thisMonthNewInstalls,
    goalTotal, goalProgress, remainingToGoal,
  };
}
