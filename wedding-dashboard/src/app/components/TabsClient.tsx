"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/sheets";
import CombinedSection from "./CombinedSection";
import AppSection from "./AppSection";
import { Layers, Building2, Heart } from "lucide-react";

type Props = {
  data: DashboardData;
};

const TABS = [
  { id: "combined", label: "Portfolio", icon: Layers },
  { id: "business", label: "Business", icon: Building2 },
  { id: "couple", label: "Couple", icon: Heart },
] as const;

export default function TabsClient({ data }: Props) {
  const [active, setActive] = useState<"combined" | "business" | "couple">("combined");

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === id
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "combined" && (
        <CombinedSection business={data.business} couple={data.couple} />
      )}
      {active === "business" && (
        <AppSection
          appName="Plan A Wedding — Business"
          appTag="Business"
          data={data.business}
          accent="text-violet-400"
          borderAccent="border-violet-800/50"
          iosColor="#7c3aed"
          androidColor="#a78bfa"
          progressBarColor="bg-violet-500"
        />
      )}
      {active === "couple" && (
        <AppSection
          appName="Plan A Wedding — Couple"
          appTag="Couple"
          data={data.couple}
          accent="text-teal-400"
          borderAccent="border-teal-800/50"
          iosColor="#0d9488"
          androidColor="#5eead4"
          progressBarColor="bg-teal-500"
        />
      )}
    </>
  );
}
