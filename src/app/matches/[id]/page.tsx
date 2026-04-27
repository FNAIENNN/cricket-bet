// src/app/matches/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { BetPlacement } from "@/components/user/bet-placement";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Trophy, Calendar, MapPin, Users, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  
  const { id } = await params;

  const [match, wallet, existingBet] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: { _count: { select: { bets: true } } },
    }),
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.bet.findFirst({
      where: { matchId: id, userId: session.user.id },
    }),
  ]);

  if (!match) notFound();

  const canBet =
    (match.status === "UPCOMING" || match.status === "LIVE") &&
    !match.tossWinner &&
    !existingBet;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Match Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/30 rounded-2xl border border-emerald-800/30 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          
          <div className="relative p-5 space-y-4">
            {/* Series and Status */}
            <div className="flex items-center justify-between">
              {match.series && (
                <div className="flex items-center gap-1.5 text-amber-500/80">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold tracking-wider">{match.series}</span>
                </div>
              )}
              <StatusBadge status={match.status} />
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between gap-4 py-6">
              {/* Team A */}
              <div className="flex-1 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-2xl shadow-lg border border-amber-500/20">
                  🏏
                </div>
                <p className="font-bold text-white text-sm">{match.teamA}</p>
                {match.tossWinner === "teamA" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Trophy className="w-2.5 h-2.5" />
                    Won Toss
                  </span>
                )}
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-xs font-black text-emerald-400">VS</span>
                </div>
                <p className="text-[10px] text-emerald-400/60 mt-2 font-mono">{match.tossOdds}x</p>
              </div>

              {/* Team B */}
              <div className="flex-1 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-2xl shadow-lg border border-amber-500/20">
                  🏏
                </div>
                <p className="font-bold text-white text-sm">{match.teamB}</p>
                {match.tossWinner === "teamB" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Trophy className="w-2.5 h-2.5" />
                    Won Toss
                  </span>
                )}
              </div>
            </div>

            {/* Match Details */}
            <div className="pt-3 border-t border-gray-800/50 space-y-1.5">
              {match.venue && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{match.venue}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(match.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Users className="w-3 h-3" />
                <span>{match._count?.bets || 0} participants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Bet Display */}
        {existingBet && (
          <div className={`relative overflow-hidden rounded-2xl border-2 p-5 ${
            existingBet.status === "WON" 
              ? "bg-gradient-to-br from-green-950/40 to-emerald-950/30 border-green-500/50"
              : existingBet.status === "LOST"
              ? "bg-gradient-to-br from-red-950/30 to-red-900/20 border-red-500/30"
              : "bg-gradient-to-br from-gray-900 to-gray-900/50 border-amber-500/30"
          }`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-xl" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Your Bet Slip</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Selection</span>
                  <span className="text-white font-semibold">
                    {existingBet.selection === "teamA" ? match.teamA : match.teamB}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Stake</span>
                  <span className="text-white">{formatCurrency(existingBet.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Odds</span>
                  <span className="text-amber-400 font-mono">{existingBet.odds}x</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-800/50">
                  <span className="text-gray-400">Potential Win</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(existingBet.potential)}</span>
                </div>
                {existingBet.payout != null && existingBet.payout > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Payout Received</span>
                    <span className="text-green-400 font-bold">{formatCurrency(existingBet.payout)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-400">Status</span>
                  <StatusBadge status={existingBet.status} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bet Placement */}
        {canBet && (
          <BetPlacement
            match={{
              id: match.id,
              teamA: match.teamA,
              teamB: match.teamB,
              tossOdds: match.tossOdds,
            }}
            walletBalance={wallet?.balance ?? 0}
          />
        )}

        {/* Closed Message */}
        {!canBet && !existingBet && match.status !== "CANCELLED" && (
          <div className="bg-gray-900/50 rounded-2xl p-8 text-center border border-gray-800">
            <div className="text-5xl mb-3">🔒</div>
            <p className="text-gray-400 text-sm">
              {match.tossWinner 
                ? "Toss betting is closed. Winner has been declared." 
                : "Betting is not available for this match right now."}
            </p>
            <a href="/matches" className="inline-block mt-4 text-amber-400 text-sm hover:text-amber-300 transition-colors">
              Browse Other Matches →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: string; class: string }> = {
    UPCOMING: { label: "UPCOMING", icon: "⏳", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    LIVE: { label: "LIVE", icon: "●", class: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" },
    TOSS_DONE: { label: "TOSS DONE", icon: "🎲", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    FINISHED: { label: "FINISHED", icon: "🏁", class: "bg-gray-700/30 text-gray-400 border-gray-700" },
    CANCELLED: { label: "CANCELLED", icon: "❌", class: "bg-red-950/30 text-red-400 border-red-800/30" },
    WON: { label: "WON", icon: "🎉", class: "bg-green-500/10 text-green-400 border-green-500/20" },
    LOST: { label: "LOST", icon: "💔", class: "bg-red-500/10 text-red-400 border-red-500/20" },
    REFUNDED: { label: "REFUNDED", icon: "↩️", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    PENDING: { label: "PENDING", icon: "⏰", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  };
  
  const cfg = config[status] ?? { label: status, icon: "📌", class: "bg-gray-700/30 text-gray-400 border-gray-700" };
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.class}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}