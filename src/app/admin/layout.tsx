// src/app/admin/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { Shield, LayoutDashboard, Trophy, Users, CreditCard, Settings, LogOut, Menu, X } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  // Enhanced session check with better error handling
  if (!session || !session.user) {
    console.log("Admin layout: No session found");
    redirect("/login?callbackUrl=/admin");
  }
  
  if (session.user.role !== Role.ADMIN) {
    console.log(`Admin layout: User ${session.user.email} attempted admin access with role ${session.user.role}`);
    redirect("/");
  }

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", description: "Overview & stats" },
    { href: "/admin/matches", icon: Trophy, label: "Matches", description: "Manage matches" },
    { href: "/admin/users", icon: Users, label: "Users", description: "User management" },
    { href: "/admin/payments", icon: CreditCard, label: "Payments", description: "Transactions" },
    { href: "/admin/settle", icon: Shield, label: "Settle", description: "Settle matches" },
    { href: "/admin/settings", icon: Settings, label: "Settings", description: "Platform settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 fixed h-full z-30">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
                <span className="text-xl">🏏</span>
              </div>
              <div>
                <p className="font-bold text-white text-lg">CricketBet</p>
                <p className="text-xs text-emerald-400 font-mono">Admin Console</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 group"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-gray-500">{item.description}</p>
                </div>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-800 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                {session.user.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{session.user.name || "Admin User"}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
            </div>
            <Link
              href="/api/auth/signout"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          {/* Mobile Header */}
          <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 lg:hidden">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <span className="text-sm">🏏</span>
                </div>
                <span className="font-bold text-white text-sm">Admin Panel</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </header>

          {/* Top Bar - Desktop */}
          <header className="hidden lg:flex sticky top-0 z-20 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 px-6 h-16 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">Welcome back, {session.user.name?.split(" ")[0] || "Admin"}</h1>
              <p className="text-xs text-gray-500">Manage your cricket betting platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/30">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400">System Online</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}