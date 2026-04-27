// src/app/admin/payments/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentActions } from "@/components/admin/payment-actions";
import { parseTransactionNotes, extractBankDetails, extractUpiId } from "@/lib/transaction-utils";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Fetch transactions with more details
  const transactions = await prisma.transaction.findMany({
    where: { 
      type: { in: ["DEPOSIT", "WITHDRAWAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { 
      user: { 
        select: { 
          name: true, 
          email: true,
          phone: true,
          wallet: {
            select: { balance: true }
          }
        } 
      } 
    },
  });

  // Calculate comprehensive statistics
  const stats = {
    totalDeposits: transactions
      .filter(t => t.type === "DEPOSIT" && t.status === "COMPLETED")
      .reduce((s, t) => s + t.amount, 0),
    totalWithdrawals: transactions
      .filter(t => t.type === "WITHDRAWAL" && t.status === "COMPLETED")
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    pendingWithdrawals: transactions.filter(t => t.type === "WITHDRAWAL" && t.status === "PENDING"),
    pendingDeposits: transactions.filter(t => t.type === "DEPOSIT" && t.status === "PENDING"),
    rejectedWithdrawals: transactions.filter(t => t.type === "WITHDRAWAL" && t.status === "REJECTED").length,
    approvedToday: transactions.filter(t => {
      const today = new Date();
      const txDate = new Date(t.createdAt);
      return txDate.toDateString() === today.toDateString() && t.status === "COMPLETED";
    }).length,
  };

  const totalPendingAmount = [...stats.pendingWithdrawals, ...stats.pendingDeposits]
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage deposits, withdrawals, and payment approvals</p>
        </div>
        <form action="/api/admin/transactions/refresh" method="POST">
          <button 
            type="submit"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </form>
      </div>

      {/* Critical Alerts */}
      {stats.pendingWithdrawals.length > 0 && (
        <div className="bg-orange-950 border-l-4 border-orange-500 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-300 font-semibold">
                ⚠️ {stats.pendingWithdrawals.length} withdrawal request{stats.pendingWithdrawals.length > 1 ? "s" : ""} pending approval
              </p>
              <p className="text-orange-400/70 text-sm mt-1">
                Total pending amount: {formatCurrency(stats.pendingWithdrawals.reduce((s, t) => s + Math.abs(t.amount), 0))}
              </p>
              <p className="text-orange-400/50 text-xs mt-2">
                Please review and process these requests as soon as possible to maintain user satisfaction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Deposits"
          value={formatCurrency(stats.totalDeposits)}
          subtext="All time completed"
          color="green"
          icon="deposit"
        />
        <StatCard
          label="Total Withdrawals"
          value={formatCurrency(stats.totalWithdrawals)}
          subtext="All time completed"
          color="red"
          icon="withdrawal"
        />
        <StatCard
          label="Pending Amount"
          value={formatCurrency(totalPendingAmount)}
          subtext={`${stats.pendingWithdrawals.length} withdrawals, ${stats.pendingDeposits.length} deposits`}
          color="yellow"
          icon="pending"
        />
        <StatCard
          label="Today's Approvals"
          value={stats.approvedToday.toString()}
          subtext="Transactions completed today"
          color="blue"
          icon="approved"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <div className="text-xs text-gray-500">
            Showing last {transactions.length} transactions
          </div>
        </div>

        {transactions.map((tx) => {
          const isWithdrawal = tx.type === "WITHDRAWAL";
          const isPending = tx.status === "PENDING";
          const noteData = parseTransactionNotes(tx.notes);
          
          // Extract payment details from notes if available
          let paymentDetails = noteData?.payoutDetails;
          if (!paymentDetails && tx.notes && !noteData?.userMessage) {
            // Try to extract from plain text
            // FIX 1: Guard against extractBankDetails returning undefined/null
            const extractedDetails = extractBankDetails(tx.notes);
            if (extractedDetails && Object.keys(extractedDetails).length > 0) {
              paymentDetails = extractedDetails as {
                payoutMethod: string;
                accountName: string;
                accountNumber?: string;
                ifsc?: string;
                upiId?: string;
                bankName?: string;
              };
            }
          }

          return (
            <div
              key={tx.id}
              className={`bg-gray-900 rounded-xl p-4 border transition-all hover:border-gray-700 ${
                isPending && isWithdrawal 
                  ? "border-orange-700 shadow-lg shadow-orange-900/20" 
                  : isPending 
                  ? "border-yellow-700" 
                  : "border-gray-800"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left side - User info and details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-white">
                      {tx.user.name ?? tx.user.email}
                    </span>
                    <TxTypeBadge type={tx.type} />
                    <StatusBadge status={tx.status} />
                    {tx.user.wallet && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                        Wallet: {formatCurrency(tx.user.wallet.balance)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {formatDate(tx.createdAt)} • Transaction ID: {tx.id.slice(0, 8)}...
                  </p>
                  
                  {tx.user.phone && (
                    <p className="text-xs text-gray-600 mt-1">📞 {tx.user.phone}</p>
                  )}
                  
                  {/* User message */}
                  {noteData?.userMessage && (
                    <div className="mt-3 bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                      <p className="text-xs font-medium text-gray-400 mb-1">User Message:</p>
                      <p className="text-xs text-gray-300">{noteData.userMessage}</p>
                    </div>
                  )}
                  
                  {/* Payment details */}
                  {paymentDetails && (
                    <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <p className="text-xs font-medium text-gray-400 mb-2">Payment Details:</p>
                      <div className="space-y-1 text-xs">
                        {paymentDetails.payoutMethod && (
                          <p><span className="text-gray-500">Method:</span> {paymentDetails.payoutMethod}</p>
                        )}
                        {paymentDetails.accountName && (
                          <p><span className="text-gray-500">Account Name:</span> {paymentDetails.accountName}</p>
                        )}
                        {paymentDetails.accountNumber && (
                          <p><span className="text-gray-500">Account Number:</span> {paymentDetails.accountNumber}</p>
                        )}
                        {paymentDetails.ifsc && (
                          <p><span className="text-gray-500">IFSC:</span> {paymentDetails.ifsc}</p>
                        )}
                        {paymentDetails.bankName && (
                          <p><span className="text-gray-500">Bank:</span> {paymentDetails.bankName}</p>
                        )}
                        {paymentDetails.upiId && (
                          <p><span className="text-gray-500">UPI ID:</span> {paymentDetails.upiId}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Admin decision note */}
                  {noteData?.adminDecision && (
                    <div className="mt-3 bg-gray-800/30 rounded-lg p-2 border border-gray-700/50">
                      <p className="text-xs text-gray-500">
                        Admin: {noteData.adminDecision.action} • {noteData.adminDecision.processedAt && formatDate(noteData.adminDecision.processedAt)}
                      </p>
                      {noteData.adminDecision.notes && (
                        <p className="text-xs text-gray-400 mt-1">{noteData.adminDecision.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side - Amount and actions */}
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${isWithdrawal ? "text-red-400" : "text-green-400"}`}>
                    {isWithdrawal ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  {isPending && (tx.type === "WITHDRAWAL" || tx.type === "DEPOSIT") && (
                    <div className="mt-3">
                      {/* FIX 2: Removed amount and userId props not accepted by PaymentActions */}
                      <PaymentActions 
                        transactionId={tx.id} 
                        type={tx.type} 
                      />
                    </div>
                  )}
                  {!isPending && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">
                        {tx.status === "COMPLETED" ? "✓ Processed" : "✗ Rejected"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {transactions.length === 0 && (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <p className="text-gray-500">No transactions found</p>
            <p className="text-gray-600 text-sm mt-2">When users make deposits or withdrawals, they will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  subtext, 
  color,
  icon 
}: { 
  label: string; 
  value: string; 
  subtext: string; 
  color: 'green' | 'red' | 'yellow' | 'blue';
  icon: string;
}) {
  const colorMap = {
    green: 'from-green-600/20 to-green-900/20 border-green-700',
    red: 'from-red-600/20 to-red-900/20 border-red-700',
    yellow: 'from-yellow-600/20 to-yellow-900/20 border-yellow-700',
    blue: 'from-blue-600/20 to-blue-900/20 border-blue-700',
  };
  
  const iconMap = {
    deposit: <CheckCircle className="w-4 h-4 text-green-400" />,
    withdrawal: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <Clock className="w-4 h-4 text-yellow-400" />,
    approved: <CheckCircle className="w-4 h-4 text-blue-400" />,
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">{label}</p>
        {iconMap[icon as keyof typeof iconMap]}
      </div>
      <p className={`text-xl font-bold`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  );
}

function TxTypeBadge({ type }: { type: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
      {type === "DEPOSIT" ? "💳 Deposit" : "🏦 Withdrawal"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: JSX.Element; text: string }> = {
    PENDING: { 
      color: "bg-yellow-500/20 text-yellow-400", 
      icon: <Clock className="w-3 h-3 mr-1" />,
      text: "Pending"
    },
    APPROVED: { 
      color: "bg-blue-500/20 text-blue-400", 
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      text: "Approved"
    },
    COMPLETED: { 
      color: "bg-green-500/20 text-green-400", 
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      text: "Completed"
    },
    REJECTED: { 
      color: "bg-red-500/20 text-red-400", 
      icon: <XCircle className="w-3 h-3 mr-1" />,
      text: "Rejected"
    },
  };

  const badge = config[status] || { 
    color: "bg-gray-700 text-gray-400", 
    icon: <></>, 
    text: status 
  };

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
      {badge.icon}
      {badge.text}
    </span>
  );
}