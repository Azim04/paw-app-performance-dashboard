import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fmtPct, growthBg } from "@/lib/format";

type Props = {
  value: number;
  label?: string;
  size?: "sm" | "md";
};

export default function GrowthBadge({ value, label, size = "sm" }: Props) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const px = size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px} ${growthBg(value)}`}>
      <Icon size={size === "md" ? 14 : 12} />
      {fmtPct(value)}
      {label && <span className="opacity-70 ml-0.5">{label}</span>}
    </span>
  );
}
