// src/app/matches/layout.tsx  (shared for all user pages)
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/user-nav";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-brand-400">CricketBet</span>
          </div>
          <UserNav />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-40">
        <div className="max-w-lg mx-auto flex">
          <BottomNavLink href="/matches" icon="🏏" label="Matches" />
          <BottomNavLink href="/bets" icon="📋" label="My Bets" />
          <BottomNavLink href="/wallet" icon="💰" label="Wallet" />
          <BottomNavLink href="/profile" icon="👤" label="Profile" />
        </div>
      </nav>
    </div>
  );
}

function BottomNavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-brand-400 transition-colors">
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}
