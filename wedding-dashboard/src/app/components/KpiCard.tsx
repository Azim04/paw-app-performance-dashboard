import { ReactNode } from "react";

type Props = {
  label: string;
  value: string | ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  footer?: ReactNode;
};

export default function KpiCard({ label, value, sub, icon, accent = "border-zinc-800", footer }: Props) {
  return (
    <div className={`bg-zinc-900 border ${accent} rounded-xl p-5 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-widest text-zinc-500 uppercase">{label}</span>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>
      <div className="text-[28px] font-semibold text-white leading-tight mt-1">{value}</div>
      {sub && <div className="text-[13px] text-zinc-400 mt-0.5 flex items-center gap-1.5">{sub}</div>}
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}
