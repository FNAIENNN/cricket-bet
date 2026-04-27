// src/app/bets/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserNav } from "@/components/user/user-nav";

export const dynamic = "force-dynamic";

export default async function BetsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    include: {
      match: {
        select: { title: true, teamA: true, teamB: true, status: true, tossWinner: true, startTime: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: bets.length,
    won: bets.filter((b) => b.status === "WON").length,
    lost: bets.filter((b) => b.status === "LOST").length,
    pending: bets.filter((b) => b.status === "PENDING").length,
    totalStaked: bets.reduce((s, b) => s + b.amount, 0),
    totalPayout: bets.reduce((s, b) => s + (b.payout ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/matches" className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-brand-400">CricketBet</span>
          </a>
          <UserNav />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
        <h1 className="text-xl font-bold text-white">My Bets</h1>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "Won", value: stats.won, color: "text-brand-400" },
            { label: "Lost", value: stats.lost, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* P&L */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Staked</p>
            <p className="font-bold text-white">{formatCurrency(stats.totalStaked)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Net P&L</p>
            <p className={`font-bold ${stats.totalPayout - stats.totalStaked >= 0 ? "text-brand-400" : "text-red-400"}`}>
              {formatCurrency(stats.totalPayout - stats.totalStaked)}
            </p>
          </div>
        </div>

        {/* Bet list */}
        {bets.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No bets yet</p>
            <a href="/matches" className="text-brand-400 text-sm mt-2 inline-block">Browse Matches →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => {
              const selectionName = bet.selection === "teamA" ? bet.match.teamA : bet.match.teamB;
              return (
                <div
                  key={bet.id}
                  className={`rounded-xl p-4 border ${
                    bet.status === "WON"
                      ? "bg-green-950/50 border-green-800"
                      : bet.status === "LOST"
                      ? "bg-red-950/30 border-red-900"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 truncate">{bet.match.title}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {selectionName} to win toss
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(bet.createdAt)}</p>
                    </div>
                    <StatusPill status={bet.status} />
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-800 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Stake</p>
                      <p className="font-medium text-white">{formatCurrency(bet.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Odds</p>
                      <p className="font-medium text-white">{bet.odds}x</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {bet.status === "WON" ? "Payout" : "Potential"}
                      </p>
                      <p className={`font-bold ${bet.status === "WON" ? "text-brand-400" : "text-gray-300"}`}>
                        {formatCurrency(bet.status === "WON" ? (bet.payout ?? 0) : bet.potential)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-40">
        <div className="max-w-lg mx-auto flex">
          {[
            { href: "/matches", icon: "🏏", label: "Matches" },
            { href: "/bets", icon: "📋", label: "My Bets" },
            { href: "/wallet", icon: "💰", label: "Wallet" },
            { href: "/profile", icon: "👤", label: "Profile" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-brand-400 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-blue-500/20 text-blue-400",
    WON: "bg-green-500/20 text-green-400",
    LOST: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-purple-500/20 text-purple-400",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
