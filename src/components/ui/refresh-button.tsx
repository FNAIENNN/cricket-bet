// src/components/ui/refresh-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <button
      onClick={handleRefresh}
      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors inline-flex items-center gap-2"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Refresh
    </button>
  );
}