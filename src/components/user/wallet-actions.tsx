"use client";

import { useState, useEffect } from "react";
import { 
  getDepositMessage, 
  getWithdrawalMessage, 
  redirectToTelegram, 
  generateUPIQrCode 
} from "@/lib/telegram";
import { QrCode, Copy, Check, AlertCircle, Clock, Wallet, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

const DEPOSIT_AMOUNTS = [500, 1000, 2000, 5000, 10000];
const WITHDRAWAL_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

export function WalletActions({ balance, onBalanceUpdate }: { balance: number; onBalanceUpdate?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  
  const [withdrawForm, setWithdrawForm] = useState({
    accountNumber: "",
    ifsc: "",
    accountName: "",
    upiId: "",
    confirmAccount: "",
  });

  // Fix Hydration & Fetch Data
  useEffect(() => {
    setMounted(true);
    fetchUserInfo();
    fetchRecentTransactions();

    // Refresh transactions every 30 seconds
    const interval = setInterval(fetchRecentTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUserInfo() {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Profile fetch failed");
      const data = await res.json();
      if (data.user) {
        localStorage.setItem("userName", data.user.name || "User");
        localStorage.setItem("userId", data.user.id);
      }
    } catch (err) {
      console.warn("User info unavailable, using defaults");
    }
  }

  async function fetchRecentTransactions() {
    try {
      const res = await fetch("/api/user/transactions?limit=5");
      if (res.ok) {
        const data = await res.json();
        setRecentTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions");
    }
  }

  async function handleDeposit() {
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt)) return setError("Please enter a valid amount");
    if (amt < 100) return setError("Minimum deposit is ₹100");
    if (amt > 50000) return setError("Maximum deposit is ₹50,000 per transaction");
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit failed");

      setTransactionId(data.transactionId);

      // Show QR if generated
      const qrUrl = generateUPIQrCode(amt, data.transactionId);
      if (qrUrl) {
        setQrCodeUrl(qrUrl);
        setShowQR(true);
      }
      
      const userName = localStorage.getItem("userName") || "User";
      const message = getDepositMessage(amt, data.transactionId, userName);
      
      setSuccess(`Deposit request created! ID: ${data.transactionId.slice(0, 8)}...`);
      
      // Auto-redirect after showing success
      setTimeout(() => redirectToTelegram(message), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt)) return setError("Please enter a valid amount");
    if (amt < 500) return setError("Minimum withdrawal is ₹500");
    if (amt > balance) return setError(`Insufficient balance. Available: ₹${balance.toLocaleString()}`);
    if (amt > 25000) return setError("Maximum withdrawal is ₹25,000 per request");
    if (withdrawForm.accountNumber !== withdrawForm.confirmAccount) return setError("Account numbers do not match");
    if (!withdrawForm.accountNumber || !withdrawForm.ifsc || !withdrawForm.accountName) {
      return setError("Please fill all required bank details");
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: amt, 
          bankDetails: {
            accountName: withdrawForm.accountName,
            accountNumber: withdrawForm.accountNumber,
            ifsc: withdrawForm.ifsc,
            upiId: withdrawForm.upiId,
          }
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");

      const userName = localStorage.getItem("userName") || "User";
      const message = getWithdrawalMessage(amt, data.transactionId, userName, withdrawForm);
      
      setSuccess(`Withdrawal request submitted! ID: ${data.transactionId.slice(0, 8)}...`);
      
      // Reset form
      setAmount("");
      setWithdrawForm({
        accountNumber: "",
        ifsc: "",
        accountName: "",
        upiId: "",
        confirmAccount: "",
      });
      
      // Refresh balance if callback provided
      if (onBalanceUpdate) onBalanceUpdate();
      
      // Auto-redirect after showing success
      setTimeout(() => redirectToTelegram(message), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const copyTransactionId = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check className="w-3 h-3 text-green-400" />;
      case "PENDING":
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case "REJECTED":
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  // Prevent hydration flicker
  if (!mounted) return (
    <div className="space-y-6">
      <div className="animate-pulse bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl h-40" />
      <div className="animate-pulse bg-gray-900/50 rounded-3xl h-96" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-black rounded-3xl p-6 border border-white/10 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-300" />
              <p className="text-brand-200/80 text-xs font-black uppercase tracking-widest">Available Balance</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-400/50" />
          </div>
          <p className="text-5xl font-black text-white tracking-tighter">
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-[10px] text-brand-300/70 font-bold uppercase tracking-tight">Active Wallet</p>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <p className="text-[10px] text-brand-300/50 font-bold uppercase tracking-tight">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        {/* Background Decorative Elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Actions Container */}
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
        {/* Tab Navigation */}
        <div className="flex p-2 bg-black/30 gap-2">
          {(["deposit", "withdraw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { 
                setTab(t); 
                setError(""); 
                setSuccess("");
                setAmount("");
                setShowQR(false);
              }}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 ${
                tab === t 
                  ? "bg-brand-500 text-black shadow-lg scale-[0.98]" 
                  : "text-gray-500 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {t === "deposit" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {t}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Input Section */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center justify-between">
              <span>Enter Amount</span>
              {tab === "withdraw" && balance > 0 && (
                <button 
                  onClick={() => setAmount(Math.min(25000, balance).toString())}
                  className="text-brand-400 hover:text-brand-300 text-[10px] font-bold"
                >
                  Max: ₹{Math.min(25000, balance).toLocaleString()}
                </button>
              )}
            </label>
            
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-500 font-black text-2xl">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border-2 border-gray-800 focus:border-brand-500/50 rounded-2xl pl-12 pr-6 py-4 text-white text-2xl font-black focus:outline-none transition-all placeholder:text-gray-700"
                placeholder="0"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {(tab === "deposit" ? DEPOSIT_AMOUNTS : WITHDRAWAL_AMOUNTS).map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className="px-4 py-2 bg-gray-800/50 hover:bg-brand-500/20 border border-gray-700 hover:border-brand-500/50 rounded-xl text-xs font-bold text-gray-400 hover:text-brand-400 transition-all duration-200"
                >
                  ₹{a >= 1000 ? `${a / 1000}K` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Form - Only show when tab is withdraw */}
          {tab === "withdraw" && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Account Holder Name *"
                  value={withdrawForm.accountName}
                  className="bg-black/30 border border-gray-700 focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="IFSC Code *"
                  value={withdrawForm.ifsc}
                  className="bg-black/30 border border-gray-700 focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600 uppercase"
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, ifsc: e.target.value.toUpperCase() })}
                  maxLength={11}
                />
                <input
                  type="text"
                  placeholder="Account Number *"
                  value={withdrawForm.accountNumber}
                  className="bg-black/30 border border-gray-700 focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Confirm Account Number *"
                  value={withdrawForm.confirmAccount}
                  className="bg-black/30 border border-gray-700 focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, confirmAccount: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="UPI ID (Optional)"
                  value={withdrawForm.upiId}
                  className="md:col-span-2 bg-black/30 border border-gray-700 focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })}
                />
              </div>

              <div className="bg-yellow-950/20 border border-yellow-800/50 rounded-xl p-3">
                <p className="text-xs text-yellow-400 flex items-center gap-2">
                  <span>🏦</span> 
                  Withdrawals processed within 24 hours after admin verification
                </p>
              </div>
            </div>
          )}

          {/* Deposit Info */}
          {tab === "deposit" && (
            <div className="bg-blue-950/20 border border-blue-800/50 rounded-xl p-3">
              <p className="text-xs text-blue-400 flex items-center gap-2">
                <span>📱</span> 
                You'll be redirected to Telegram to complete your deposit
              </p>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="bg-green-950/30 border border-green-800/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
              <p className="text-green-400 text-sm flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {success}
                </span>
                {transactionId && (
                  <button 
                    onClick={copyTransactionId}
                    className="flex items-center gap-1 text-xs hover:text-green-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy ID"}
                  </button>
                )}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={loading}
            className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-brand-400 hover:scale-[0.98] transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-sm shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {tab === "deposit" ? "Continue on Telegram" : "Submit Request"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      {recentTransactions.length > 0 && (
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-800 p-6">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 transition-all hover:bg-white/5 rounded-lg px-2 -mx-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === "DEPOSIT" ? "bg-green-500/20" : "bg-red-500/20"
                  }`}>
                    {tx.type === "DEPOSIT" ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"}`}>
                    {tx.type === "DEPOSIT" ? "+" : "-"} ₹{tx.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {getStatusIcon(tx.status)}
                    <p className={`text-xs ${
                      tx.status === "COMPLETED" ? "text-green-400" : 
                      tx.status === "PENDING" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-200" onClick={() => setShowQR(false)}>
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-black text-white uppercase tracking-widest text-sm">Scan to Pay</h3>
              <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-gray-400">
              Scan with any UPI app (Google Pay, PhonePe, Paytm)
            </p>
            <div className="space-y-2">
              <p className="text-xs text-brand-400 font-mono">
                Amount: ₹{parseFloat(amount).toLocaleString()}
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}