import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettleMatchForm } from "@/components/admin/settle-match-form";

export const dynamic = "force-dynamic";

export default async function AdminSettlePage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["FINISHED", "TOSS_DONE", "LIVE"] },
      settledAt: null,  // Changed from settledAt to settledAt
    },
    include: {
      bets: {
        where: { status: "PENDING" },
      },
      _count: { select: { bets: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#0f0f12]">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Settle Matches</h1>
          <p className="text-xs text-gray-500 mt-1">Select winner to credit wallets</p>
        </div>

        {matches.length === 0 ? (
          <div className="bg-[#1a1a1f] rounded-xl border border-[#2a2a30] p-8 text-center">
            <p className="text-gray-500 text-sm">No matches pending settlement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-[#1a1a1f] rounded-xl border border-[#2a2a30] p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-white">
                    {match.teamA} vs {match.teamB}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {match.series} • {match.bets.length} pending bets
                  </p>
                </div>
                <SettleMatchForm match={match} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
