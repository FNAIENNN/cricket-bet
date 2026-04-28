
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MatchCard } from "@/components/user/match-card";
import { MatchFilters } from "@/components/user/match-filters";
import { Metadata } from "next";
import { AlertCircle, RefreshCw, Flame, Calendar, Database, Server } from "lucide-react";
import { Match } from "@prisma/client";

type MatchWithCount = Match & {
  _count: { bets: number };
};

export const metadata: Metadata = {
  title: "Matches | Cricket-Bet",
};

export const dynamic = "force-dynamic";
export const revalidate = 30;

// More detailed error types
type ErrorType = 'DATABASE_CONNECTION' | 'DATABASE_CONFIG' | 'SUPABASE_PAUSED' | 'UNKNOWN';

function getErrorMessage(errorType: ErrorType): { title: string; message: string; action: string } {
  switch (errorType) {
    case 'DATABASE_CONNECTION':
      return {
        title: "Database Connection Failed",
        message: "Cannot reach the database server. This might be a temporary network issue.",
        action: "Try Again"
      };
    case 'DATABASE_CONFIG':
      return {
        title: "Database Configuration Error",
        message: "The database connection string is incorrect or missing. Please check your environment variables.",
        action: "Check Configuration"
      };
    case 'SUPABASE_PAUSED':
      return {
        title: "Supabase Project Paused",
        message: "Your Supabase project is currently paused. Please restore it from the Supabase dashboard.",
        action: "Restore Project"
      };
    default:
      return {
        title: "Unable to Load Matches",
        message: "Something went wrong. Please try again later.",
        action: "Retry"
      };
  }
}

export default async function MatchesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string }> 
}) {
  await auth(); // Just to ensure session is loaded
  const { status } = await searchParams;

  let matches: MatchWithCount[] = [];
  let hasError = false;
  let errorType: ErrorType = 'UNKNOWN';

  try {
    // Test database connection with a simple query first
    await prisma.$queryRaw`SELECT 1`;
    
    matches = await prisma.match.findMany({
      where: status && status !== "ALL" 
        ? { status: status as any } 
        : { status: { in: ["UPCOMING", "LIVE", "TOSS_DONE"] } },
      orderBy: [{ status: "asc" }, { startTime: "asc" }],
      include: { _count: { select: { bets: true } } },
    }) as MatchWithCount[];
  } catch (e: any) {
    console.error("Database error:", e.message);
    hasError = true;
    
    // Determine error type
    if (e.message?.includes("Tenant not found") || e.message?.includes("does not exist")) {
      errorType = 'DATABASE_CONFIG';
    } else if (e.message?.includes("paused") || e.message?.includes("not accepting connections")) {
      errorType = 'SUPABASE_PAUSED';
    } else if (e.message?.includes("timeout") || e.message?.includes("reach")) {
      errorType = 'DATABASE_CONNECTION';
    } else {
      errorType = 'UNKNOWN';
    }
  }

  // Error state with detailed message
  if (hasError) {
    const error = getErrorMessage(errorType);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              {errorType === 'DATABASE_CONFIG' ? (
                <Database className="w-10 h-10 text-red-500" />
              ) : errorType === 'SUPABASE_PAUSED' ? (
                <Server className="w-10 h-10 text-yellow-500" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-500" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">{error.title}</h2>
            <p className="text-gray-400 text-sm mb-6">{error.message}</p>
            
            {errorType === 'SUPABASE_PAUSED' && (
              <a 
                href="https://supabase.com/dashboard/project/nezxvthhozfuitpqocwa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-xl transition-all mb-3"
              >
                Go to Supabase Dashboard
              </a>
            )}
            
            {errorType === 'DATABASE_CONFIG' && (
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4 text-left">
                <p className="text-xs font-mono text-gray-500 mb-2">Troubleshooting steps:</p>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Check DATABASE_URL in Vercel environment variables</li>
                  <li>Verify Supabase project is active</li>
                  <li>Ensure password has no special characters</li>
                  <li>Try resetting the database password</li>
                </ol>
              </div>
            )}
            
            <a 
              href="/matches" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-xl hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              {error.action}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const liveMatches = matches.filter((m) => m.status === "LIVE");
  const upcomingMatches = matches.filter((m) => m.status !== "LIVE" && m.status !== "FINISHED" && m.status !== "CANCELLED");
  const finishedMatches = matches.filter((m) => m.status === "FINISHED" || m.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 md:px-0">
        
        {/* Header */}
        <div className="pt-8 pb-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-emerald-500 mb-1 tracking-wider">LIVE MARKETS</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Matches
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {liveMatches.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-bold text-red-500">{liveMatches.length} LIVE</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/30 rounded-full">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">{upcomingMatches.length} upcoming</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-xl py-3 -mx-4 px-4">
          <MatchFilters currentStatus={status} />
        </div>

        {/* Match List */}
        <main className="space-y-8">
          {matches.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl py-20 text-center">
              <div className="text-5xl mb-3">🏏</div>
              <p className="text-gray-500 font-medium text-sm">No match markets available</p>
              <p className="text-xs text-gray-600 mt-1">Check back later for upcoming matches</p>
            </div>
          ) : (
            <>
              {/* Live Matches Section */}
              {liveMatches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">In-Play</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
                  </div>
                  <div className="grid gap-3">
                    {liveMatches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Matches Section */}
              {upcomingMatches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming Schedule</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent" />
                  </div>
                  <div className="grid gap-3">
                    {upcomingMatches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Finished Matches Section (optional) */}
              {finishedMatches.length > 0 && (
                <div className="space-y-4 opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent" />
                  </div>
                  <div className="grid gap-3">
                    {finishedMatches.slice(0, 3).map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <div className="pt-8 text-center">
          <p className="text-[10px] text-gray-600">
            Betting available on toss winner • Odds subject to change
          </p>
        </div>
      </div>
    </div>
  );
}
