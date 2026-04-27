// src/app/admin/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bet, User, Match } from "@prisma/client";

export const dynamic = "force-dynamic";

type RecentBet = Bet & {
  user: { name: string | null; email: string };
  match: { title: string; teamA: string; teamB: string };
};

type RecentUser = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [
    totalUsers,
    totalBets,
    pendingBets,
    liveMatches,
    upcomingMatches,
    pendingWithdrawals,
    revenue,
    recentBets,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.bet.count(),
    prisma.bet.count({ where: { status: "PENDING" } }),
    prisma.match.count({ where: { status: "LIVE" } }),
    prisma.match.count({ where: { status: "UPCOMING" } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.bet.aggregate({ _sum: { amount: true, payout: true } }),
    prisma.bet.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        match: { select: { title: true, teamA: true, teamB: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  const totalStaked = revenue._sum.amount ?? 0;
  const totalPaidOut = revenue._sum.payout ?? 0;
  const grossRevenue = totalStaked - totalPaidOut;

  const statCards = [
    { label: "Total Users", value: totalUsers, icon: "👥", color: "text-blue-400" },
    { label: "Total Bets", value: totalBets, icon: "🎯", color: "text-purple-400" },
    { label: "Live Matches", value: liveMatches, icon: "🔴", color: "text-red-400" },
    { label: "Upcoming", value: upcomingMatches, icon: "📅", color: "text-yellow-400" },
    { label: "Pending Bets", value: pendingBets, icon: "⏳", color: "text-orange-400" },
    { label: "Pending Withdrawals", value: pendingWithdrawals, icon: "💸", color: "text-pink-400",
      alert: pendingWithdrawals > 0 },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      {/* Revenue highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-brand-900 to-gray-900 rounded-2xl p-5 border border-brand-800 md:col-span-1">
          <p className="text-sm text-brand-300">Gross Revenue</p>
          <p className="text-3xl font-bold text-white mt-1">{formatCurrency(grossRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">Total staked − Total paid out</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-sm text-gray-400">Total Staked</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalStaked)}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-sm text-gray-400">Total Paid Out</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(totalPaidOut)}</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gray-900 rounded-xl p-4 border ${card.alert ? "border-orange-600" : "border-gray-800"}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{card.label}</p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/matches" className="bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          + New Match
        </Link>
        {pendingWithdrawals > 0 && (
          <Link href="/admin/payments" className="bg-orange-900 hover:bg-orange-800 text-orange-200 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-orange-700">
            ⚠️ {pendingWithdrawals} Withdrawal{pendingWithdrawals > 1 ? "s" : ""} Pending
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Bets</h2>
            <Link href="/admin/matches" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-2">
            {(recentBets as RecentBet[]).map((bet: RecentBet) => (
              <div key={bet.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {bet.user.name ?? bet.user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{bet.match.title}</p>
                  <p className="text-xs text-gray-600">
                    → {bet.selection === "teamA" ? bet.match.teamA : bet.match.teamB}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-sm font-bold text-white">{formatCurrency(bet.amount)}</p>
                  <StatusPill status={bet.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">New Users</h2>
            <Link href="/admin/users" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-2">
            {(recentUsers as RecentUser[]).map((user: RecentUser) => (
              <div key={user.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-800 flex items-center justify-center text-sm font-bold text-brand-300 shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <p className="text-xs text-gray-600 ml-auto shrink-0">
                  {new Date(user.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
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
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${map[status] ?? "bg-gray-700 text-gray-400"}`}>
      {status}
    </span>
  );
}