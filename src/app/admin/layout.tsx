// src/app/admin/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) redirect("/login");

  const navItems = [
    { href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/admin/matches", icon: "🏏", label: "Matches" },
    { href: "/admin/users", icon: "👥", label: "Users" },
    { href: "/admin/payments", icon: "💳", label: "Payments" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 fixed h-full z-30">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <div>
              <p className="font-bold text-white text-sm">CricketBet</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/api/auth/signout" className="text-xs text-gray-500 hover:text-gray-300">
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 md:px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-white text-sm md:text-base">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden md:block">{session.user.email}</span>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold text-white">
              {session.user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-brand-400 transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
