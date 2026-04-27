"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { useState, useEffect } from "react";

interface Match {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  status: string;
  startTime: Date | string; // Handle both types safely
  tossOdds: number;
  series?: string | null;
  venue?: string | null;
  tossWinner?: string | null;
  _count: { bets: number };
}

export function MatchCard({ match }: { match: Match }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLive = match.status === "LIVE";
  const isTossDone = match.status === "TOSS_DONE";
  const isFinished = ["FINISHED", "CANCELLED"].includes(match.status);
  const canBet = (match.status === "UPCOMING" || match.status === "LIVE") && !match.tossWinner;

  // Helper for team initials
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Link href={`/matches/${match.id}`}>
      <div
        className={`group relative bg-gray-900 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] ${
          isLive
            ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            : isTossDone
            ? "border-yellow-500/30"
            : isFinished
            ? "border-gray-800 grayscale opacity-70"
            : "border-gray-800 hover:border-brand-500/50"
        } p-5`}
      >
        {/* Top Status Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-white bg-red-600 px-2 py-0.5 rounded-md animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                  match.status === "UPCOMING"
                    ? "bg-blue-500/10 text-blue-400"
                    : match.status === "TOSS_DONE"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {!mounted ? "..." : match.status === "UPCOMING"
                  ? formatRelativeTime(new Date(match.startTime))
                  : match.status === "TOSS_DONE"
                  ? "Toss Completed"
                  : match.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 uppercase font-medium">Pool</span>
                <span className="text-xs font-bold text-gray-300">{match._count.bets} Bets</span>
            </div>
          </div>
        </div>

        {/* Versus Teams Section */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Team A */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black mb-2 shadow-inner ${match.tossWinner === 'teamA' ? 'bg-brand-500 text-black ring-4 ring-brand-500/20' : 'bg-gray-800 text-gray-400'}`}>
              {getInitials(match.teamA)}
            </div>
            <p className="text-xs font-bold text-white truncate w-full text-center">
              {match.teamA}
            </p>
            {match.tossWinner === "teamA" && (
              <span className="text-[9px] font-bold text-brand-400 mt-1 uppercase tracking-tighter">Toss Winner</span>
            )}
          </div>

          <div className="flex flex-col items-center">
             <div className="text-gray-700 font-black text-sm italic">VS</div>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black mb-2 shadow-inner ${match.tossWinner === 'teamB' ? 'bg-brand-500 text-black ring-4 ring-brand-500/20' : 'bg-gray-800 text-gray-400'}`}>
              {getInitials(match.teamB)}
            </div>
            <p className="text-xs font-bold text-white truncate w-full text-center">
              {match.teamB}
            </p>
            {match.tossWinner === "teamB" && (
              <span className="text-[9px] font-bold text-brand-400 mt-1 uppercase tracking-tighter">Toss Winner</span>
            )}
          </div>
        </div>

        {/* Details Footer */}
        <div className="mt-4 flex items-center justify-between">
           <span className="text-[10px] text-gray-600 font-medium truncate max-w-[60%]">
             📍 {match.venue || match.series || "International Match"}
           </span>
           {canBet && (
             <div className="bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20">
                <span className="text-[10px] font-black text-brand-400 uppercase">{match.tossOdds}x Multiplier</span>
             </div>
           )}
        </div>

        {/* Betting CTA */}
        {canBet && (
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-center">
            <span className="text-xs font-black text-brand-500 group-hover:text-brand-400 flex items-center gap-1 transition-colors uppercase tracking-widest">
               Predict Toss Winner 
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
               </svg>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}