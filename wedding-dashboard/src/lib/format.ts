export const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

export const fmtPct = (n: number, decimals = 1) =>
  (n >= 0 ? "+" : "") + n.toFixed(decimals) + "%";

export const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.round(n).toString();
};

export const growthColor = (val: number) =>
  val > 0
    ? "text-emerald-400"
    : val < 0
    ? "text-red-400"
    : "text-zinc-500";

export const growthBg = (val: number) =>
  val > 0
    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
    : val < 0
    ? "bg-red-950/60 text-red-400 border border-red-800/40"
    : "bg-zinc-800 text-zinc-400 border border-zinc-700";
