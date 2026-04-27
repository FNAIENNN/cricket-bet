"use client";
// src/components/user/match-filters.tsx
import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { label: "Active", value: "" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Live", value: "LIVE" },
  { label: "Finished", value: "FINISHED" },
  { label: "All", value: "ALL" },
];

export function MatchFilters({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((f) => {
        const active = (currentStatus ?? "") === f.value;
        return (
          <button
            key={f.value}
            onClick={() => router.push(f.value ? `/matches?status=${f.value}` : "/matches")}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
