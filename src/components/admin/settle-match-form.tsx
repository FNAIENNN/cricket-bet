"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  bets: any[];
}

export function SettleMatchForm({ match }: { match: Match }) {
  const router = useRouter();
  const [selectedWinner, setSelectedWinner] = useState<"teamA" | "teamB" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSettle = async () => {
    if (!selectedWinner) {
      setError("Select a winner");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/settle-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          winner: selectedWinner,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess(data.message);
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSelectedWinner("teamA")}
          className={`p-2 rounded-lg text-sm font-medium transition-all ${
            selectedWinner === "teamA"
              ? "bg-blue-600 text-white"
              : "bg-[#252530] text-gray-400 hover:bg-[#2a2a30]"
          }`}
        >
          {match.teamA} Wins
        </button>
        <button
          onClick={() => setSelectedWinner("teamB")}
          className={`p-2 rounded-lg text-sm font-medium transition-all ${
            selectedWinner === "teamB"
              ? "bg-blue-600 text-white"
              : "bg-[#252530] text-gray-400 hover:bg-[#2a2a30]"
          }`}
        >
          {match.teamB} Wins
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
          <p className="text-green-400 text-xs">{success}</p>
        </div>
      )}

      <button
        onClick={handleSettle}
        disabled={loading || !selectedWinner}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-all text-sm"
      >
        {loading ? "Processing..." : "Settle Match & Credit Winners"}
      </button>
    </div>
  );
}
