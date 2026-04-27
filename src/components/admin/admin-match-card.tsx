"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

type Match = {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  venue: string | null;
  series: string | null;
  startTime: Date;
  status: string;
  tossWinner: string | null;
  tossOdds: number;
  totalBets: number;
  totalStaked: number;
  teamABets: number;
  teamBBets: number;
};

export function AdminMatchCard({ match }: { match: Match }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function update(data: object) {
    setLoading(JSON.stringify(data));
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else {
      const err = await res.json();
      alert(err.error ?? "Error updating match");
    }
  }

  async function deleteMatch() {
    if (!confirm("Delete this match? This cannot be undone.")) return;
    setLoading("delete");
    const res = await fetch(`/api/admin/matches/${match.id}`, { method: "DELETE" });
    setLoading(null);
    if (res.ok) router.refresh();
    else {
      const err = await res.json();
      alert(err.error ?? "Cannot delete");
    }
  }

  const statusColors: Record<string, string> = {
    UPCOMING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    LIVE: "bg-red-500/20 text-red-400 border-red-500/30",
    TOSS_DONE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    FINISHED: "bg-gray-600/20 text-gray-400 border-gray-600/30",
    CANCELLED: "bg-gray-800 text-gray-500 border-gray-700",
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {match.series && (
              <p className="text-xs text-gray-600 truncate">{match.series}</p>
            )}
            <p className="font-semibold text-white text-sm truncate">{match.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(match.startTime)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[match.status]}`}>
              {match.status === "LIVE" ? "● " : ""}{match.status}
            </span>
            <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>🎯 {match.totalBets} bets</span>
          <span>💰 {formatCurrency(match.totalStaked)}</span>
          <span>A: {match.teamABets} | B: {match.teamBBets}</span>
        </div>
      </div>

      {/* Expanded controls */}
      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Teams */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-center flex-1">
              <p className="font-bold text-white">{match.teamA}</p>
              {match.tossWinner === "teamA" && (
                <p className="text-xs text-brand-400 mt-0.5">✓ Won Toss</p>
              )}
            </div>
            <div className="text-center px-4">
              <p className="text-gray-500 font-bold">VS</p>
              <p className="text-xs text-brand-400">{match.tossOdds}x odds</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold text-white">{match.teamB}</p>
              {match.tossWinner === "teamB" && (
                <p className="text-xs text-brand-400 mt-0.5">✓ Won Toss</p>
              )}
            </div>
          </div>

          {/* Status controls */}
          {match.status === "UPCOMING" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update({ status: "LIVE" })}
                disabled={!!loading}
                className="bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === '{"status":"LIVE"}' ? "…" : "▶ Mark LIVE"}
              </button>
              <button
                onClick={() => update({ status: "CANCELLED" })}
                disabled={!!loading}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel & Refund
              </button>
            </div>
          )}

          {(match.status === "UPCOMING" || match.status === "LIVE") && !match.tossWinner && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Set Toss Winner & Settle All Bets</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Confirm: ${match.teamA} won the toss? This will settle all bets.`)) {
                      update({ tossWinner: "teamA" });
                    }
                  }}
                  disabled={!!loading}
                  className="bg-brand-800 hover:bg-brand-700 text-brand-200 text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  🏏 {match.teamA} won
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Confirm: ${match.teamB} won the toss? This will settle all bets.`)) {
                      update({ tossWinner: "teamB" });
                    }
                  }}
                  disabled={!!loading}
                  className="bg-brand-800 hover:bg-brand-700 text-brand-200 text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  🏏 {match.teamB} won
                </button>
              </div>
            </div>
          )}

          {match.tossWinner && (
            <div className="bg-brand-950 border border-brand-800 rounded-lg p-3 text-sm text-brand-300">
              ✓ Toss settled — {match.tossWinner === "teamA" ? match.teamA : match.teamB} won.
              All bets have been settled.
            </div>
          )}

          {match.status === "TOSS_DONE" && (
            <button
              onClick={() => update({ status: "FINISHED" })}
              disabled={!!loading}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Mark as Finished
            </button>
          )}

          {/* Delete (only upcoming with no bets) */}
          {match.status === "UPCOMING" && match.totalBets === 0 && (
            <button
              onClick={deleteMatch}
              disabled={!!loading}
              className="w-full text-xs text-red-600 hover:text-red-400 py-1 transition-colors disabled:opacity-50"
            >
              Delete match
            </button>
          )}
        </div>
      )}
    </div>
  );
}
