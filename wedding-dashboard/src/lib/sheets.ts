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
  // Volume
  totalDownloads: number;
  totalIOS: number;
  totalAndroid: number;

  // Latest period
  latestMonth: MonthlyRow | null;
  latestWeek: WeeklyRow | null;
  prevMonth: MonthlyRow | null;
  prevWeek: WeeklyRow | null;

  // Growth — monthly
  momAbsolute: number;
  momPercent: number;

  // Growth — weekly
  wowAbsolute: number;
  wowPercent: number;

  // Platform split
  iosPct: number;
  androidPct: number;

  // Weekly velocity (avg over all weeks logged)
  avgWeeklyDownloads: number;

  // Best ever
  peakMonth: MonthlyRow | null;
  peakWeek: WeeklyRow | null;

  // This month new installs (total - prev month total)
  thisMonthNewInstalls: number;

  // Goal
  goalTotal: number;
  goalProgress: number;
  remainingToGoal: number;
};

async function fetchCSV(sheet: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
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

export async function fetchDashboardData(): Promise<DashboardData> {
  const [bizMonthly, bizWeekly, cplMonthly, cplWeekly] = await Promise.all([
    fetchCSV("Business_Monthly"),
    fetchCSV("Business_Weekly"),
    fetchCSV("Couple_Monthly"),
    fetchCSV("Couple_Weekly"),
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

  const latestMonth = monthly.length > 0 ? monthly[monthly.length - 1] : null;
  const prevMonth = monthly.length > 1 ? monthly[monthly.length - 2] : null;
  const latestWeek = weekly.length > 0 ? weekly[weekly.length - 1] : null;
  const prevWeek = weekly.length > 1 ? weekly[weekly.length - 2] : null;

  const totalDownloads = latestMonth?.total ?? 0;
  const totalIOS = latestMonth?.ios ?? 0;
  const totalAndroid = latestMonth?.android ?? 0;

  const momAbsolute = latestMonth && prevMonth ? latestMonth.total - prevMonth.total : 0;
  const momPercent = prevMonth && prevMonth.total > 0
    ? ((latestMonth!.total - prevMonth.total) / prevMonth.total) * 100
    : 0;

  const wowAbsolute = latestWeek && prevWeek ? latestWeek.total - prevWeek.total : 0;
  const wowPercent = prevWeek && prevWeek.total > 0
    ? ((latestWeek!.total - prevWeek.total) / prevWeek.total) * 100
    : 0;

  const iosPct = totalDownloads > 0 ? (totalIOS / totalDownloads) * 100 : 0;
  const androidPct = 100 - iosPct;

  const avgWeeklyDownloads = weekly.length > 0
    ? weekly.reduce((s, r) => s + r.total, 0) / weekly.length
    : 0;

  const peakMonth = monthly.length > 0
    ? monthly.reduce((a, b) => (b.total > a.total ? b : a))
    : null;
  const peakWeek = weekly.length > 0
    ? weekly.reduce((a, b) => (b.total > a.total ? b : a))
    : null;

  const thisMonthNewInstalls = latestMonth && prevMonth
    ? latestMonth.total - prevMonth.total
    : latestMonth?.total ?? 0;

  const goalProgress = goalTotal > 0 ? Math.min((totalDownloads / goalTotal) * 100, 100) : 0;
  const remainingToGoal = Math.max(goalTotal - totalDownloads, 0);

  return {
    totalDownloads, totalIOS, totalAndroid,
    latestMonth, latestWeek, prevMonth, prevWeek,
    momAbsolute, momPercent,
    wowAbsolute, wowPercent,
    iosPct, androidPct,
    avgWeeklyDownloads,
    peakMonth, peakWeek,
    thisMonthNewInstalls,
    goalTotal, goalProgress, remainingToGoal,
  };
}
