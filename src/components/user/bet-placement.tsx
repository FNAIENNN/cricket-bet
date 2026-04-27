"use client";
// src/components/user/bet-placement.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, calculatePotential } from "@/lib/utils";

interface BetPlacementProps {
  match: {
    id: string;
    teamA: string;
    teamB: string;
    tossOdds: number;
  };
  walletBalance: number;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export function BetPlacement({ match, walletBalance }: BetPlacementProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<"teamA" | "teamB" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const potential = selection ? calculatePotential(numAmount, match.tossOdds) : 0;
  const profit = potential - numAmount;
  const canSubmit = selection && numAmount >= 10 && numAmount <= walletBalance && !loading;

  async function handleBet() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/user/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, selection, amount: numAmount }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to place bet");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.refresh();
    }, 1500);
  }

  if (success) {
    return (
      <div className="bg-green-950 border border-green-700 rounded-2xl p-6 text-center glow-green">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-white font-bold text-lg">Bet Placed!</p>
        <p className="text-green-400 text-sm mt-1">
          {formatCurrency(numAmount)} on {selection === "teamA" ? match.teamA : match.teamB}
        </p>
        <p className="text-gray-400 text-sm mt-1">Potential win: {formatCurrency(potential)}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-5">
      <h3 className="font-bold text-white text-lg">Place Toss Bet</h3>

      {/* Selection */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Who wins the toss?</p>
        <div className="grid grid-cols-2 gap-3">
          {(["teamA", "teamB"] as const).map((team) => {
            const name = team === "teamA" ? match.teamA : match.teamB;
            const selected = selection === team;
            return (
              <button
                key={team}
                onClick={() => setSelection(team)}
                className={`p-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                  selected
                    ? "border-brand-500 bg-brand-950 text-white"
                    : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                }`}
              >
                <div className="text-2xl mb-1">🏏</div>
                <div className="truncate">{name}</div>
                <div className="text-xs font-bold text-brand-400 mt-1">{match.tossOdds}x</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Stake Amount</p>
          <p className="text-xs text-gray-500">
            Balance: <span className="text-brand-400 font-semibold">{formatCurrency(walletBalance)}</span>
          </p>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
          <input
            type="number"
            min="10"
            max={walletBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(Math.min(q, walletBalance)))}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg py-1.5 text-gray-400 hover:text-white transition-colors"
            >
              ₹{q >= 1000 ? `${q / 1000}K` : q}
            </button>
          ))}
        </div>
      </div>

      {/* Payout preview */}
      {numAmount > 0 && selection && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Stake</span>
            <span className="text-white font-medium">{formatCurrency(numAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Odds</span>
            <span className="text-white font-medium">{match.tossOdds}x</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
            <span className="text-gray-400">Potential Return</span>
            <span className="text-brand-400 font-bold">{formatCurrency(potential)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Profit</span>
            <span className="text-green-400 font-bold">+{formatCurrency(profit)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {numAmount > walletBalance && numAmount > 0 && (
        <div className="bg-yellow-950 border border-yellow-800 text-yellow-400 text-sm rounded-xl px-4 py-3">
          ⚠️ Insufficient balance.{" "}
          <a href="/wallet" className="underline font-medium">Deposit funds →</a>
        </div>
      )}

      <button
        onClick={handleBet}
        disabled={!canSubmit}
        className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 text-lg transition-colors"
      >
        {loading
          ? "Placing Bet…"
          : !selection
          ? "Select a team first"
          : numAmount < 10
          ? "Enter amount (min ₹10)"
          : `Bet ${formatCurrency(numAmount)}`}
      </button>
    </div>
  );
}
