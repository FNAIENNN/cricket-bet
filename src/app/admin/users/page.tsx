// src/app/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { AdminUserActions } from "@/components/admin/admin-user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    include: {
      wallet: true,
      _count: { select: { bets: true } },
    },
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-brand-400">{users.filter((u) => u.isActive).length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-red-400">{users.filter((u) => !u.isActive).length}</p>
          <p className="text-xs text-gray-500">Suspended</p>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center text-lg font-bold text-brand-300 shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  {user.phone && <p className="text-xs text-gray-600">{user.phone}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white">{formatCurrency(user.wallet?.balance ?? 0)}</p>
                <p className="text-xs text-gray-500">{user._count.bets} bets</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
              <div className="flex gap-2 flex-wrap">
                <StatusBadge
                  label={user.isActive ? "Active" : "Suspended"}
                  color={user.isActive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}
                />
                <StatusBadge
                  label={`KYC: ${user.kycStatus}`}
                  color={
                    user.kycStatus === "VERIFIED"
                      ? "text-green-400 bg-green-500/10"
                      : user.kycStatus === "REJECTED"
                      ? "text-red-400 bg-red-500/10"
                      : "text-yellow-400 bg-yellow-500/10"
                  }
                />
                {user.isSelfExcluded && (
                  <StatusBadge label="Self-excluded" color="text-purple-400 bg-purple-500/10" />
                )}
              </div>
              <AdminUserActions userId={user.id} isActive={user.isActive} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  );
}
