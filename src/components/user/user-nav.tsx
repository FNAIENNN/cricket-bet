"use client";
// src/components/user/user-nav.tsx
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export function UserNav() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user/wallet")
      .then((r) => r.json())
      .then((d) => setBalance(d.wallet?.balance ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2 transition-colors"
      >
        {balance !== null && (
          <span className="text-brand-400 font-bold text-sm">{formatCurrency(balance)}</span>
        )}
        <span className="text-gray-300 text-sm font-medium">
          {session?.user?.name?.split(" ")[0] ?? "Account"}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">{session?.user?.email}</p>
            </div>
            <div className="py-1">
              {[
                { href: "/matches", label: "🏏 Matches" },
                { href: "/wallet", label: "💰 Wallet" },
                { href: "/bets", label: "📋 My Bets" },
                { href: "/profile", label: "👤 Profile" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <hr className="border-gray-800 my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
