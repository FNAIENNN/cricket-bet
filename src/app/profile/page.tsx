// src/app/profile/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/user-nav";
import { ProfileActions } from "@/components/user/profile-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      kycStatus: true, isActive: true, isSelfExcluded: true,
      selfExcludeUntil: true, depositLimit: true, createdAt: true,
    },
  });

  if (!user) redirect("/login");

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
        <h1 className="text-xl font-bold text-white">Profile</h1>

        {/* Account info */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-800 flex items-center justify-center text-xl font-bold text-white">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-bold text-white">{user.name}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">KYC Status</p>
              <p className={`text-sm font-semibold mt-0.5 ${
                user.kycStatus === "VERIFIED" ? "text-green-400" :
                user.kycStatus === "REJECTED" ? "text-red-400" : "text-yellow-400"
              }`}>
                {user.kycStatus}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {user.phone && (
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-semibold text-white mt-0.5">{user.phone}</p>
            </div>
          )}
        </div>

        {/* KYC notice */}
        {user.kycStatus !== "VERIFIED" && (
          <div className="bg-yellow-950/50 border border-yellow-800/50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-yellow-400 mb-1">KYC Verification Pending</p>
            <p className="text-xs text-yellow-600">
              Identity verification is required for withdrawals above ₹10,000. KYC submission will be available in the next update.
            </p>
          </div>
        )}

        {/* Self-exclusion status */}
        {user.isSelfExcluded && (
          <div className="bg-red-950/50 border border-red-800/50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-400">🚫 Self-Exclusion Active</p>
            <p className="text-xs text-red-600 mt-1">
              {user.selfExcludeUntil
                ? `You are excluded until ${formatDate(user.selfExcludeUntil)}`
                : "You have permanently self-excluded from betting."}
            </p>
          </div>
        )}

        {/* Responsible gaming actions */}
        <ProfileActions
          userId={user.id}
          isSelfExcluded={user.isSelfExcluded}
          currentDepositLimit={user.depositLimit ?? null}
        />

        {/* Bottom nav */}
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
