// src/app/matches/loading.tsx

export default function MatchesLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      {/* Header Skeleton */}
      <header className="flex items-end justify-between px-1 animate-pulse">
        <div className="space-y-3">
          <div className="h-10 w-48 bg-gray-800 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-800 rounded-full" />
            <div className="h-5 w-32 bg-gray-800 rounded-full" />
          </div>
        </div>
      </header>

      {/* Filter Bar Skeleton */}
      <div className="py-4">
        <div className="h-12 w-full bg-gray-900/50 border border-gray-800 rounded-2xl animate-pulse" />
      </div>

      {/* Match Cards Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="h-32 w-full bg-gray-900/40 border border-gray-800/50 rounded-[32px] animate-pulse relative overflow-hidden"
          >
            {/* Shimmer effect simulation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>
    </div>
  );
}