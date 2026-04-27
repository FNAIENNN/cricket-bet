// src/app/admin/matches/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { AdminMatchCard } from "@/components/admin/admin-match-card";
import { CreateMatchForm } from "@/components/admin/create-match-form";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const matches = await prisma.match.findMany({
    orderBy: [{ status: "asc" }, { startTime: "asc" }],
    include: {
      _count: { select: { bets: true } },
      bets: { select: { amount: true, status: true, selection: true } },
    },
  });

  const enriched = matches.map((m) => ({
    ...m,
    totalBets: m.bets.length,
    totalStaked: m.bets.reduce((s, b) => s + b.amount, 0),
    teamABets: m.bets.filter((b) => b.selection === "teamA").length,
    teamBBets: m.bets.filter((b) => b.selection === "teamB").length,
    bets: undefined,
  }));

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-gray-500 text-sm mt-1">{matches.length} total matches</p>
        </div>
      </div>

      {/* Create match form */}
      <CreateMatchForm />

      {/* Match list */}
      <div className="space-y-3">
        {enriched.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No matches yet. Create one above.</div>
        ) : (
          enriched.map((match) => <AdminMatchCard key={match.id} match={match as any} />)
        )}
      </div>
    </div>
  );
}
