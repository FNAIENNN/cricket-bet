// src/app/wallet/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WalletActions } from "@/components/user/wallet-actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Reuse the same layout as matches — copy layout here
import { UserNav } from "@/components/user/user-nav";

export default async function WalletPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [wallet, transactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const balance = wallet?.balance ?? 0;

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
        {/* Balance card */}
        <div className="bg-gradient-to-br from-brand-900 via-gray-900 to-gray-950 rounded-2xl p-6 border border-brand-800 shadow-2xl shadow-brand-950/20">
          <p className="text-sm text-brand-300 mb-1">Available Balance</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(balance)}</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">Indian Rupees</p>
            <p className="text-xs text-brand-200/80">Last {transactions.length} wallet activities</p>
          </div>
        </div>

        {/* Deposit / Withdraw */}
        <WalletActions balance={balance} />

        <div className="rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900 to-gray-950 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Manual payment support</h2>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                Deposits and withdrawals now move through Telegram so the support desk can verify proofs, confirm payout details, and keep a faster manual audit trail.
              </p>
            </div>
            <div className="rounded-full border border-sky-800 bg-sky-950/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
              Live Desk
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Transaction History
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No transactions yet</div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{txLabel(tx.type)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                    {tx.notes && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate max-w-48">{tx.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isCredit(tx.type) ? "text-brand-400" : "text-red-400"}`}>
                      {isCredit(tx.type) ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className={`text-xs mt-0.5 ${txStatusColor(tx.status)}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

function txLabel(type: string) {
  const map: Record<string, string> = {
    DEPOSIT: "💳 Deposit",
    WITHDRAWAL: "🏦 Withdrawal",
    BET_PLACED: "🎯 Bet Placed",
    BET_WON: "🏆 Bet Won",
    BET_REFUND: "↩️ Bet Refund",
    BONUS: "🎁 Bonus",
  };
  return map[type] ?? type;
}

function isCredit(type: string) {
  return ["DEPOSIT", "BET_WON", "BET_REFUND", "BONUS"].includes(type);
}

function txStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "text-yellow-500",
    COMPLETED: "text-green-500",
    APPROVED: "text-green-500",
    REJECTED: "text-red-500",
  };
  return map[status] ?? "text-gray-500";
}
