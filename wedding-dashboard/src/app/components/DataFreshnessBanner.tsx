import { AlertTriangle, Info } from "lucide-react";
import type { FreshnessWarning } from "@/lib/freshness";

type Props = {
  warnings: FreshnessWarning[];
};

export default function DataFreshnessBanner({ warnings }: Props) {
  if (warnings.length === 0) return null;

  const hasWarning = warnings.some((w) => w.level === "warning");

  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-6 ${
        hasWarning
          ? "bg-amber-950/30 border-amber-800/50"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <ul className="space-y-1.5">
        {warnings.map((warning, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 text-sm ${
              warning.level === "warning" ? "text-amber-200" : "text-zinc-400"
            }`}
          >
            {warning.level === "warning" ? (
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
            ) : (
              <Info size={15} className="shrink-0 mt-0.5 text-zinc-500" />
            )}
            <span>{warning.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
