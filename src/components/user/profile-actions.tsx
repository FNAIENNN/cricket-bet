"use client";
// src/components/user/profile-actions.tsx
import { useState } from "react";

interface Props {
  userId: string;
  isSelfExcluded: boolean;
  currentDepositLimit: number | null;
}

export function ProfileActions({ userId, isSelfExcluded, currentDepositLimit }: Props) {
  const [depositLimit, setDepositLimit] = useState(String(currentDepositLimit ?? ""));
  const [excludeDays, setExcludeDays] = useState("30");
  const [loading, setLoading] = useState("");
  const [msg, setMsg] = useState("");

  async function saveDepositLimit() {
    setLoading("limit");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositLimit: parseFloat(depositLimit) || null }),
    });
    setLoading("");
    setMsg(res.ok ? "Deposit limit saved!" : "Failed to save");
    setTimeout(() => setMsg(""), 3000);
  }

  async function selfExclude() {
    if (!confirm(`Self-exclude for ${excludeDays} days? You won't be able to place bets during this period.`)) return;
    setLoading("exclude");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selfExcludeDays: parseInt(excludeDays) }),
    });
    setLoading("");
    if (res.ok) window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* Deposit Limit */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <h3 className="font-semibold text-white mb-1">💰 Daily Deposit Limit</h3>
        <p className="text-xs text-gray-500 mb-3">
          Set a daily cap on how much you can deposit. Helps you stay in control.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
            <input
              type="number"
              min="100"
              value={depositLimit}
              onChange={(e) => setDepositLimit(e.target.value)}
              placeholder="No limit"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <button
            onClick={saveDepositLimit}
            disabled={loading === "limit"}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
          >
            {loading === "limit" ? "…" : "Save"}
          </button>
        </div>
        {msg && <p className="text-xs text-brand-400 mt-2">{msg}</p>}
      </div>

      {/* Self-exclusion */}
      {!isSelfExcluded && (
        <div className="bg-gray-900 rounded-2xl border border-red-900/30 p-5">
          <h3 className="font-semibold text-white mb-1">🚫 Self-Exclusion</h3>
          <p className="text-xs text-gray-500 mb-3">
            Temporarily block yourself from placing bets. This cannot be reversed during the exclusion period.
          </p>
          <div className="flex gap-2">
            <select
              value={excludeDays}
              onChange={(e) => setExcludeDays(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
            </select>
            <button
              onClick={selfExclude}
              disabled={loading === "exclude"}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
            >
              {loading === "exclude" ? "…" : "Exclude Me"}
            </button>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-4 text-center">
        <p className="text-xs text-gray-500">
          Problem gambling helpline:{" "}
          <a href="tel:1800-234-1800" className="text-brand-400 font-semibold">1800-234-1800</a>
          {" "}(free, 24/7)
        </p>
      </div>
    </div>
  );
}
