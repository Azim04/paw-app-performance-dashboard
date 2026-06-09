import { assessFreshness } from "@/lib/freshness";
import { fetchDashboardData } from "@/lib/sheets";
import DashboardClient from "./components/DashboardClient";

export const revalidate = 3600;

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
          <div className="text-red-400 text-lg font-medium mb-2">
            Failed to load data
          </div>
          <p className="text-zinc-500 text-sm">
            Make sure the Google Sheet is publicly accessible (Anyone with link
            → Viewer).
          </p>
        </div>
      </div>
    );
  }

  const freshness = assessFreshness(data);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <DashboardClient initialData={data} initialFreshness={freshness} />
      </div>
    </div>
  );
}
