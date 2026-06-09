import { assessFreshness } from "@/lib/freshness";
import { fetchDashboardData } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchDashboardData({ fresh: true });
    const freshness = assessFreshness(data);
    return Response.json({ data, freshness });
  } catch {
    return Response.json(
      { error: "Failed to fetch dashboard data from Google Sheets." },
      { status: 500 },
    );
  }
}
