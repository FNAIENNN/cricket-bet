// src/app/matches/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MatchCard } from "@/components/user/match-card";
import { MatchFilters } from "@/components/user/match-filters";
import { Suspense } from "react";
import { Flame, Calendar, AlertCircle, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds instead of 0

// Loading skeleton component
function MatchesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-32 bg-gray-800 rounded-lg" />
        <div className="h-4 w-24 bg-gray-800 rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-gray-800 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-4 h-32" />
        ))}
      </div>
    </div>
  );
}

// Error component
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Matches</h3>
      <p className="text-sm text-gray-400 max-w-sm">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

// Main content component
async function MatchesContent({ status }: { status?: string }) {
  try {
    const matches = await prisma.match.findMany({
      where: status && status !== "ALL" ? { status: status as any } : {
        status: { in: ["UPCOMING", "LIVE"] },
      },
      orderBy: [
        { status: "asc" },
        { startTime: "asc" }
      ],
      include: { 
        _count: { select: { bets: true } }
      },
    });

    const liveMatches = matches.filter((m) => m.status === "LIVE");
    const upcomingMatches = matches.filter((m) => m.status !== "LIVE");

    if (matches.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏏</div>
          <p className="text-gray-400 font-medium">No matches found</p>
          <p className="text-xs text-gray-500 mt-1">Check back later for upcoming matches</p>
        </div>
      );
    }

    return (
      <>
        {/* Live Matches Section */}
        {liveMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-red-400">LIVE NOW</h2>
              <span className="text-xs text-gray-500">({liveMatches.length})</span>
              <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
            </div>
            <div className="space-y-3">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Matches Section */}
        {upcomingMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-gray-400">UPCOMING</h2>
              <span className="text-xs text-gray-500">({upcomingMatches.length})</span>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent" />
            </div>
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return <ErrorState message="Failed to load matches. Please check your database connection." />;
  }
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }> | { status?: string };
}) {
  const session = await auth();
  // Await searchParams if it's a Promise (Next.js 15+)
  const params = await searchParams;
  const status = params?.status;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Matches</h1>
          <p className="text-sm text-gray-400">
            Browse and bet on live cricket matches
          </p>
        </div>

        {/* Filters */}
        <MatchFilters currentStatus={status} />

        {/* Content with Suspense for loading state */}
        <Suspense fallback={<MatchesSkeleton />}>
          <MatchesContent status={status} />
        </Suspense>
      </div>
    </div>
  );
}