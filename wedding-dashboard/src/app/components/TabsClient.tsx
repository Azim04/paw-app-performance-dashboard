"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/sheets";
import CombinedSection from "./CombinedSection";
import AppSection from "./AppSection";
import { Layers, Building2, Heart } from "lucide-react";
import Image from "next/image";

type IconType =
  | React.ComponentType<{ size?: number; className?: string }>
  | string;

type Tab = {
  id: "combined" | "business" | "couple";
  label: string;
  icon: IconType;
};

const TABS: Tab[] = [
  {
    id: "combined",
    label: "Portfolio",
    icon: Layers,
  },
  {
    id: "business",
    label: "Business",
    icon: "/business_app_logo.svg",
  },
  {
    id: "couple",
    label: "Couple",
    icon: "/couple_app_logo.svg",
  },
];

export default function TabsClient({ data }: { data: DashboardData }) {
  const [active, setActive] = useState<"combined" | "business" | "couple">(
    "combined",
  );

  const renderIcon = (icon: IconType, isActive: boolean) => {
    if (typeof icon === "string") {
      // It's an image path
      return (
        <Image
          src={icon}
          alt={""}
          width={18}
          height={18}
          className={`transition-colors ${isActive ? "brightness-110" : "opacity-75"}`}
        />
      );
    } else {
      // It's a Lucide icon component
      const IconComponent = icon;
      return <IconComponent size={18} />;
    }
  };

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit mb-8">
        {TABS.map(({ id, label, icon }) => {
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-zinc-700 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center justify-center w-5 h-5">
                {renderIcon(icon, isActive)}
              </div>
              {label}
            </button>
          );
        })}
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
