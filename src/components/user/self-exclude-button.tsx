"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isSelfExcluded: boolean;
  selfExcludeUntil: string | null;
}

export function SelfExcludeButton({ isSelfExcluded, selfExcludeUntil }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isCurrentlyExcluded =
    isSelfExcluded &&
    (!selfExcludeUntil || new Date(selfExcludeUntil) > new Date());

  async function exclude(days: number | null) {
    if (
      !confirm(
        days === null
          ? "Permanently self-exclude? Contact support to lift this."
          : `Self-exclude for ${days} days? You will not be able to bet during this period.`
      )
    )
      return;

    setLoading(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isSelfExcluded: true,
        selfExcludeUntil: days
          ? new Date(Date.now() + days * 86400000).toISOString()
          : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setShowOptions(false);
      router.refresh();
    } else {
      alert("Failed to update. Please try again.");
    }
  }

  async function reactivate() {
    if (!selfExcludeUntil) {
      alert("Permanent self-exclusion can only be lifted by contacting support.");
      return;
    }
    if (!confirm("Reactivate your account for betting?")) return;
    setLoading(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSelfExcluded: false, selfExcludeUntil: null }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Failed to update.");
  }

  if (isCurrentlyExcluded) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-purple-400 bg-purple-950/50 border border-purple-800 rounded-lg px-3 py-2">
          🚫 Self-excluded
          {selfExcludeUntil
            ? ` until ${new Date(selfExcludeUntil).toLocaleDateString("en-IN")}`
            : " (permanent)"}
        </div>
        {selfExcludeUntil && (
          <button
            onClick={reactivate}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-white underline disabled:opacity-50 transition-colors"
          >
            {loading ? "Updating…" : "Reactivate account"}
          </button>
        )}
      </div>
    );
  }

  if (showOptions) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400 mb-2">Choose exclusion period:</p>
        {[
          { label: "24 hours", days: 1 },
          { label: "1 week", days: 7 },
          { label: "1 month", days: 30 },
          { label: "6 months", days: 180 },
          { label: "Permanent", days: null },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => exclude(opt.days)}
            disabled={loading}
            className={`w-full text-sm text-left px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
              opt.days === null
                ? "border-red-800 text-red-400 hover:bg-red-950"
                : "border-gray-700 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {loading ? "…" : opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowOptions(false)}
          className="text-xs text-gray-600 hover:text-gray-400 mt-1"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowOptions(true)}
      className="text-sm text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-700 px-4 py-2 rounded-lg transition-colors"
    >
      Self-Exclude
    </button>
  );
}
