'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BetPlacementProps {
  match: {
    id: string;
    teamA: string;
    teamB: string;
    tossOdds: number;
  };
  walletBalance: number;
}

export function BetPlacement({ match, walletBalance }: BetPlacementProps) {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<"teamA" | "teamB" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const potentialWin = selectedTeam && amount ? parseFloat(amount) * match.tossOdds : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedTeam) {
      setError("Select a team to bet on");
      return;
    }

    const betAmount = parseFloat(amount);
    if (!betAmount || betAmount < 100) {
      setError("Minimum bet is ₹100");
      return;
    }

    if (betAmount > 50000) {
      setError("Maximum bet is ₹50,000");
      return;
    }

    if (betAmount > walletBalance) {
      setError(`Insufficient balance. Available: ₹${walletBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          selection: selectedTeam,
          amount: betAmount,
          odds: match.tossOdds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place bet");
      }

      setSuccess(`Bet placed on ${selectedTeam === "teamA" ? match.teamA : match.teamB}!`);
      setTimeout(() => {
        router.refresh();
        router.push("/bets");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
      <h3 className="text-lg font-bold text-white">Place Your Bet</h3>

      {/* Team Selection */}
      <div>
        <p className="text-sm text-gray-400 mb-2">Who wins the toss?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedTeam("teamA")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedTeam === "teamA"
                ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                : "bg-gray-800 border-gray-700 text-white hover:border-gray-600"
            }`}
          >
            <p className="font-semibold">{match.teamA}</p>
            <p className="text-xs opacity-75">{match.tossOdds}x</p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTeam("teamB")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedTeam === "teamB"
                ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                : "bg-gray-800 border-gray-700 text-white hover:border-gray-600"
            }`}
          >
            <p className="font-semibold">{match.teamB}</p>
            <p className="text-xs opacity-75">{match.tossOdds}x</p>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Stake Amount</span>
          <span>Balance: ₹{walletBalance.toLocaleString()}</span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {[500, 1000, 2500, 5000].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-gray-400"
            >
              ₹{a >= 1000 ? `${a/1000}k` : a}
            </button>
          ))}
        </div>
      </div>

      {/* Potential Win */}
      {selectedTeam && amount && parseFloat(amount) >= 100 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Potential Win</span>
            <span className="text-yellow-500 font-bold">₹{potentialWin.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
          <p className="text-green-500 text-sm">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !selectedTeam || !amount || parseFloat(amount) < 100}
        className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
      >
        {loading ? "Placing Bet..." : "Place Bet"}
      </button>
    </form>
  );
}
