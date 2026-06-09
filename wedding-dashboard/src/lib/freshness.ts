import type { AppData, DashboardData } from "./sheets";

export const CACHE_REVALIDATE_SECONDS = 3600;

export type FreshnessLevel = "info" | "warning";

export type FreshnessWarning = {
  level: FreshnessLevel;
  message: string;
};

export type FreshnessStatus = {
  fetchedAt: string;
  cacheAgeMinutes: number;
  isCacheStale: boolean;
  warnings: FreshnessWarning[];
};

const WEEKLY_OVERDUE_DAYS = 8;
const MONTHLY_GRACE_DAY = 5;

/** Parse DD-MM-YYYY or DD/MM/YYYY week labels from the sheet. */
export function parseSheetDate(raw: string): Date | null {
  const match = raw.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

/** Parse "January - 2026" or "June 2026" month labels from the sheet. */
export function parseSheetMonth(raw: string): Date | null {
  const normalized = raw.trim().replace(/\s*-\s*/, " ");
  const date = new Date(`${normalized} 1`);
  return isNaN(date.getTime()) ? null : date;
}

function daysBetween(older: Date, newer: Date): number {
  const ms = newer.getTime() - older.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function latestWeekDate(app: AppData): Date | null {
  const label = app.weekly.at(-1)?.week;
  return label ? parseSheetDate(label) : null;
}

function latestMonthDate(app: AppData): Date | null {
  const label = app.monthly.at(-1)?.month;
  return label ? parseSheetMonth(label) : null;
}

function isSameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function checkAppFreshness(
  appName: string,
  app: AppData,
  now: Date,
  warnings: FreshnessWarning[],
): void {
  if (app.weekly.length === 0) {
    warnings.push({
      level: "warning",
      message: `${appName}: no weekly rows in Google Sheets.`,
    });
  } else {
    const weekDate = latestWeekDate(app);
    if (!weekDate) {
      warnings.push({
        level: "warning",
        message: `${appName}: latest week date could not be parsed.`,
      });
    } else {
      const age = daysBetween(weekDate, now);
      if (age > WEEKLY_OVERDUE_DAYS) {
        warnings.push({
          level: "warning",
          message: `${appName} weekly data is ${age} days old (last row: ${app.weekly.at(-1)!.week}). Expected ~weekly sync.`,
        });
      }
    }
  }

  if (app.monthly.length === 0) {
    warnings.push({
      level: "warning",
      message: `${appName}: no monthly rows in Google Sheets.`,
    });
  } else {
    const monthDate = latestMonthDate(app);
    if (!monthDate) {
      warnings.push({
        level: "warning",
        message: `${appName}: latest month label could not be parsed.`,
      });
    } else if (
      !isSameCalendarMonth(monthDate, now) &&
      now.getDate() > MONTHLY_GRACE_DAY
    ) {
      const monthLabel = app.monthly.at(-1)!.month;
      warnings.push({
        level: "warning",
        message: `${appName} monthly data may be stale — latest row is ${monthLabel}, current month not yet recorded.`,
      });
    }
  }
}

export function assessFreshness(
  data: DashboardData,
  now: Date = new Date(),
): FreshnessStatus {
  const fetchedAt = new Date(data.fetchedAt);
  const cacheAgeMinutes = Math.max(
    0,
    Math.floor((now.getTime() - fetchedAt.getTime()) / (1000 * 60)),
  );
  const isCacheStale = cacheAgeMinutes * 60 >= CACHE_REVALIDATE_SECONDS;

  const warnings: FreshnessWarning[] = [];

  if (isCacheStale) {
    warnings.push({
      level: "info",
      message: `Dashboard loaded ${cacheAgeMinutes} min ago. Refresh to pull the latest from Google Sheets.`,
    });
  }

  checkAppFreshness("Business", data.business, now, warnings);
  checkAppFreshness("Couple", data.couple, now, warnings);

  return {
    fetchedAt: data.fetchedAt,
    cacheAgeMinutes,
    isCacheStale,
    warnings,
  };
}
