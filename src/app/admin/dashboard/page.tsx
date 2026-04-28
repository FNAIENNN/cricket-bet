// src/app/admin/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Trophy, CreditCard, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();
  
  // Safe session check with optional chaining
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch all data in parallel - REMOVED the problematic raw SQL query
  const [
    totalUsers,
    totalBets,
    pendingBets,
    liveMatches,
    upcomingMatches,
    finishedMatches,
    pendingWithdrawals,
    revenue,
    recentBets,
    recentUsers,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.bet.count(),
    prisma.bet.count({ where: { status: "PENDING" } }),
    prisma.match.count({ where: { status: "LIVE" } }),
    prisma.match.count({ where: { status: "UPCOMING" } }),
    prisma.match.count({ where: { status: "FINISHED" } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.bet.aggregate({ 
      _sum: { amount: true, payout: true } 
    }),
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
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const totalStaked = revenue._sum.amount ?? 0;
  const totalPaidOut = revenue._sum.payout ?? 0;
  const grossRevenue = totalStaked - totalPaidOut;

  // Safe way to get user's first name without breaking
  const userFirstName = session.user.name?.split(" ")[0] || session.user.email?.split("@")[0] || "Admin";

  const statCards = [
    { 
      label: "Total Users", 
      value: totalUsers.toLocaleString(), 
      icon: Users, 
      color: "text-blue-400", 
      bg: "bg-blue-500/10",
    },
    { 
      label: "Total Bets", 
      value: totalBets.toLocaleString(), 
      icon: Activity, 
      color: "text-purple-400", 
      bg: "bg-purple-500/10",
    },
    { 
      label: "Live Matches", 
      value: liveMatches, 
      icon: Trophy, 
      color: "text-red-400", 
      bg: "bg-red-500/10",
    },
    { 
      label: "Pending Bets", 
      value: pendingBets.toLocaleString(), 
      icon: Clock, 
      color: "text-yellow-400", 
      bg: "bg-yellow-500/10",
    },
    { 
      label: "Upcoming", 
      value: upcomingMatches, 
      icon: CalendarIcon, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10",
    },
    { 
      label: "Pending Withdrawals", 
      value: pendingWithdrawals, 
      icon: CreditCard, 
      color: pendingWithdrawals > 0 ? "text-orange-400" : "text-gray-400", 
      bg: pendingWithdrawals > 0 ? "bg-orange-500/10" : "bg-gray-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {userFirstName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400">System Operational</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/30 to-gray-900 rounded-2xl p-5 border border-emerald-800/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-400 font-medium">Gross Revenue</p>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{formatCurrency(grossRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">Total staked − Total paid out</p>
        </div>
        
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Total Staked</p>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{formatCurrency(totalStaked)}</p>
          <p className="text-xs text-gray-500 mt-2">All time betting volume</p>
        </div>
        
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Total Paid Out</p>
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(totalPaidOut)}</p>
          <p className="text-xs text-gray-500 mt-2">Winnings paid to users</p>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-3 border border-gray-800/50 transition-all hover:scale-105 duration-200`}>
            <div className="flex items-center justify-between mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions Alert */}
      {pendingWithdrawals > 0 && (
        <div className="bg-yellow-950/30 border-l-4 border-yellow-500 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-500">⚠️ Pending Withdrawals</p>
              <p className="text-xs text-yellow-600/80">There {pendingWithdrawals === 1 ? 'is' : 'are'} {pendingWithdrawals} withdrawal request{pendingWithdrawals > 1 ? 's' : ''} awaiting approval.</p>
            </div>
            <Link href="/admin/payments" className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg text-yellow-500 text-sm font-medium transition-colors">
              Review Now
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/matches/new" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20">
          + Create New Match
        </Link>
        <Link href="/admin/settle" className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200">
          ⚖️ Settle Matches
        </Link>
        {pendingWithdrawals > 0 && (
          <Link href="/admin/payments" className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 text-orange-400 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200">
            💸 Process Payments ({pendingWithdrawals})
          </Link>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Bets
            </h2>
            <Link href="/admin/matches" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {(recentBets as any[]).map((bet) => (
              <div key={bet.id} className="bg-gray-900/50 rounded-xl p-3 border border-gray-800 hover:bg-gray-900 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {bet.user.name ?? bet.user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{bet.match.title}</p>
                    <p className="text-xs text-emerald-400 mt-1">
                      → {bet.selection === "teamA" ? bet.match.teamA : bet.match.teamB}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-sm font-bold text-white">{formatCurrency(bet.amount)}</p>
                    <StatusPill status={bet.status} />
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(bet.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {recentBets.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">No bets placed yet</div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              New Users
            </h2>
            <Link href="/admin/users" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {(recentUsers as any[]).map((user) => (
              <div key={user.id} className="bg-gray-900/50 rounded-xl p-3 border border-gray-800 hover:bg-gray-900 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user.name ?? "Anonymous User"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">No users registered yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Transactions Section */}
      {recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pending Transactions
            </h2>
            <Link href="/admin/payments" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {(recentTransactions as any[]).map((tx) => (
              <div key={tx.id} className="bg-yellow-950/20 rounded-xl p-3 border border-yellow-800/30 hover:bg-yellow-950/30 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{tx.user.name ?? tx.user.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Request
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{formatCurrency(tx.amount)}</p>
                    <Link href={`/admin/payments`} className="text-xs text-emerald-400 hover:text-emerald-300">
                      Review →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for Calendar icon (since it wasn't imported)
function CalendarIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400" },
    WON: { label: "Won ✓", className: "bg-green-500/20 text-green-400" },
    LOST: { label: "Lost", className: "bg-red-500/20 text-red-400" },
    REFUNDED: { label: "Refunded", className: "bg-purple-500/20 text-purple-400" },
  };
  
  const cfg = config[status] || { label: status, className: "bg-gray-700 text-gray-400" };
  
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}