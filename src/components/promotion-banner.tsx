// src/components/promotion-banner.tsx
"use client";

import { useState } from "react";
import { X, Gift } from "lucide-react";

export function PromotionBanner() {
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed) return null;

  return (
    <div className="relative mb-6 overflow-hidden bg-gradient-to-r from-emerald-900/30 via-emerald-800/20 to-emerald-900/30 rounded-xl border border-emerald-700/30 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-transparent" />
      <div className="relative p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Gift className="w-4 h-4 text-emerald-400" />
          <p className="text-xs text-emerald-300 font-medium">
            🎉 Welcome Bonus
          </p>
        </div>
        <button
          onClick={() => setIsClosed(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Close promotion"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}